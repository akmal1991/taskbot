import express from 'express';
import type pg from 'pg';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { ZodError, z } from 'zod';
import { audit, id, HttpError, publicUser, transaction } from './db';
import { authRoutes, csrfGuard, digest, issueAccountToken, loadSession, originGuard, permit, requireAuth, wrap } from './security';
import { taskRoutes } from './taskRoutes';
import { adminRoutes, getDepartments, usersSelect } from './adminRoutes';
import { importRoutes } from './importRoutes';
import { getTasks, lockedTask } from './records';
import { readSettings } from './notifications';
import { verifyTelegramInitData } from './telegramAuth';

export function createApplication(database: pg.Pool, options: { telegramBotToken?: string } = {}) {
  const app = express();
  app.disable('x-powered-by'); app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: process.env.NODE_ENV === 'production' ? { directives: {
    defaultSrc:["'self'"], scriptSrc:["'self'",'https://telegram.org'], styleSrc:["'self'","'unsafe-inline'",'https://fonts.googleapis.com'],
    fontSrc:["'self'",'https://fonts.gstatic.com','data:'], imgSrc:["'self'",'https:','data:','blob:'],
    connectSrc:["'self'"], objectSrc:["'none'"], baseUri:["'self'"], formAction:["'self'"],
    frameAncestors:["'self'",'https://web.telegram.org'],
  } } : false, frameguard:false, strictTransportSecurity: process.env.NODE_ENV === 'production' ? undefined : false }));
  const api = express.Router();
  api.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
  api.use(rateLimit({ windowMs: 60000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false,
    message: { error: 'Too many requests. Please wait a minute.' } }));
  api.use(express.json({ limit: '12mb' }));
  api.use(originGuard);
  api.get('/health', wrap(async (_req, res) => {
    await database.query('SELECT version FROM ut_schema_migrations WHERE version=1');
    res.json({ ok: true });
  }));
  api.use(loadSession(database));
  api.use('/auth', authRoutes(database));
  api.use(requireAuth, csrfGuard);
  api.use('/tasks', taskRoutes(database));
  api.use('/admin', adminRoutes(database));
  api.use(importRoutes(database));
  api.get('/state', wrap(async (req, res) => {
    const actor = req.actor!;
    const [tasks, departments, users, logs, notifications, tickets, plans, sections, categories, jobs] = await Promise.all([
      getTasks(database, actor), getDepartments(database, actor),
      database.query(`${usersSelect} WHERE ($1::boolean OR u.id=$2) ORDER BY u.full_name`, [actor.role !== 'WORKER', actor.id]),
      actor.permissions.includes('audit.read') ? database.query(`SELECT * FROM ut_audit
        WHERE ($1::boolean OR action LIKE 'TASK%' OR action LIKE 'EVIDENCE%' OR action IN ('COMMENT_ADDED','PROGRESS_UPDATED','ATTACHMENT_UPLOADED','REPORT_EXPORTED'))
        ORDER BY created_at DESC LIMIT 500`, [actor.role === 'ADMIN']) : Promise.resolve({ rows: [] }),
      database.query('SELECT * FROM ut_notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 200', [actor.id]),
      database.query(`SELECT t.*,u.full_name,u.email,u.data,d.name AS department_name FROM ut_tickets t JOIN ut_users u ON u.id=t.user_id
        JOIN ut_departments d ON d.id=t.department_id WHERE ($1::boolean OR t.user_id=$2) ORDER BY t.created_at DESC`, [actor.permissions.includes('tickets.resolve'), actor.id]),
      database.query(`SELECT DISTINCT p.id,p.title,p.year,p.active FROM ut_work_plans p LEFT JOIN ut_tasks t ON t.work_plan_id=p.id
        WHERE ($1::boolean OR t.assignee_id=$2) AND ($3::boolean OR p.data->>'draftImportKind' IS DISTINCT FROM 'UNASSIGNED_DRAFT')
        ORDER BY p.year DESC`, [actor.role !== 'WORKER', actor.id, actor.role === 'ADMIN']),
      database.query(`SELECT DISTINCT s.* FROM ut_sections s JOIN ut_work_plans p ON p.id=s.work_plan_id
        LEFT JOIN ut_tasks t ON t.section_id=s.id WHERE ($1::boolean OR t.assignee_id=$2)
        AND ($3::boolean OR p.data->>'draftImportKind' IS DISTINCT FROM 'UNASSIGNED_DRAFT')
        ORDER BY s.number`, [actor.role !== 'WORKER', actor.id, actor.role === 'ADMIN']),
      database.query('SELECT * FROM ut_categories WHERE active=true ORDER BY name'),
      actor.role === 'ADMIN' ? database.query("SELECT * FROM ut_settings WHERE key LIKE 'job:%'") : Promise.resolve({ rows: [] }),
    ]);
    res.json({
      tasks, departments, users: users.rows.map(publicUser),
      auditLogs: logs.rows.map(a => ({ id: String(a.id), action: a.action, actorId: a.actor_id, actorName: a.actor_name,
        actorRole: a.actor_role, targetId: a.target_id, details: a.details || JSON.stringify(a.after_data || {}), ipAddress: a.ip_address, createdAt: a.created_at })),
      notifications: notifications.rows.map(n => ({ id: n.id, telegramId: actor.telegramId || '', recipientName: actor.fullName,
        type: n.type, title: n.title, messageText: n.body, taskId: n.task_id, sentAt: n.created_at,
        isRead: Boolean(n.read_at), deliveryStatus: n.status })),
      tickets: tickets.rows.map(t => ({ id: t.id, ticketNumber: t.number, title: t.title, description: t.description,
        departmentId: t.department_id, departmentName: t.department_name, applicantName: t.full_name, applicantEmail: t.email,
        applicantPhone: t.data?.phone || '', status: t.status, priority: t.priority, createdAt: t.created_at, responseNote: t.response_note, resolvedAt: t.resolved_at })),
      queueJobs: actor.role === 'ADMIN' ? ['reminders','delivery'].map(name => {
        const previous = jobs.rows.find(j => j.key === `job:${name}`)?.value;
        return { id: name, name, queue: name === 'reminders' ? 'CRON_SCHEDULER' : 'TELEGRAM_SENDER', status: previous ? 'COMPLETED' : 'WAITING',
          scheduledTime: name === 'delivery' ? 'Every minute' : 'Configured Tashkent hour', lastRun: previous?.lastRun,
          payloadSummary: previous ? `${previous.processed} processed` : 'No runs recorded', retries: 0 };
      }) : [],
      workPlans: plans.rows.map(p => ({ ...p, sections: sections.rows.filter(s => s.work_plan_id === p.id) })),
      sections: sections.rows.map(s => ({ id: s.id, number: s.number, title: s.title, workPlanId: s.work_plan_id, taskCount: tasks.filter(t => t.sectionId === s.id).length })),
      categories: categories.rows,
    });
  }));
  api.get('/attachments/:id', wrap(async (req, res) => {
    const row = (await database.query(`SELECT a.*,t.assignee_id,t.draft,t.archived_at FROM ut_attachments a JOIN ut_tasks t ON t.id=a.task_id WHERE a.id=$1`, [req.params.id])).rows[0];
    if (!row || (!req.actor!.permissions.includes('tasks.readAll') && (row.assignee_id !== req.actor!.id || row.draft || row.archived_at))) throw new HttpError(404, 'Attachment not found.');
    res.setHeader('Content-Type', row.mime);
    res.setHeader('Content-Disposition', `attachment; filename="${row.filename.replace(/["\\\r\n]/g, '_')}"`);
    res.setHeader('Content-Security-Policy', "sandbox; default-src 'none'");
    res.send(row.content);
  }));
  api.post('/notifications/:id/read', wrap(async (req, res) => {
    if (!(await database.query('UPDATE ut_notifications SET read_at=now() WHERE id=$1 AND user_id=$2 RETURNING id', [req.params.id, req.actor!.id])).rowCount) throw new HttpError(404, 'Notification not found.');
    res.json({ ok: true });
  }));
  api.post('/tickets', wrap(async (req, res) => {
    const input = z.object({ title: z.string().trim().min(1).max(200), description: z.string().trim().min(1).max(20000),
      departmentId: z.string().max(128), priority: z.enum(['HIGH','MEDIUM','LOW']) }).strict().parse(req.body);
    const ticketId = id('ticket');
    await transaction(database, async db => {
      if (!(await db.query('SELECT id FROM ut_departments WHERE id=$1 AND active=true', [input.departmentId])).rowCount) throw new HttpError(400, 'Department unavailable.');
      const number = `SD-${new Date().getUTCFullYear()}-${ticketId.slice(-12).toUpperCase()}`;
      await db.query('INSERT INTO ut_tickets(id,number,user_id,department_id,title,description,priority) VALUES($1,$2,$3,$4,$5,$6,$7)',
        [ticketId, number, req.actor!.id, input.departmentId, input.title, input.description, input.priority]);
      await audit(db, req, 'TICKET_CREATED', ticketId);
    }); res.status(201).json({ id: ticketId });
  }));
  api.post('/tickets/:id/resolve', permit('tickets.resolve'), wrap(async (req, res) => {
    const { responseNote } = z.object({ responseNote: z.string().trim().min(1).max(20000) }).strict().parse(req.body);
    await transaction(database, async db => {
      if (!(await db.query("UPDATE ut_tickets SET status='RESOLVED',response_note=$2,resolved_at=now() WHERE id=$1 AND status IN ('NEW','PROCESSING') RETURNING id", [req.params.id, responseNote])).rowCount) throw new HttpError(409, 'Ticket not found or already resolved.');
      await audit(db, req, 'TICKET_RESOLVED', String(req.params.id), null, null, responseNote);
    }); res.json({ ok: true });
  }));
  api.post('/telegram/link-token', wrap(async (req, res) => {
    res.json(await transaction(database, async db => issueAccountToken(db, req.actor!.id, 'TELEGRAM')));
  }));
  api.post('/telegram/link', wrap(async (req, res) => {
    const input = z.object({ token: z.string().max(128), initData: z.string().max(8192) }).strict().parse(req.body);
    const botToken = options.telegramBotToken ?? process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) throw new HttpError(503, 'Telegram authentication is not configured.');
    const verified = verifyTelegramInitData(input.initData, botToken, { maxAgeSeconds: 300 });
    if (!verified.ok) throw new HttpError(403, 'Telegram signature is invalid or expired.');
    await transaction(database, async db => {
      const token = (await db.query(`SELECT * FROM ut_account_tokens WHERE token_hash=$1 AND user_id=$2 AND purpose='TELEGRAM'
        AND consumed_at IS NULL AND expires_at>now() FOR UPDATE`, [digest(input.token), req.actor!.id])).rows[0];
      if (!token) throw new HttpError(403, 'Telegram linking token is invalid or expired.');
      await db.query('UPDATE ut_users SET telegram_id=$2,telegram_username=$3 WHERE id=$1', [req.actor!.id, String(verified.user.id), verified.user.username || null]);
      await db.query('UPDATE ut_account_tokens SET consumed_at=now() WHERE token_hash=$1', [digest(input.token)]);
      await audit(db, req, 'TELEGRAM_LINKED', req.actor!.id);
    }); res.json({ ok: true });
  }));
  api.post('/telegram/unlink', wrap(async (req, res) => {
    await transaction(database, async db => {
      await db.query('UPDATE ut_users SET telegram_id=NULL,telegram_username=NULL WHERE id=$1', [req.actor!.id]);
      await audit(db, req, 'TELEGRAM_UNLINKED', req.actor!.id);
    }); res.json({ ok: true });
  }));
  api.post('/telegram/authorize-action', wrap(async (req, res) => {
    const input = z.object({ initData: z.string().max(8192), action: z.enum(['SESSION_CHECK','CLOCK_IN','SUBMIT_PROOF','APPROVE_PROOF','REJECT_PROOF']),
      taskId: z.string().max(128).default('') }).strict().parse(req.body);
    const botToken = options.telegramBotToken ?? process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) throw new HttpError(503, 'Telegram authentication is not configured.');
    const verified = verifyTelegramInitData(input.initData, botToken);
    if (!verified.ok || String(verified.user.id) !== req.actor!.telegramId) throw new HttpError(403, 'Telegram account does not match this signed-in account.');
    if (input.action !== 'SESSION_CHECK') await transaction(database, async db => {
      const t = await lockedTask(db, input.taskId, req.actor!);
      if (t.archived_at || t.draft) throw new HttpError(409, 'Task is not executable.');
      const review = ['APPROVE_PROOF','REJECT_PROOF'].includes(input.action);
      const permission = review ? 'tasks.review' : input.action === 'CLOCK_IN' ? 'tasks.start' : 'tasks.submit';
      if (!req.actor!.permissions.includes(permission) || (review ? t.assignee_id === req.actor!.id ||
        (req.actor!.role !== 'ADMIN' && t.approver_id && t.approver_id !== req.actor!.id) : t.assignee_id !== req.actor!.id))
        throw new HttpError(403, 'This Telegram action is not permitted for this account and task.');
    });
    res.json({ authorized: true, user: { id: verified.user.id }, authDate: verified.authDate });
  }));
  api.get('/reports/tasks.csv', permit('reports.export'), wrap(async (req, res) => {
    const tasks = await getTasks(database, req.actor!);
    const cell = (v: unknown) => `"${String(v ?? '').replace(/^[=+\-@\t\r]/, "'$&").replaceAll('"','""')}"`;
    const csv = [['Number','Title','Status','Assignee','Department','Deadline','Progress'].map(cell).join(','),
      ...tasks.map(t => [t.planCode,t.title,t.status,t.assignedToName,t.departmentName,t.deadline,t.progressPercent].map(cell).join(','))].join('\r\n');
    await audit(database, req, 'REPORT_EXPORTED', undefined, null, { count: tasks.length });
    res.type('text/csv').attachment('unitask-report.csv').send('\uFEFF' + csv);
  }));
  api.use((_req, _res, next) => next(new HttpError(404, 'API endpoint not found.')));
  api.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (error instanceof ZodError) { res.status(400).json({ error: 'Invalid form values. Check required fields and formats.',
      fields: error.issues.map(i => ({ field: i.path.join('.'), code: i.code })) }); return; }
    if (error.code === '23505' && error.constraint === 'ut_users_username_unique') {
      res.status(409).json({ error: 'This username is already used by another account. Choose a different username or edit the existing account.', fields: [{ field: 'username', code: 'duplicate' }] }); return;
    }
    if (error.code === '23505' && error.constraint === 'ut_users_email_unique') {
      res.status(409).json({ error: 'This email is already used by another account. Use a different email or edit the existing account.', fields: [{ field: 'email', code: 'duplicate' }] }); return;
    }
    const status = error.status || (error.code === '23505' ? 409 : ['23503','23514','22P02'].includes(error.code) ? 400 : error.code === 'LIMIT_FILE_SIZE' ? 413 : 500);
    if (status >= 500) console.error('API request failed', { code: error.code || 'INTERNAL_ERROR' });
    res.status(status).json({ error: error instanceof HttpError ? error.message : status === 409 ? 'A conflicting record already exists. Nothing was overwritten.' :
      status === 400 ? 'Invalid record reference or value.' : status === 413 ? 'The file or request is too large.' : 'Service unavailable. Please retry or contact an administrator.' });
  });
  app.use('/api', api);
  return app;
}
