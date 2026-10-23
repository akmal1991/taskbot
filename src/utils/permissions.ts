import type { UserRole } from '../types';
import type { Permission } from '../../shared/policy';

const viewRoles: Record<string, readonly UserRole[]> = {
  dashboard: ['DIRECTOR', 'ADMIN', 'WORKER'],
  tasks: ['DIRECTOR', 'ADMIN', 'WORKER'],
  proofs: ['DIRECTOR', 'ADMIN'],
  excel: ['ADMIN'],
  users: ['ADMIN'],
  admin: ['ADMIN'],
  scheduler: ['ADMIN'],
  audit: ['DIRECTOR', 'ADMIN'],
  servicedesk: ['DIRECTOR', 'ADMIN', 'WORKER'],
  account: ['DIRECTOR', 'ADMIN', 'WORKER'],
};

const viewPermissions: Record<string, Permission> = { proofs: 'tasks.review', excel: 'imports.manage', users: 'users.manage',
  admin: 'users.manage', scheduler: 'notifications.manage', audit: 'audit.read' };
export const canAccessView = (view: string, role: UserRole, permissions?: readonly Permission[]): boolean =>
  (viewRoles[view]?.includes(role) ?? false) && (!permissions || !viewPermissions[view] || permissions.includes(viewPermissions[view]));
