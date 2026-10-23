export const ROLES = ['ADMIN', 'DIRECTOR', 'WORKER'] as const;
export type Role = typeof ROLES[number];
export const PERMISSIONS = [
  'users.manage', 'roles.manage', 'departments.manage', 'settings.manage',
  'tasks.readAll', 'tasks.create', 'tasks.edit', 'tasks.archive', 'tasks.delete',
  'tasks.start', 'tasks.progress', 'tasks.submit', 'tasks.comment', 'tasks.review',
  'workplans.manage', 'imports.manage', 'reports.export', 'audit.read',
  'notifications.manage', 'tickets.resolve',
] as const;
export type Permission = typeof PERMISSIONS[number];
export const ROLE_CEILINGS: Record<Role, readonly Permission[]> = {
  ADMIN: PERMISSIONS,
  DIRECTOR: ['tasks.readAll', 'tasks.create', 'tasks.edit', 'tasks.start', 'tasks.progress',
    'tasks.submit', 'tasks.comment', 'tasks.review', 'reports.export', 'audit.read', 'tickets.resolve'],
  WORKER: ['tasks.start', 'tasks.progress', 'tasks.submit', 'tasks.comment'],
};
export const effectivePermissions = (role: Role, configured?: readonly string[]): Permission[] => {
  if (role === 'ADMIN') return [...PERMISSIONS];
  return ROLE_CEILINGS[role].filter(p => !configured || configured.includes(p));
};
export const LIFECYCLE = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'SUBMITTED_FOR_REVIEW', 'COMPLETED'] as const;
export const PRIORITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;
export const canSeeTask = (actor: { id: string; role: Role }, task: { assignee_id: string }) =>
  actor.role !== 'WORKER' || actor.id === task.assignee_id;
