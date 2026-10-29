import { Router } from 'express';
import type pg from 'pg';
import { z } from 'zod';
import { ROLES, LIFECYCLE, PRIORITIES } from '../shared/policy';
import { audit, HttpError, id, transaction } from './db';
import { digest, permit, wrap } from './security';
import { insertTask, taskInput } from './taskRoutes';
import { validateReferences } from './records';

const snapshotSchema = z.object({
  users: z.array(z.object({ id: z.string().min(1).max(128), fullName: z.string().min(1).max(200),
    email: z.email(), role: z.string().max(100) }).passthrough()).min(1).max(10000),
  departments: z.array(z.object({ id: z.string().min(1).max(128), code: z.string().min(1).max(30), name: z.string().min(1).max(200) }).passthrough()).max(2000),
  tasks: z.array(z.object({ id: z.string().min(1).max(128), planCode: z.string().min(1).max(100), title: z.string().min(1).max(500),
    assignedToId: z.string().min(1), departmentId: z.string().min(1), deadline: z.string() }).passthrough()).max(10000),
}).passthrough();
interface LegacySnapshot {
  users: Record<string, any>[]; departments: Record<string, any>[]; tasks: Record<string, any>[];
  auditLogs?: Record<string, any>[]; tickets?: Record<string, any>[]; [key: string]: any;
}
export function validateLegacySnapshot(snapshot: unknown) {
  const data = snapshotSchema.parse(snapshot) as LegacySnapshot;
  const users = new Set(data.users.map(u => u.id)), departments = new Set(data.departments.map(d => d.id));
  for (const [rows, key] of [[data.users, 'id'], [data.users, 'email'], [data.departments, 'id'], [data.departments, 'code'], [data.tasks, 'id'], [data.tasks, 'planCode']] as const) {
    if (new Set(rows.map(r => String(r[key]).toLowerCase())).size !== rows.length) throw new HttpError(400, `Duplicate ${key} in migration snapshot.`);
  }
  for (const u of data.users) if (u.departmentId && !departments.has(u.departmentId)) throw new HttpError(400, 'A legacy account references an unknown department.');
  for (const t of data.tasks) {
    if (!users.has(t.assignedToId) || !departments.has(t.departmentId)) throw new HttpError(400, `Task ${t.planCode} has an unresolved assignee or department.`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(t.deadline) || !Number.isFinite(Date.parse(t.deadline)) || new Date(t.deadline).toISOString().slice(0,10) !== t.deadline) throw new HttpError(400, `Task ${t.planCode} has an invalid deadline.`);
    if (![...LIFECYCLE, 'REJECTED', 'OVERDUE'].includes(t.status)) throw new HttpError(400, `Task ${t.planCode} has an unknown lifecycle state.`);
    if (!PRIORITIES.includes(t.priority) || !Number.isInteger(t.progressPercent) || t.progressPercent < 0 || t.progressPercent > 100) throw new HttpError(400, `Task ${t.planCode} has invalid priority or progress.`);
  }
  const evidenceIds = new Set<string>(), commentIds = new Set<string>();
  const inspectComment = (c: any) => {
    if (!c.id || commentIds.has(c.id) || !users.has(c.authorId) || typeof c.content !== 'string') throw new HttpError(400, 'Comments contain duplicate identifiers or unresolved authors.');
    commentIds.add(c.id); (c.replies || []).forEach(inspectComment);
  };
  for (const t of data.tasks) {
    for (const p of t.proofs || []) {
      if (!p.id || evidenceIds.has(p.id) || !users.has(p.submittedById || t.assignedToId)) throw new HttpError(400, 'Evidence contains duplicate identifiers or unresolved authors.');
      evidenceIds.add(p.id);
    }
    (t.comments || []).forEach(inspectComment);
  }
  const taskMap = new Map(data.tasks.map(t => [t.id, t]));
  const visiting = new Set<string>(), visited = new Set<string>();
  const inspectDependencies = (taskId: string) => {
    if (visiting.has(taskId)) throw new HttpError(400, 'Task dependencies cannot contain a cycle.');
    if (visited.has(taskId)) return;
    const task = taskMap.get(taskId);
    if (!task) throw new HttpError(400, 'Dependency task does not exist.');
    visiting.add(taskId);
    for (const dependency of task.dependsOnIds || []) inspectDependencies(dependency);
    visiting.delete(taskId); visited.add(taskId);
  };
  for (const taskId of taskMap.keys()) inspectDependencies(taskId);
  return data;
}
export const migratedStatus = (task: any) => task.status === 'REJECTED' ? 'IN_PROGRESS' :
  task.status === 'OVERDUE' ? (task.isClockedIn || task.progressPercent > 0 ? 'IN_PROGRESS' : 'ASSIGNED') : task.status;
const safeTime = (value: any) => {
  const date = new Date(value); return Number.isFinite(date.getTime()) ? date.toISOString() : new Date().toISOString();
};
const taskMapId = (taskId: unknown, tasks: Record<string, any>[]) => tasks.some(t => t.id === taskId) ? taskId : null;
async function checkLegacyCollisions(database: pg.Pool | pg.PoolClient, data: LegacySnapshot) {
  const result = await database.query(`SELECT id FROM ut_users WHERE id=ANY($1::text[]) OR lower(email)=ANY($2::text[])
    UNION ALL SELECT id FROM ut_departments WHERE id=ANY($3::text[]) OR code=ANY($4::text[])
    UNION ALL SELECT id FROM ut_tasks WHERE id=ANY($5::text[]) OR plan_code=ANY($6::text[])`,
  [data.users.map(u => u.id), data.users.map(u => u.email.toLowerCase()), data.departments.map(d => d.id),
    data.departments.map(d => d.code), data.tasks.map(t => t.id), data.tasks.map(t => t.planCode)]);
  if (result.rowCount) throw new HttpError(409, 'Snapshot conflicts with existing accounts, departments, or task numbers. Nothing has been overwritten. Resolve conflicts before importing.');
}
export function importRoutes(database: pg.Pool) {
  const router = Router();
  const batchSchema = z.object({ tasks: z.array(taskInput.strict()).min(1).max(2000), digest: z.string().optional(), source: z.string().max(200).default('Excel') }).strict();
  async function previewBatch(input: z.infer<typeof batchSchema>) {
    const errors: string[] = [], codes = new Set<string>();
    for (const [index, t] of input.tasks.entries()) {
      if (codes.has(t.planCode)) errors.push(`Row ${index + 1}: duplicate task number ${t.planCode}.`);
      codes.add(t.planCode);
      try { await validateReferences(database, t); } catch (error) { errors.push(`Row ${index + 1}: ${(error as Error).message}`); }
    }
    const existing = await database.query('SELECT plan_code FROM ut_tasks WHERE plan_code=ANY($1::text[])', [[...codes]]);
    for (const r of existing.rows) errors.push(`Task number ${r.plan_code} already exists.`);
    return { errors, digest: digest(JSON.stringify(input.tasks)), count: input.tasks.length };
  }
  router.post('/imports/preview', permit('imports.manage'), wrap(async (req, res) => res.json(await previewBatch(batchSchema.parse(req.body)))));
  router.post('/imports/commit', permit('imports.manage'), wrap(async (req, res) => {
    const input = batchSchema.parse(req.body), preview = await previewBatch(input);
    if (preview.errors.length) throw new HttpError(400, preview.errors.join('\n'));
    if (input.digest !== preview.digest) throw new HttpError(409, 'Import changed after preview. Preview it again.');
    const importId = id('import');
    await transaction(database, async db => {
      await db.query('SELECT pg_advisory_xact_lock(741201)');
      for (const task of input.tasks) await insertTask(db, req.actor!.id, task);
      await db.query('INSERT INTO ut_import_jobs(id,operator_id,source,row_count,digest,report) VALUES($1,$2,$3,$4,$5,$6)',
        [importId, req.actor!.id, input.source, input.tasks.length, input.digest, JSON.stringify({ imported: input.tasks.length, errors: [] })]);
      await audit(db, req, 'TASKS_IMPORTED', importId, null, { count: input.tasks.length, source: input.source });
    }); res.status(201).json({ imported: input.tasks.length });
  }));
  router.post('/admin/migration/preview', permit('users.manage'), wrap(async (req, res) => {
    const data = validateLegacySnapshot(req.body.snapshot);
    await checkLegacyCollisions(database, data);
    res.json({
      digest: digest(JSON.stringify(req.body.snapshot)),
      counts: { users: data.users.length, departments: data.departments.length, tasks: data.tasks.length,
        evidence: data.tasks.reduce((n, t) => n + (t.proofs?.length || 0), 0), auditLogs: data.auditLogs?.length || 0 },
      accounts: data.users.map(u => ({ id: u.id, fullName: u.fullName, legacyRole: u.role, suggestedRole: null })),
      warnings: [
        'Each legacy account needs an explicit reviewed role. Imported accounts remain inactive until password activation.',
        'Telegram identities must be verified again. Original identity metadata and historical actor roles are retained in the immutable snapshot.',
        'Browser-only attachment bytes cannot be recovered from filenames. Evidence metadata and original decisions are preserved.',
        'Legacy queue simulations are archived, not activated as real scheduled jobs. Unmatched ticket applicants remain in the original snapshot.',
      ],
    });
  }));
  router.post('/admin/migration/commit', permit('users.manage'), wrap(async (req, res) => {
    const input = z.object({ snapshot: z.unknown(), digest: z.string().length(64),
      roleMapping: z.record(z.string(), z.enum(ROLES)), backupConfirmed: z.literal(true) }).strict().parse(req.body);
    const data = validateLegacySnapshot(input.snapshot);
    if (digest(JSON.stringify(input.snapshot)) !== input.digest) throw new HttpError(409, 'Snapshot changed after preview.');
    if (data.users.some(u => !input.roleMapping[u.id]) || Object.keys(input.roleMapping).length !== data.users.length)
      throw new HttpError(400, 'Review and assign one of the three fixed roles for every legacy account.');
    const snapshotId = id('snapshot');
    await transaction(database, async db => {
      await db.query('SELECT pg_advisory_xact_lock(741202)');
      await db.query('SELECT pg_advisory_xact_lock(741201)');
      await checkLegacyCollisions(db, data);
      await db.query('INSERT INTO ut_legacy_snapshots(id,operator_id,digest,original,role_mapping) VALUES($1,$2,$3,$4,$5)',
        [snapshotId, req.actor!.id, input.digest, JSON.stringify(input.snapshot), JSON.stringify(input.roleMapping)]);
      for (const d of data.departments) await db.query('INSERT INTO ut_departments(id,code,name,data) VALUES($1,$2,$3,$4)', [d.id, d.code, d.name, JSON.stringify(d)]);
      for (const u of data.users) {
        await db.query('INSERT INTO ut_users(id,username,email,full_name,role,department_id,data) VALUES($1,$2,$3,$4,$5,$6,$7)',
          [u.id, `legacy_${digest(u.id).slice(0,20)}`, u.email.toLowerCase(), u.fullName, input.roleMapping[u.id], u.departmentId || null,
            JSON.stringify({ phone: u.phone || '', legacyTelegramId: u.telegramId, legacyTelegramUsername: u.telegramUsername, legacyRecord: u })]);
        if (u.departmentId) await db.query('INSERT INTO ut_memberships(user_id,department_id) VALUES($1,$2)', [u.id, u.departmentId]);
      }
      const planId = id('legacy-plan'), sectionMap = new Map<string, string>();
      await db.query('INSERT INTO ut_work_plans(id,title,year,data) VALUES($1,$2,$3,$4)', [planId, 'Migrated official work plan', new Date().getUTCFullYear(), JSON.stringify({ snapshotId })]);
      for (const t of data.tasks) if (t.sectionId && !sectionMap.has(t.sectionId)) {
        const sectionId = id('section'); sectionMap.set(t.sectionId, sectionId);
        await db.query('INSERT INTO ut_sections(id,work_plan_id,number,title) VALUES($1,$2,$3,$4)', [sectionId, planId, String(sectionMap.size), t.sectionTitle || t.sectionId]);
      }
      for (const t of data.tasks) {
        const creator = data.users.some(u => u.id === t.createdById) ? t.createdById : req.actor!.id;
        const approver = t.approverId !== t.assignedToId && ['ADMIN','PROREKTOR','DIRECTOR'].includes(input.roleMapping[t.approverId]) ? t.approverId : null;
        const status = migratedStatus(t);
        await db.query(`INSERT INTO ut_tasks(id,plan_code,title,creator_id,assignee_id,approver_id,department_id,work_plan_id,section_id,
          deadline,status,priority,progress,data,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [t.id, t.planCode, t.title, creator, t.assignedToId, approver, t.departmentId, planId, sectionMap.get(t.sectionId) || null,
          t.deadline, status, t.priority, status === 'COMPLETED' ? 100 : Math.min(99, t.progressPercent),
          JSON.stringify({ description: t.description || '', expectedOutcome: t.expectedOutcome, acceptanceCriteria: t.acceptanceCriteria,
            sourceReference: t.sourceReference, fundingSource: t.fundingSource, assignedDate: t.assignedDate,
            legacySnapshotId: snapshotId, legacyRecord: t }), safeTime(t.createdAt), safeTime(t.updatedAt)]);
        for (const p of t.proofs || []) {
          await db.query(`INSERT INTO ut_evidence(id,task_id,submitted_by,type,note,artifact_url,created_at,data)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8)`, [p.id, t.id, p.submittedById || t.assignedToId,
          ['IMAGE','DOCUMENT','TEXT_NOTE','URL'].includes(p.type) ? p.type : 'TEXT_NOTE', p.note || '',
          /^https?:\/\//.test(p.artifactUrl || '') ? p.artifactUrl : null, safeTime(p.submittedAt),
          JSON.stringify({ fileName: p.fileName, fileSize: p.fileSize, legacyStatus: p.status, legacyRemarks: p.reviewerRemarks,
            legacyReviewedAt: p.reviewedAt, legacyReviewedBy: p.reviewedBy, original: p })]);
          const reviewers = data.users.filter(u => p.reviewedById ? u.id === p.reviewedById : u.fullName === p.reviewedBy);
          const reviewer = reviewers.length === 1 ? reviewers[0] : undefined;
          if (reviewer && reviewer.id !== (p.submittedById || t.assignedToId) &&
            ['ADMIN','PROREKTOR','DIRECTOR'].includes(input.roleMapping[reviewer.id]) && ['APPROVED','REJECTED'].includes(p.status))
            await db.query('INSERT INTO ut_reviews(id,evidence_id,reviewer_id,decision,remarks,created_at) VALUES($1,$2,$3,$4,$5,$6)',
              [id('review'), p.id, reviewer.id, p.status, p.reviewerRemarks || '', safeTime(p.reviewedAt || p.submittedAt)]);
        }
        const insertComment = async (comment: any, parent: string | null = null) => {
          await db.query('INSERT INTO ut_comments(id,task_id,author_id,parent_id,content,created_at) VALUES($1,$2,$3,$4,$5,$6)',
            [comment.id, t.id, comment.authorId, parent, comment.content, safeTime(comment.createdAt)]);
          for (const reaction of comment.reactions || []) for (const userId of [...new Set(reaction.users || [])]) {
            if (data.users.some(u => u.id === userId) && typeof reaction.emoji === 'string' && reaction.emoji.length <= 10)
              await db.query('INSERT INTO ut_reactions(comment_id,user_id,emoji) VALUES($1,$2,$3) ON CONFLICT DO NOTHING', [comment.id, userId, reaction.emoji]);
          }
          for (const reply of comment.replies || []) await insertComment(reply, comment.id);
        };
        for (const comment of t.comments || []) await insertComment(comment);
      }
      for (const t of data.tasks) for (const dependency of t.dependsOnIds || [])
        await db.query('INSERT INTO ut_dependencies(task_id,depends_on_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [t.id, dependency]);
      for (const notification of data.notifications || []) {
        const owner = data.users.find(u => notification.userId ? u.id === notification.userId :
          u.telegramId && u.telegramId === notification.telegramId);
        if (!owner) continue;
        const taskId = taskMapId(notification.taskId, data.tasks);
        await db.query(`INSERT INTO ut_notifications(id,user_id,task_id,type,title,body,read_at,status,last_error,next_attempt_at,created_at)
          VALUES($1,$2,$3,$4,$5,$6,$7,'FAILED','Imported history: not queued for automatic delivery','infinity',$8)`,
          [notification.id || id('notice'), owner.id, taskId, notification.type || 'HISTORICAL',
            notification.title || '', notification.messageText || '', notification.isRead ? safeTime(notification.sentAt) : null, safeTime(notification.sentAt)]);
      }
      for (const a of data.auditLogs || []) {
        const known = data.users.some(u => u.id === a.actorId);
        await db.query(`INSERT INTO ut_audit(actor_id,actor_name,actor_role,action,target_id,details,before_data,after_data,ip_address,created_at)
          VALUES($1,$2,$3,$4,$5,$6,NULL,$7,$8,$9)`,
        [known ? a.actorId : null, String(a.actorName || 'Historical actor'), known ? input.roleMapping[a.actorId] : 'HISTORICAL',
          String(a.action || 'LEGACY_EVENT'), a.targetId || null, String(a.details || ''), JSON.stringify({ historicalOriginal: a, snapshotId }), String(a.ipAddress || ''), safeTime(a.createdAt)]);
      }
      for (const ticket of data.tickets || []) {
        const owner = data.users.find(u => u.email.toLowerCase() === String(ticket.applicantEmail).toLowerCase());
        if (owner && data.departments.some(d => d.id === ticket.departmentId)) await db.query(
          `INSERT INTO ut_tickets(id,number,user_id,department_id,title,description,priority,status,response_note,created_at,resolved_at)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [ticket.id, ticket.ticketNumber, owner.id, ticket.departmentId, ticket.title, ticket.description, ticket.priority,
            ['NEW','PROCESSING','RESOLVED','CLOSED'].includes(ticket.status) ? ticket.status : 'NEW', ticket.responseNote || null,
            safeTime(ticket.createdAt), ticket.resolvedAt ? safeTime(ticket.resolvedAt) : null]);
      }
      await db.query('INSERT INTO ut_import_jobs(id,operator_id,source,row_count,digest,report) VALUES($1,$2,$3,$4,$5,$6)',
        [id('import'), req.actor!.id, 'Reviewed legacy snapshot', data.tasks.length, input.digest, JSON.stringify({ snapshotId, users: data.users.length })]);
      await audit(db, req, 'LEGACY_MIGRATED', snapshotId, null, { digest: input.digest, tasks: data.tasks.length, users: data.users.length });
    }); res.status(201).json({ imported: true });
  }));
  return router;
}
