import type { DB } from './db';

export interface TaskAssignment { userId: string; departmentId: string; status: string; progress: number; }
export function assignmentsOf(task: any): TaskAssignment[] {
  return Array.isArray(task.data?.assignments) ? task.data.assignments : [{ userId: task.assignee_id, departmentId: task.department_id, status: task.status, progress: task.progress }];
}
export const isAssignee = (task: any, userId: string) => assignmentsOf(task).some(a => a.userId === userId);
export const assignmentOf = (task: any, userId: string) => assignmentsOf(task).find(a => a.userId === userId);
export async function updateAssignment(db: DB, task: any, userId: string, status: string, progress: number) {
  if (!task.data?.assignments) {
    await db.query('UPDATE ut_tasks SET status=$2,progress=$3,version=version+1,updated_at=now() WHERE id=$1', [task.id, status, progress]);
    return;
  }
  const assignments = assignmentsOf(task).map(a => a.userId === userId ? { ...a, status, progress } : a);
  const aggregateStatus = assignments.every(a => a.status === 'COMPLETED') ? 'COMPLETED' :
    assignments.some(a => a.status === 'SUBMITTED_FOR_REVIEW') ? 'SUBMITTED_FOR_REVIEW' :
    assignments.some(a => ['IN_PROGRESS', 'COMPLETED'].includes(a.status)) ? 'IN_PROGRESS' : 'ASSIGNED';
  const aggregateProgress = Math.floor(assignments.reduce((sum, a) => sum + a.progress, 0) / assignments.length);
  await db.query('UPDATE ut_tasks SET status=$2,progress=$3,data=$4,version=version+1,updated_at=now() WHERE id=$1',
    [task.id, aggregateStatus, aggregateProgress, JSON.stringify({ ...task.data, assignments })]);
}
