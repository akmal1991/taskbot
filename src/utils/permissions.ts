import type { UserRole } from '../types';

const viewRoles: Record<string, readonly UserRole[]> = {
  dashboard: ['DIRECTOR', 'HEAD', 'ADMIN', 'WORKER', 'USER'],
  tasks: ['DIRECTOR', 'HEAD', 'ADMIN', 'WORKER'],
  proofs: ['DIRECTOR', 'HEAD', 'ADMIN'],
  excel: ['DIRECTOR', 'HEAD', 'ADMIN'],
  users: ['DIRECTOR', 'HEAD', 'ADMIN'],
  scheduler: ['DIRECTOR', 'HEAD', 'ADMIN'],
  audit: ['DIRECTOR', 'ADMIN'],
  servicedesk: ['DIRECTOR', 'HEAD', 'ADMIN', 'WORKER', 'USER'],
};

export const canAccessView = (view: string, role: UserRole): boolean =>
  viewRoles[view]?.includes(role) ?? false;
