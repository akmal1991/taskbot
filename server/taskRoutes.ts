import { Router } from 'express';
import type pg from 'pg';
import multer from 'multer';
import { z } from 'zod';
import { id, HttpError, transaction, audit } from './db';
import { permit, wrap, digest } from './security';
import { lockedTask, requireExecutable, getTasks, validateReferences } from './records';
import { PRIORITIES } from '../shared/policy';
import { assignmentsOf, assignmentOf, isAssignee, updateAssignment } from './taskAssignments';

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v, 'Invalid date.');
const text = z.string().trim().max(20000);
export const taskInput = z.object({
  planCode: z.string().trim().min(1).max(100), title: text.min(1).max(500), description: text.optional(),
  expectedOutcome: text.optional(), acceptanceCriteria: text.optional(), sourceReference: text.optional(),
  fundingSource: text.optional(), assignedDate: date.optional(), assignedToId: z.string().min(1).max(128),
  departmentId: z.string().min(1).max(128), approverId: z.string().max(128).nullable().optional(),
  workPlanId: z.string().max(128).nullable().optional(), sectionId: z.string().max(128).nullable().optional(),
  categoryId: z.string().max(128).nullable().optional(), priority: z.enum(PRIORITIES), deadline: date,
  requiresEvidence: z.boolean().optional(), requiresApproval: z.boolean().optional(), draft: z.boolean().optional(),
  dependsOnIds: z.array(z.string().max(128)).max(100).optional(),
  additionalAssignees: z.array(z.object({ userId: z.string().min(1).max(128), departmentId: z.string().min(1).max(128) }).strict()).max(49).optional(),
});
const versionSchema = z.object({ version: z.number().int().positive() });
async function dependencies(db: pg.PoolClient, taskId: string, ids: string[]) {
  if (new Set(ids).size !== ids.length || ids.includes(taskId)) throw new HttpError(400, 'Invalid task dependencies.');
  for (const dependency of ids) {
    if (!(await db.query('SELECT id FROM ut_tasks WHERE id=$1', [dependency])).rowCount) throw new HttpError(400, 'Dependency task does not exist.');
    const cycle = await db.query(`WITH RECURSIVE chain(id) AS (
      SELECT depends_on_id FROM ut_dependencies WHERE task_id=$1 UNION
      SELECT d.depends_on_id FROM ut_dependencies d JOIN chain c ON d.task_id=c.id)
      SELECT id FROM chain WHERE id=$2`, [dependency, taskId]);
    if (cycle.rowCount) throw new HttpError(400, 'Task dependencies cannot contain a cycle.');
  }
  await db.query('DELETE FROM ut_dependencies WHERE task_id=$1', [taskId]);
  for (const dependency of ids) await db.query('INSERT INTO ut_dependencies(task_id,depends_on_id) VALUES($1,$2)', [taskId, dependency]);
}
export async function insertTask(db: pg.PoolClient, actorId: string, input: z.infer<typeof taskInput>, preserveId?: string) {
  await validateReferences(db, input);
  const team = [{ userId: input.assignedToId, departmentId: input.departmentId }, ...(input.additionalAssignees || [])];
  if (new Set(team.map(a => a.userId)).size !== team.length) throw new HttpError(400, 'Each assignee may only be selected once.');
  for (const member of team.slice(1)) await validateReferences(db, { assignedToId: member.userId, departmentId: member.departmentId, approverId: input.approverId });
  const taskId = preserveId || id('task');
  const data = { ...(team.length > 1 ? { assignments: team.map(a => ({ ...a, status: 'ASSIGNED', progress: 0 })) } : {}), description: input.description || '', expectedOutcome: input.expectedOutcome, acceptanceCriteria: input.acceptanceCriteria,
    sourceReference: input.sourceReference, fundingSource: input.fundingSource, assignedDate: input.assignedDate || new Date().toISOString().slice(0, 10) };
  await db.query(`INSERT INTO ut_tasks(id,plan_code,title,creator_id,assignee_id,approver_id,department_id,work_plan_id,section_id,category_id,
    deadline,status,priority,requires_evidence,requires_approval,draft,data) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'ASSIGNED',$12,$13,$14,$15,$16)`,
  [taskId, input.planCode, input.title, actorId, input.assignedToId, input.approverId || null, input.departmentId,
    input.workPlanId || null, input.sectionId || null, input.categoryId || null, input.deadline, input.priority,
    input.requiresEvidence ?? true, input.requiresApproval ?? true, input.draft ?? false, JSON.stringify(data)]);
  await dependencies(db, taskId, input.dependsOnIds || []);
  if (!input.draft) for (const member of team) await db.query(`INSERT INTO ut_notifications(id,user_id,task_id,type,title,body) VALUES($1,$2,$3,'NEW_ASSIGNMENT',$4,$5)`,
    [id('notice'), member.userId, taskId, input.planCode, `New task assigned: ${input.title}. Deadline: ${input.deadline}`]);
  return taskId;
}
export function taskRoutes(database: pg.Pool) {
  const router = Router();
  router.get('/', wrap(async (req, res) => {
    const all = await getTasks(database, req.actor!);
    const search = String(req.query.search || '').toLowerCase();
    const filtered = all.filter(t => (!search || `${t.planCode} ${t.title}`.toLowerCase().includes(search)) &&
      (!req.query.status || t.status === req.query.status) && (!req.query.departmentId || t.departmentId === req.query.departmentId || t.departmentIds?.includes(String(req.query.departmentId))));
    const page = Math.max(1, Number(req.query.page) || 1), pageSize = Math.min(200, Math.max(1, Number(req.query.pageSize) || 50));
    res.json({ items: filtered.slice((page - 1) * pageSize, page * pageSize), total: filtered.length, page, pageSize });
  }));
  router.post('/', permit('tasks.create'), wrap(async (req, res) => {
    const input = taskInput.strict().parse(req.body);
    const taskId = await transaction(database, async db => {
      const value = await insertTask(db, req.actor!.id, input);
      await audit(db, req, 'TASK_CREATED', value, null, input); return value;
    });
    res.status(201).json({ task: (await getTasks(database, req.actor!)).find(t => t.id === taskId) });
  }));
  router.patch('/:id', permit('tasks.edit'), wrap(async (req, res) => {
    const input = taskInput.omit({ planCode: true }).partial().extend({
      version: z.number().int().positive(), reason: text.optional(),
    }).strict().parse(req.body);
    await transaction(database, async db => {
      // Serialize dependency changes to protect cross-task cycle checks.
      await db.query('SELECT pg_advisory_xact_lock(741201)');
      const t = await lockedTask(db, String(req.params.id), req.actor!, input.version);
      if (input.additionalAssignees !== undefined) throw new HttpError(409, 'Team assignments are fixed after task creation.');
      if (t.data?.assignments && (input.assignedToId !== undefined || input.departmentId !== undefined || input.approverId !== undefined)) {
        if ((input.assignedToId !== undefined && input.assignedToId !== t.assignee_id) || (input.departmentId !== undefined && input.departmentId !== t.department_id)) throw new HttpError(409, 'Team assignments are fixed after task creation.');
        for (const member of assignmentsOf(t)) await validateReferences(db, { assignedToId: member.userId, departmentId: member.departmentId, approverId: input.approverId === undefined ? t.approver_id : input.approverId });
      }
      if (!t.draft && input.draft === true) throw new HttpError(409, 'Published tasks cannot become deletable drafts. Archive the record instead.');
      if (t.status === 'COMPLETED' && (!['ADMIN', 'PROREKTOR'].includes(req.actor!.role) || !input.reason?.trim()))
        throw new HttpError(403, 'Completed records require an administrator correction with a reason.');
      const merged = {
        assignedToId: input.assignedToId ?? t.assignee_id, departmentId: input.departmentId ?? t.department_id,
        approverId: input.approverId === undefined ? t.approver_id : input.approverId,
        workPlanId: input.workPlanId === undefined ? t.work_plan_id : input.workPlanId,
        sectionId: input.sectionId === undefined ? t.section_id : input.sectionId,
        categoryId: input.categoryId === undefined ? t.category_id : input.categoryId,
      };
      await validateReferences(db, merged);
      if (t.status === 'SUBMITTED_FOR_REVIEW' && (merged.assignedToId !== t.assignee_id || merged.approverId !== t.approver_id))
        throw new HttpError(409, 'Review the current submission before reassigning this task.');
      const payload = { ...t.data };
      for (const key of ['description','expectedOutcome','acceptanceCriteria','sourceReference','fundingSource','assignedDate'] as const)
        if (input[key] !== undefined) payload[key] = input[key];
      await db.query(`UPDATE ut_tasks SET title=$2,assignee_id=$3,department_id=$4,approver_id=$5,
        work_plan_id=$6,section_id=$7,category_id=$8,deadline=$9,priority=$10,requires_evidence=$11,requires_approval=$12,
        draft=$13,data=$14,version=version+1,updated_at=now() WHERE id=$1`,
      [t.id, input.title ?? t.title, merged.assignedToId, merged.departmentId, merged.approverId || null,
        merged.workPlanId || null, merged.sectionId || null, merged.categoryId || null,
        input.deadline ?? t.deadline, input.priority ?? t.priority, input.requiresEvidence ?? t.requires_evidence,
        input.requiresApproval ?? t.requires_approval, input.draft ?? t.draft, JSON.stringify(payload)]);
      if (input.dependsOnIds) await dependencies(db, t.id, input.dependsOnIds);
      if ((t.draft && input.draft === false) || (!t.draft && merged.assignedToId !== t.assignee_id)) {
        const recipients = t.data?.assignments ? assignmentsOf(t).map(member => member.userId) : [merged.assignedToId];
        for (const userId of recipients) await db.query(`INSERT INTO ut_notifications(id,user_id,task_id,type,title,body) VALUES($1,$2,$3,'NEW_ASSIGNMENT',$4,$5)`,
          [id('notice'), userId, t.id, t.plan_code, `New task assigned: ${input.title ?? t.title}. Deadline: ${input.deadline ?? new Date(t.deadline).toISOString().slice(0, 10)}`]);
      }
      await audit(db, req, t.status === 'COMPLETED' ? 'TASK_CORRECTED' : 'TASK_UPDATED', t.id, t, input, input.reason || '');
    });
    res.json({ ok: true });
  }));
  for (const action of ['archive', 'restore'] as const) router.post(`/:id/${action}`, permit('tasks.archive'), wrap(async (req, res) => {
    const input = versionSchema.extend({ reason: text.min(1) }).strict().parse(req.body);
    await transaction(database, async db => {
      const t = await lockedTask(db, String(req.params.id), req.actor!, input.version);
      await db.query(`UPDATE ut_tasks SET archived_at=${action === 'archive' ? 'now()' : 'NULL'},version=version+1,updated_at=now() WHERE id=$1`, [t.id]);
      await audit(db, req, action === 'archive' ? 'TASK_ARCHIVED' : 'TASK_RESTORED', t.id, t, null, input.reason);
    }); res.json({ ok: true });
  }));
  router.delete('/:id', permit('tasks.delete'), wrap(async (req, res) => {
    const input = versionSchema.extend({ reason: text.min(1) }).strict().parse(req.body);
    await transaction(database, async db => {
      const t = await lockedTask(db, String(req.params.id), req.actor!, input.version);
      const history = await db.query(`SELECT 1 FROM ut_evidence WHERE task_id=$1 UNION ALL SELECT 1 FROM ut_comments WHERE task_id=$1
        UNION ALL SELECT 1 FROM ut_dependencies WHERE task_id=$1 OR depends_on_id=$1 UNION ALL SELECT 1 FROM ut_attachments WHERE task_id=$1
        UNION ALL SELECT 1 FROM ut_notifications WHERE task_id=$1`, [t.id]);
      if (!t.draft || history.rowCount) throw new HttpError(409, 'Only unused drafts can be deleted. Archive historical records instead.');
      await db.query('DELETE FROM ut_tasks WHERE id=$1', [t.id]);
      await audit(db, req, 'DRAFT_DELETED', t.id, t, null, input.reason);
    }); res.json({ ok: true });
  }));
  router.post('/:id/start', permit('tasks.start'), wrap(async (req, res) => {
    const input = versionSchema.strict().parse(req.body);
    await transaction(database, async db => {
      const t = await lockedTask(db, String(req.params.id), req.actor!, input.version); requireExecutable(t);
      const own = assignmentOf(t, req.actor!.id);
      if (!own) throw new HttpError(403, 'Only the assignee may start a task.');
      if (!['ASSIGNED', 'PENDING'].includes(own.status)) throw new HttpError(409, 'Task has already started or cannot be started.');
      if ((await db.query(`SELECT 1 FROM ut_dependencies d JOIN ut_tasks t ON t.id=d.depends_on_id
        WHERE d.task_id=$1 AND t.status<>'COMPLETED'`, [t.id])).rowCount) throw new HttpError(409, 'Complete prerequisite tasks first.');
      await updateAssignment(db, t, req.actor!.id, 'IN_PROGRESS', own.progress);
      await audit(db, req, 'TASK_STARTED', t.id, { status: t.status }, { status: 'IN_PROGRESS' });
    }); res.json({ ok: true });
  }));
  router.post('/:id/progress', permit('tasks.progress'), wrap(async (req, res) => {
    const input = versionSchema.extend({ progressPercent: z.number().int().min(0).max(99) }).strict().parse(req.body);
    await transaction(database, async db => {
      const t = await lockedTask(db, String(req.params.id), req.actor!, input.version); requireExecutable(t);
      if (assignmentOf(t, req.actor!.id)?.status !== 'IN_PROGRESS') throw new HttpError(403, 'Only the assignee may update an in-progress task.');
      await updateAssignment(db, t, req.actor!.id, 'IN_PROGRESS', input.progressPercent);
      await audit(db, req, 'PROGRESS_UPDATED', t.id, { progress: t.progress }, input);
    }); res.json({ ok: true });
  }));
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 2 } });
  router.post('/:id/attachments', permit('tasks.submit'), upload.single('file'), wrap(async (req, res) => {
    if (!req.file) throw new HttpError(400, 'Choose a file.');
    const file = req.file;
    const magic = file.buffer.subarray(0, 8);
    const png = magic.equals(Buffer.from([137,80,78,71,13,10,26,10]));
    const jpg = magic[0] === 255 && magic[1] === 216 && magic[2] === 255;
    const pdf = file.buffer.subarray(0,5).toString() === '%PDF-';
    const mime = png ? 'image/png' : jpg ? 'image/jpeg' : pdf ? 'application/pdf' : null;
    if (!mime || mime !== file.mimetype) throw new HttpError(400, 'Only verified PDF, PNG, and JPEG files are accepted.');
    const attachmentId = id('attachment');
    await transaction(database, async db => {
      const t = await lockedTask(db, String(req.params.id), req.actor!); requireExecutable(t);
      if (assignmentOf(t, req.actor!.id)?.status !== 'IN_PROGRESS') throw new HttpError(403, 'Only the assignee may upload evidence for an in-progress task.');
      const filename = file.originalname.replace(/[^a-zA-Z0-9_. -]/g, '_').slice(0, 150);
      await db.query('INSERT INTO ut_attachments(id,task_id,owner_id,filename,mime,size,content) VALUES($1,$2,$3,$4,$5,$6,$7)',
        [attachmentId, t.id, req.actor!.id, filename, mime, file.size, file.buffer]);
      await audit(db, req, 'ATTACHMENT_UPLOADED', t.id, null, { attachmentId, filename, size: file.size });
    }); res.status(201).json({ id: attachmentId, filename: file.originalname, size: file.size });
  }));
  router.post('/:id/evidence', permit('tasks.submit'), wrap(async (req, res) => {
    const input = versionSchema.extend({
      type: z.enum(['IMAGE','DOCUMENT','TEXT_NOTE','URL']), note: text.optional(),
      attachmentId: z.string().max(128).optional(), artifactUrl: z.url().max(2000).optional(),
    }).strict().parse(req.body);
    if (input.artifactUrl && !/^https?:\/\//.test(input.artifactUrl)) throw new HttpError(400, 'Use an HTTP or HTTPS evidence link.');
    await transaction(database, async db => {
      const t = await lockedTask(db, String(req.params.id), req.actor!, input.version); requireExecutable(t);
      const own = assignmentOf(t, req.actor!.id);
      if (own?.status !== 'IN_PROGRESS') throw new HttpError(403, 'Only the assignee may submit an in-progress task.');
      if (t.requires_evidence && (input.note?.trim().length || 0) < 20) throw new HttpError(400, 'Evidence requires a note of at least 20 characters.');
      if ((await db.query(`SELECT 1 FROM ut_dependencies d JOIN ut_tasks t ON t.id=d.depends_on_id
        WHERE d.task_id=$1 AND t.status<>'COMPLETED'`, [t.id])).rowCount) throw new HttpError(409, 'Complete prerequisite tasks first.');
      if (['IMAGE','DOCUMENT'].includes(input.type) && !input.attachmentId) throw new HttpError(400, 'Upload the actual evidence file before submitting.');
      if (input.type === 'URL' && !input.artifactUrl) throw new HttpError(400, 'An evidence URL is required.');
      if (input.attachmentId) {
        const a = (await db.query('SELECT * FROM ut_attachments WHERE id=$1 AND task_id=$2 AND owner_id=$3', [input.attachmentId, t.id, req.actor!.id])).rows[0];
        if (!a) throw new HttpError(400, 'Evidence attachment does not belong to this task and account.');
        if ((input.type === 'IMAGE' && !a.mime.startsWith('image/')) || (input.type === 'DOCUMENT' && a.mime !== 'application/pdf')) throw new HttpError(400, 'Attachment type does not match the evidence type.');
      }
      const evidenceId = id('evidence');
      await db.query(`INSERT INTO ut_evidence(id,task_id,submitted_by,type,note,artifact_url,attachment_id)
        VALUES($1,$2,$3,$4,$5,$6,$7)`, [evidenceId, t.id, req.actor!.id, input.type, input.note || '', input.artifactUrl || null, input.attachmentId || null]);
      const status = t.requires_approval ? 'SUBMITTED_FOR_REVIEW' : 'COMPLETED';
      await updateAssignment(db, t, req.actor!.id, status, status === 'COMPLETED' ? 100 : Math.max(90, own.progress));
      await audit(db, req, 'EVIDENCE_SUBMITTED', t.id, { status: t.status }, { evidenceId, status });
      if (t.requires_approval && t.approver_id) await db.query('INSERT INTO ut_notifications(id,user_id,task_id,type,title,body) VALUES($1,$2,$3,$4,$5,$6)',
        [id('notice'), t.approver_id, t.id, 'PROOF_REVIEW_REQUEST', t.plan_code, 'Evidence is awaiting your review.']);
    }); res.status(201).json({ ok: true });
  }));
  router.post('/:id/reviews', permit('tasks.review'), wrap(async (req, res) => {
    const input = versionSchema.extend({ evidenceId: z.string().max(128), decision: z.enum(['APPROVED','REJECTED']), remarks: text.min(1) }).strict().parse(req.body);
    await transaction(database, async db => {
      const t = await lockedTask(db, String(req.params.id), req.actor!, input.version); requireExecutable(t);
      if (isAssignee(t, req.actor!.id) || (!['ADMIN', 'PROREKTOR'].includes(req.actor!.role) && t.approver_id && t.approver_id !== req.actor!.id))
        throw new HttpError(403, 'Self-approval and review by an undesignated reviewer are not allowed.');
      if (t.status !== 'SUBMITTED_FOR_REVIEW') throw new HttpError(409, 'Task is not awaiting review.');
      const candidate = (await db.query('SELECT * FROM ut_evidence WHERE task_id=$1 AND id=$2', [t.id, input.evidenceId])).rows[0];
      const evidence = candidate && (await db.query('SELECT * FROM ut_evidence WHERE task_id=$1 AND submitted_by=$2 ORDER BY created_at DESC LIMIT 1', [t.id, candidate.submitted_by])).rows[0];
      if (!evidence || evidence.id !== input.evidenceId || evidence.submitted_by === req.actor!.id) throw new HttpError(409, 'Review the current submission, not an older or unrelated record.');
      const submissionOwner = assignmentOf(t, evidence.submitted_by);
      if (submissionOwner?.status !== 'SUBMITTED_FOR_REVIEW') throw new HttpError(409, 'Task is not awaiting review.');
      if ((await db.query('SELECT id FROM ut_reviews WHERE evidence_id=$1', [evidence.id])).rowCount) throw new HttpError(409, 'This submission has already been reviewed.');
      await db.query('INSERT INTO ut_reviews(id,evidence_id,reviewer_id,decision,remarks) VALUES($1,$2,$3,$4,$5)',
        [id('review'), evidence.id, req.actor!.id, input.decision, input.remarks]);
      const status = input.decision === 'APPROVED' ? 'COMPLETED' : 'IN_PROGRESS';
      await updateAssignment(db, t, evidence.submitted_by, status, status === 'COMPLETED' ? 100 : Math.min(submissionOwner.progress, 89));
      await audit(db, req, `EVIDENCE_${input.decision}`, t.id, { status: t.status }, { status, evidenceId: evidence.id }, input.remarks);
      await db.query('INSERT INTO ut_notifications(id,user_id,task_id,type,title,body) VALUES($1,$2,$3,$4,$5,$6)',
        [id('notice'), evidence.submitted_by, t.id, `PROOF_${input.decision}`, t.plan_code, input.remarks]);
    }); res.json({ ok: true });
  }));
  router.post('/:id/comments', permit('tasks.comment'), wrap(async (req, res) => {
    const input = z.object({ content: text.min(1), parentId: z.string().max(128).optional() }).strict().parse(req.body);
    await transaction(database, async db => {
      const t = await lockedTask(db, String(req.params.id), req.actor!); requireExecutable(t);
      if (input.parentId && !(await db.query('SELECT id FROM ut_comments WHERE id=$1 AND task_id=$2', [input.parentId, t.id])).rowCount) throw new HttpError(400, 'Parent comment belongs to another task.');
      const commentId = id('comment');
      await db.query('INSERT INTO ut_comments(id,task_id,author_id,parent_id,content) VALUES($1,$2,$3,$4,$5)',
        [commentId, t.id, req.actor!.id, input.parentId || null, input.content]);
      await audit(db, req, 'COMMENT_ADDED', t.id, null, { commentId });
    }); res.status(201).json({ ok: true });
  }));
  router.post('/:id/reactions', permit('tasks.comment'), wrap(async (req, res) => {
    const input = z.object({ commentId: z.string().max(128), emoji: z.enum(['👍','✅','👏','❤️','🎯','🔥']) }).strict().parse(req.body);
    await transaction(database, async db => {
      const t = await lockedTask(db, String(req.params.id), req.actor!);
      if (!(await db.query('SELECT id FROM ut_comments WHERE id=$1 AND task_id=$2', [input.commentId, t.id])).rowCount) throw new HttpError(404, 'Comment not found.');
      const removed = await db.query('DELETE FROM ut_reactions WHERE comment_id=$1 AND user_id=$2 AND emoji=$3', [input.commentId, req.actor!.id, input.emoji]);
      if (!removed.rowCount) await db.query('INSERT INTO ut_reactions(comment_id,user_id,emoji) VALUES($1,$2,$3)', [input.commentId, req.actor!.id, input.emoji]);
    }); res.json({ ok: true });
  }));
  return router;
}
