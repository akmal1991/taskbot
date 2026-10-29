import type { UserRole } from '../types';
import type { Permission } from '../../shared/policy';

const viewRoles: Record<string, readonly UserRole[]> = {
  dashboard: ['DIRECTOR', 'ADMIN', 'PROREKTOR', 'WORKER'],
  tasks: ['DIRECTOR', 'ADMIN', 'PROREKTOR', 'WORKER'],
  proofs: ['DIRECTOR', 'ADMIN', 'PROREKTOR'],
  excel: ['ADMIN', 'PROREKTOR'],
  users: ['ADMIN', 'PROREKTOR'],
  admin: ['ADMIN', 'PROREKTOR'],
  scheduler: ['ADMIN', 'PROREKTOR'],
  audit: ['DIRECTOR', 'ADMIN', 'PROREKTOR'],
  servicedesk: ['DIRECTOR', 'ADMIN', 'PROREKTOR', 'WORKER'],
  account: ['DIRECTOR', 'ADMIN', 'PROREKTOR', 'WORKER'],
};

const viewPermissions: Record<string, Permission> = { proofs: 'tasks.review', excel: 'imports.manage', users: 'users.manage',
  admin: 'users.manage', scheduler: 'notifications.manage', audit: 'audit.read' };
export const canAccessView = (view: string, role: UserRole, permissions?: readonly Permission[]): boolean =>
  (viewRoles[view]?.includes(role) ?? false) && (!permissions || !viewPermissions[view] || permissions.includes(viewPermissions[view]));
