import { Router } from 'express';
import type pg from 'pg';
import { z } from 'zod';
import { ROLES, ROLE_CEILINGS, effectivePermissions } from '../shared/policy';
import { audit, HttpError, id, publicUser, transaction } from './db';
import { issueAccountToken, permit, wrap } from './security';
import { getTasks } from './records';
import { runNotificationJob, readSettings } from './notifications';
export const usersSelect = `SELECT u.*,d.name AS department_name FROM ut_users u LEFT JOIN ut_departments d ON d.id=u.department_id`;
export async function getDepartments(database: pg.Pool, actor?: Express.Request['actor']) {
  return (await database.query(`SELECT d.*,u.full_name AS coordinator_name,
    (SELECT count(*)::int FROM ut_memberships m WHERE m.department_id=d.id) AS staff_count,
    (SELECT count(*)::int FROM ut_tasks t WHERE t.department_id=d.id) AS task_count,
    (SELECT count(*)::int FROM ut_tasks t WHERE t.department_id=d.id AND t.status='COMPLETED') AS completed_count
    FROM ut_departments d LEFT JOIN ut_users u ON u.id=d.coordinator_id
    WHERE ($1::boolean OR d.id IN (SELECT department_id FROM ut_tasks WHERE assignee_id=$2) OR d.id IN (SELECT department_id FROM ut_users WHERE id=$2))
    ORDER BY d.name`, [!actor || actor.role !== 'WORKER', actor?.id || ''])).rows.map(d => ({
      id: d.id, code: d.code, name: d.name, active: d.active, coordinatorId: d.coordinator_id,
      headName: d.coordinator_name || '', staffCount: d.staff_count,
      totalTasksCount: d.task_count, completedTasksCount: d.completed_count, targetKpiPercent: d.data?.targetKpiPercent ?? 90,
    }));
}
const shortText = z.string().trim().min(1).max(200);
const accountInput = z.object({
  username: z.string().trim().regex(/^[A-Za-z0-9_.-]{3,64}$/),
  email: z.email().max(254), fullName: shortText, role: z.enum(ROLES),
  departmentId: z.string().max(128).nullable().optional(), phone: z.string().max(40).optional(),
});
const departmentInput = z.object({ code: shortText.max(30), name: shortText, coordinatorId: z.string().max(128).nullable().optional() });
async function membership(db: pg.PoolClient, userId: string, departmentId?: string | null) {
  if (!departmentId) return;
  if (!(await db.query('SELECT id FROM ut_departments WHERE id=$1 AND active=true', [departmentId])).rowCount) throw new HttpError(400, 'Choose an active department.');
  await db.query('INSERT INTO ut_memberships(user_id,department_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [userId, departmentId]);
}
export function adminRoutes(database: pg.Pool) {
  const router = Router();
  router.use((req, _res, next) => next(req.actor?.role === 'ADMIN' ? undefined : new HttpError(403, 'Administrator access required.')));
  router.get('/overview', wrap(async (req, res) => {
    const [users, departments, roles, plans, sections, categories, imports, deliveries, stats] = await Promise.all([
      database.query(`${usersSelect} ORDER BY u.full_name`), getDepartments(database),
      database.query('SELECT * FROM ut_role_permissions'), database.query('SELECT * FROM ut_work_plans ORDER BY year DESC,title'),
      database.query('SELECT * FROM ut_sections ORDER BY number'), database.query('SELECT * FROM ut_categories ORDER BY name'),
      database.query(`SELECT i.*,u.full_name AS operator_name FROM ut_import_jobs i JOIN ut_users u ON u.id=i.operator_id ORDER BY i.created_at DESC LIMIT 100`),
      database.query(`SELECT n.*,u.full_name AS recipient_name FROM ut_notifications n JOIN ut_users u ON u.id=n.user_id ORDER BY n.created_at DESC LIMIT 100`),
      database.query('SELECT (SELECT count(*)::int FROM ut_tasks) AS tasks,(SELECT count(*)::int FROM ut_users) AS users,(SELECT count(*)::int FROM ut_departments) AS departments'),
    ]);
    res.json({
      users: users.rows.map(publicUser), departments,
      rolePermissions: Object.fromEntries(ROLES.map(role => [role, effectivePermissions(role, roles.rows.find(r => r.role === role)?.permissions)])),
      permissionCeilings: ROLE_CEILINGS,
      workPlans: plans.rows.map(p => ({ ...p, sections: sections.rows.filter(s => s.work_plan_id === p.id) })),
      categories: categories.rows,
      imports: imports.rows.map(i => ({ id: i.id, source: i.source, rowCount: i.row_count, operatorName: i.operator_name, report: i.report, createdAt: i.created_at })),
      settings: await readSettings(database),
      deliveries: deliveries.rows.map(n => ({ id: n.id, title: n.title, recipientName: n.recipient_name, status: n.status,
        attempts: n.attempts, lastError: n.last_error, createdAt: n.created_at })),
      stats: stats.rows[0],
    });
  }));
  router.post('/users', permit('users.manage'), wrap(async (req, res) => {
    const input = accountInput.strict().parse(req.body), userId = id('user');
    const result = await transaction(database, async db => {
      if (input.departmentId && !(await db.query('SELECT id FROM ut_departments WHERE id=$1 AND active=true', [input.departmentId])).rowCount) throw new HttpError(400, 'Department unavailable.');
      await db.query(`INSERT INTO ut_users(id,username,email,full_name,role,department_id,data) VALUES($1,$2,$3,$4,$5,$6,$7)`,
        [userId, input.username, input.email.toLowerCase(), input.fullName, input.role, input.departmentId || null, JSON.stringify({ phone: input.phone })]);
      await membership(db, userId, input.departmentId);
      await audit(db, req, 'ACCOUNT_CREATED', userId, null, input);
      return issueAccountToken(db, userId, 'ACTIVATE');
    });
    res.status(201).json({ user: publicUser((await database.query(`${usersSelect} WHERE u.id=$1`, [userId])).rows[0]), ...result });
  }));
  router.patch('/users/:id', permit('users.manage'), wrap(async (req, res) => {
    const input = accountInput.partial().extend({ active: z.boolean().optional() }).strict().parse(req.body);
    await transaction(database, async db => {
      await db.query('SELECT pg_advisory_xact_lock(741202)');
      const user = (await db.query('SELECT * FROM ut_users WHERE id=$1 FOR UPDATE', [req.params.id])).rows[0];
      if (!user) throw new HttpError(404, 'Account not found.');
      const role = input.role ?? user.role, active = input.active ?? user.active;
      if (user.role === 'ADMIN' && user.active && (role !== 'ADMIN' || !active)) {
        const admins = await db.query("SELECT id FROM ut_users WHERE role='ADMIN' AND active=true");
        if (admins.rowCount! <= 1) throw new HttpError(409, 'The last active administrator cannot be disabled or demoted.');
      }
      if (active && !user.password_hash) throw new HttpError(409, 'Issue an activation link so this account can set its initial password.');
      const departmentId = input.departmentId === undefined ? user.department_id : input.departmentId;
      await membership(db, user.id, departmentId);
      await db.query(`UPDATE ut_users SET username=$2,email=$3,full_name=$4,role=$5,department_id=$6,active=$7,data=$8,auth_version=auth_version+1 WHERE id=$1`,
        [user.id, input.username ?? user.username, input.email?.toLowerCase() ?? user.email, input.fullName ?? user.full_name,
          role, departmentId || null, active, JSON.stringify({ ...user.data, phone: input.phone ?? user.data.phone ?? '' })]);
      await db.query('DELETE FROM ut_sessions WHERE user_id=$1', [user.id]);
      if (!active) await db.query('UPDATE ut_account_tokens SET consumed_at=now() WHERE user_id=$1 AND consumed_at IS NULL', [user.id]);
      await audit(db, req, 'ACCOUNT_UPDATED', user.id, publicUser(user), input);
    }); res.json({ ok: true });
  }));
  router.post('/users/:id/reset', permit('users.manage'), wrap(async (req, res) => {
    const { purpose } = z.object({ purpose: z.enum(['RESET','ACTIVATE']).default('RESET') }).strict().parse(req.body);
    const result = await transaction(database, async db => {
      const user = (await db.query('SELECT id,active FROM ut_users WHERE id=$1 FOR UPDATE', [req.params.id])).rows[0];
      if (!user) throw new HttpError(404, 'Account not found.');
      if (purpose === 'RESET' && !user.active) throw new HttpError(409, 'Use an activation link for an inactive account.');
      await audit(db, req, `ACCOUNT_${purpose}_ISSUED`, user.id);
      return issueAccountToken(db, user.id, purpose);
    }); res.json(result);
  }));
  router.put('/role-permissions/:role', permit('roles.manage'), wrap(async (req, res) => {
    const role = z.enum(ROLES).parse(req.params.role);
    const { permissions } = z.object({ permissions: z.array(z.string()).max(100) }).strict().parse(req.body);
    if (permissions.some(p => !ROLE_CEILINGS[role].includes(p as any))) throw new HttpError(400, 'A role cannot exceed its security ceiling.');
    if (role === 'ADMIN' && ROLE_CEILINGS.ADMIN.some(p => !permissions.includes(p))) throw new HttpError(400, 'Essential administrator permissions cannot be removed.');
    await transaction(database, async db => {
      const before = (await db.query('SELECT permissions FROM ut_role_permissions WHERE role=$1', [role])).rows[0]?.permissions;
      await db.query('INSERT INTO ut_role_permissions(role,permissions) VALUES($1,$2) ON CONFLICT(role) DO UPDATE SET permissions=excluded.permissions', [role, JSON.stringify([...new Set(permissions)])]);
      await audit(db, req, 'ROLE_PERMISSIONS_UPDATED', role, before || ROLE_CEILINGS[role], permissions);
    }); res.json({ ok: true });
  }));
  for (const create of [true, false]) {
    router[create ? 'post' : 'patch'](create ? '/departments' : '/departments/:id', permit('departments.manage'), wrap(async (req, res) => {
      const input = (create ? departmentInput.strict() : departmentInput.partial().extend({ active: z.boolean().optional() }).strict()).parse(req.body) as any;
      await transaction(database, async db => {
        const departmentId = create ? id('dept') : String(req.params.id);
        const before = create ? null : (await db.query('SELECT * FROM ut_departments WHERE id=$1 FOR UPDATE', [departmentId])).rows[0];
        if (!create && !before) throw new HttpError(404, 'Department not found.');
        const coordinator = input.coordinatorId === undefined ? before?.coordinator_id : input.coordinatorId;
        if (coordinator && !(await db.query('SELECT id FROM ut_users WHERE id=$1 AND active=true', [coordinator])).rowCount) throw new HttpError(400, 'Coordinator must be an active existing account.');
        if (create) await db.query('INSERT INTO ut_departments(id,code,name,coordinator_id) VALUES($1,$2,$3,$4)', [departmentId, input.code, input.name, coordinator || null]);
        else await db.query('UPDATE ut_departments SET code=$2,name=$3,coordinator_id=$4,active=$5 WHERE id=$1',
          [departmentId, input.code ?? before.code, input.name ?? before.name, coordinator || null, input.active ?? before.active]);
        await db.query('UPDATE ut_memberships SET coordinator=false WHERE department_id=$1 AND coordinator=true', [departmentId]);
        if (coordinator) await db.query('INSERT INTO ut_memberships(user_id,department_id,coordinator) VALUES($1,$2,true) ON CONFLICT(user_id,department_id) DO UPDATE SET coordinator=true', [coordinator, departmentId]);
        await audit(db, req, create ? 'DEPARTMENT_CREATED' : 'DEPARTMENT_UPDATED', departmentId, before, input);
      }); res.status(create ? 201 : 200).json({ ok: true });
    }));
  }
  const planInput = z.object({ title: shortText, year: z.number().int().min(2000).max(2200) });
  router.post('/work-plans', permit('workplans.manage'), wrap(async (req, res) => {
    const input = planInput.strict().parse(req.body), planId = id('plan');
    await transaction(database, async db => {
      await db.query('INSERT INTO ut_work_plans(id,title,year) VALUES($1,$2,$3)', [planId, input.title, input.year]);
      await audit(db, req, 'WORK_PLAN_CREATED', planId, null, input);
    }); res.status(201).json({ id: planId });
  }));
  router.patch('/work-plans/:id', permit('workplans.manage'), wrap(async (req, res) => {
    const input = planInput.partial().extend({ active: z.boolean().optional() }).strict().parse(req.body);
    await transaction(database, async db => {
      const before = (await db.query('SELECT * FROM ut_work_plans WHERE id=$1 FOR UPDATE', [req.params.id])).rows[0];
      if (!before) throw new HttpError(404, 'Work plan not found.');
      await db.query('UPDATE ut_work_plans SET title=$2,year=$3,active=$4 WHERE id=$1', [before.id, input.title ?? before.title, input.year ?? before.year, input.active ?? before.active]);
      await audit(db, req, 'WORK_PLAN_UPDATED', before.id, before, input);
    }); res.json({ ok: true });
  }));
  const sectionInput = z.object({ number: shortText.max(30), title: shortText });
  router.post('/work-plans/:id/sections', permit('workplans.manage'), wrap(async (req, res) => {
    const input = sectionInput.strict().parse(req.body), sectionId = id('section');
    await transaction(database, async db => {
      await db.query('INSERT INTO ut_sections(id,work_plan_id,number,title) VALUES($1,$2,$3,$4)', [sectionId, req.params.id, input.number, input.title]);
      await audit(db, req, 'SECTION_CREATED', sectionId, null, input);
    }); res.status(201).json({ id: sectionId });
  }));
  router.patch('/sections/:id', permit('workplans.manage'), wrap(async (req, res) => {
    const input = sectionInput.strict().parse(req.body);
    await transaction(database, async db => {
      const before = (await db.query('SELECT * FROM ut_sections WHERE id=$1 FOR UPDATE', [req.params.id])).rows[0];
      if (!before) throw new HttpError(404, 'Section not found.');
      await db.query('UPDATE ut_sections SET number=$2,title=$3 WHERE id=$1', [before.id, input.number, input.title]);
      await audit(db, req, 'SECTION_UPDATED', before.id, before, input);
    }); res.json({ ok: true });
  }));
  router.post('/categories', permit('workplans.manage'), wrap(async (req, res) => {
    const { name } = z.object({ name: shortText }).strict().parse(req.body), categoryId = id('category');
    await transaction(database, async db => {
      await db.query('INSERT INTO ut_categories(id,name) VALUES($1,$2)', [categoryId, name]);
      await audit(db, req, 'CATEGORY_CREATED', categoryId, null, { name });
    }); res.status(201).json({ id: categoryId });
  }));
  router.patch('/categories/:id', permit('workplans.manage'), wrap(async (req, res) => {
    const input = z.object({ name: shortText, active: z.boolean() }).partial().strict().parse(req.body);
    await transaction(database, async db => {
      const before = (await db.query('SELECT * FROM ut_categories WHERE id=$1 FOR UPDATE', [req.params.id])).rows[0];
      if (!before) throw new HttpError(404, 'Category not found.');
      await db.query('UPDATE ut_categories SET name=$2,active=$3 WHERE id=$1', [before.id, input.name ?? before.name, input.active ?? before.active]);
      await audit(db, req, 'CATEGORY_UPDATED', before.id, before, input);
    }); res.json({ ok: true });
  }));
  router.put('/settings', permit('settings.manage'), wrap(async (req, res) => {
    const input = z.object({ notificationsEnabled: z.boolean(), reminderHour: z.number().int().min(0).max(23), reminderTemplate: z.string().min(1).max(2000) }).strict().parse(req.body);
    await transaction(database, async db => {
      const before = await readSettings(db);
      await db.query("INSERT INTO ut_settings(key,value) VALUES('notifications',$1) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=now()", [JSON.stringify(input)]);
      await audit(db, req, 'SETTINGS_UPDATED', 'notifications', before, input);
    }); res.json({ ok: true });
  }));
  router.post('/deliveries/:id/retry', permit('notifications.manage'), wrap(async (req, res) => {
    await transaction(database, async db => {
      const row = (await db.query("UPDATE ut_notifications SET status='WAITING',next_attempt_at=now() WHERE id=$1 AND status='FAILED' RETURNING id", [req.params.id])).rows[0];
      if (!row) throw new HttpError(409, 'Only failed notifications can be retried.');
      await audit(db, req, 'NOTIFICATION_RETRY', row.id);
    }); res.json({ ok: true });
  }));
  router.post('/jobs/run', permit('notifications.manage'), wrap(async (req, res) => {
    const { job } = z.object({ job: z.enum(['reminders','delivery']) }).strict().parse(req.body);
    const processed = await runNotificationJob(database, job, req);
    res.json({ processed });
  }));
  return router;
}
