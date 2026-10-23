import type pg from 'pg';
import type { Actor, DB } from './db';
import { HttpError } from './db';

export const taskSelect = `SELECT t.*,to_char(t.deadline,'YYYY-MM-DD') AS deadline_text,
 a.full_name AS assignee_name,a.telegram_id AS assignee_telegram,a.telegram_username AS assignee_username,
 c.full_name AS creator_name,r.full_name AS approver_name,d.name AS department_name,s.title AS section_title
 FROM ut_tasks t JOIN ut_users a ON a.id=t.assignee_id JOIN ut_users c ON c.id=t.creator_id
 JOIN ut_departments d ON d.id=t.department_id LEFT JOIN ut_users r ON r.id=t.approver_id LEFT JOIN ut_sections s ON s.id=t.section_id`;
export const taskDto = (t: any) => ({
  ...t.data, id: t.id, planCode: t.plan_code, title: t.title, status: t.status, priority: t.priority,
  departmentId: t.department_id, departmentName: t.department_name, assignedToId: t.assignee_id,
  assignedToName: t.assignee_name, assignedToTelegramId: t.assignee_telegram, assignedToTelegramUsername: t.assignee_username,
  createdById: t.creator_id, createdByName: t.creator_name, approverId: t.approver_id || '',
  approverName: t.approver_name || '', deadline: t.deadline_text, progressPercent: t.progress,
  requiresEvidence: t.requires_evidence, requiresApproval: t.requires_approval, draft: t.draft,
  archivedAt: t.archived_at, version: t.version, workPlanId: t.work_plan_id, sectionId: t.section_id,
  sectionTitle: t.section_title, categoryId: t.category_id, createdAt: t.created_at, updatedAt: t.updated_at,
  isOverdue: !t.archived_at && !t.draft && t.status !== 'COMPLETED' &&
    t.deadline_text < new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tashkent', year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date()),
  isClockedIn: !['PENDING','ASSIGNED'].includes(t.status), proofs: [], comments: [],
});
export async function lockedTask(db: DB, taskId: string, actor: Actor, version?: number) {
  const t = (await db.query('SELECT * FROM ut_tasks WHERE id=$1 FOR UPDATE', [taskId])).rows[0];
  if (!t || (!actor.permissions.includes('tasks.readAll') && (t.assignee_id !== actor.id || t.draft || t.archived_at))) throw new HttpError(404, 'Task not found.');
  if (version !== undefined && t.version !== version) throw new HttpError(409, 'This task changed on another device. Reload it before saving.');
  return t;
}
export const requireExecutable = (task: any) => {
  if (task.archived_at || task.draft) throw new HttpError(409, 'Archived tasks and drafts cannot be executed.');
};
export async function getTasks(db: DB, actor: Actor) {
  const rows = (await db.query(`${taskSelect} WHERE ($1::boolean OR (t.assignee_id=$2 AND t.draft=false AND t.archived_at IS NULL))
    ORDER BY t.created_at DESC`, [actor.permissions.includes('tasks.readAll'), actor.id])).rows;
  const ids = rows.map(t => t.id);
  const tasks = rows.map(taskDto) as any[];
  if (!ids.length) return tasks;
  const evidence = (await db.query(`SELECT e.*,u.full_name AS author_name,r.decision,r.remarks,r.created_at AS reviewed_at,
    reviewer.full_name AS reviewer_name,a.filename,a.size FROM ut_evidence e JOIN ut_users u ON u.id=e.submitted_by
    LEFT JOIN ut_reviews r ON r.evidence_id=e.id LEFT JOIN ut_users reviewer ON reviewer.id=r.reviewer_id
    LEFT JOIN ut_attachments a ON a.id=e.attachment_id WHERE e.task_id=ANY($1::text[]) ORDER BY e.created_at DESC`, [ids])).rows;
  for (const e of evidence) {
    tasks.find(t => t.id === e.task_id).proofs.push({
      ...e.data, id: e.id, taskId: e.task_id, type: e.type, note: e.note, artifactUrl: e.artifact_url,
      fileName: e.filename || e.data?.fileName, fileSize: e.size ? `${e.size} bytes` : e.data?.fileSize,
      fileUrl: e.attachment_id ? `/api/attachments/${e.attachment_id}` : undefined,
      attachmentId: e.attachment_id, submittedBy: e.author_name, submittedById: e.submitted_by,
      submittedAt: e.created_at, status: e.decision || e.data?.legacyStatus || 'PENDING', reviewerRemarks: e.remarks || e.data?.legacyRemarks,
      reviewedAt: e.reviewed_at || e.data?.legacyReviewedAt, reviewedBy: e.reviewer_name || e.data?.legacyReviewedBy,
    });
  }
  const comments = (await db.query(`SELECT c.*,u.full_name,u.role,d.name AS department_name
    FROM ut_comments c JOIN ut_users u ON u.id=c.author_id LEFT JOIN ut_departments d ON d.id=u.department_id
    WHERE c.task_id=ANY($1::text[]) ORDER BY c.created_at`, [ids])).rows;
  const reactions = comments.length ? (await db.query('SELECT * FROM ut_reactions WHERE comment_id=ANY($1::text[])', [comments.map(c => c.id)])).rows : [];
  const commentMap = new Map(comments.map(c => [c.id, {
    id: c.id, taskId: c.task_id, parentId: c.parent_id, authorId: c.author_id, authorName: c.full_name,
    authorRole: c.role, authorRoleLabel: c.role, authorDepartment: c.department_name,
    content: c.content, createdAt: c.created_at, reactions: [] as any[], replies: [] as any[],
  }]));
  for (const r of reactions) {
    const c = commentMap.get(r.comment_id)!;
    let reaction = c.reactions.find(x => x.emoji === r.emoji);
    if (!reaction) { reaction = { emoji: r.emoji, count: 0, users: [] }; c.reactions.push(reaction); }
    reaction.count++; reaction.users.push(r.user_id);
  }
  for (const c of commentMap.values()) {
    if (c.parentId && commentMap.has(c.parentId)) commentMap.get(c.parentId)!.replies.push(c);
    else tasks.find(t => t.id === c.taskId).comments.push(c);
  }
  const dependencies = (await db.query('SELECT * FROM ut_dependencies WHERE task_id=ANY($1::text[])', [ids])).rows;
  for (const t of tasks) t.dependsOnIds = dependencies.filter(d => d.task_id === t.id).map(d => d.depends_on_id);
  return tasks;
}
export async function validateReferences(db: DB, fields: {
  assignedToId: string; departmentId: string; approverId?: string | null; workPlanId?: string | null; sectionId?: string | null; categoryId?: string | null;
}) {
  const assignee = (await db.query('SELECT * FROM ut_users WHERE id=$1 AND active=true', [fields.assignedToId])).rows[0];
  if (!assignee) throw new HttpError(400, 'Choose an active assignee.');
  if (!(await db.query('SELECT id FROM ut_departments WHERE id=$1 AND active=true', [fields.departmentId])).rowCount) throw new HttpError(400, 'Choose an active department.');
  if (assignee.department_id !== fields.departmentId &&
    !(await db.query('SELECT user_id FROM ut_memberships WHERE user_id=$1 AND department_id=$2', [fields.assignedToId, fields.departmentId])).rowCount)
    throw new HttpError(400, 'The assignee must belong to the selected department.');
  if (fields.approverId) {
    const reviewer = (await db.query("SELECT * FROM ut_users WHERE id=$1 AND active=true AND role IN ('ADMIN','DIRECTOR')", [fields.approverId])).rows[0];
    if (!reviewer || reviewer.id === fields.assignedToId) throw new HttpError(400, 'Choose an authorized reviewer other than the assignee.');
  }
  if (fields.workPlanId && !(await db.query('SELECT id FROM ut_work_plans WHERE id=$1 AND active=true', [fields.workPlanId])).rowCount)
    throw new HttpError(400, 'Work plan is unavailable.');
  if (fields.sectionId && !(await db.query('SELECT id FROM ut_sections WHERE id=$1 AND work_plan_id=$2', [fields.sectionId, fields.workPlanId])).rowCount)
    throw new HttpError(400, 'Choose a section belonging to the work plan.');
  if (fields.categoryId && !(await db.query('SELECT id FROM ut_categories WHERE id=$1 AND active=true', [fields.categoryId])).rowCount)
    throw new HttpError(400, 'Category is unavailable.');
}
