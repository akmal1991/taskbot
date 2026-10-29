// @ts-nocheck
import { describe, expect, it } from 'bun:test';
import { canAccessView } from './permissions';
import { ROLES, effectivePermissions, ROLE_CEILINGS } from '../../shared/policy';
describe('fixed role and navigation policy', () => {
  it('defines the supported roles and never grants a role-switching path', () => {
    expect(ROLES).toEqual(['ADMIN','PROREKTOR','DIRECTOR','WORKER']);
    expect(canAccessView('admin','HEAD')).toBe(false);
    expect(canAccessView('dashboard','USER')).toBe(false);
  });
  it('keeps operational navigation separate from security administration', () => {
    expect(canAccessView('tasks','DIRECTOR')).toBe(true);
    expect(canAccessView('proofs','WORKER')).toBe(false);
    for (const view of ['users','admin','excel','scheduler']) expect(canAccessView(view,'DIRECTOR')).toBe(false);
    expect(canAccessView('admin','ADMIN')).toBe(true);
  });
  it('enforces permission ceilings even for corrupt configuration', () => {
    expect(effectivePermissions('WORKER',['users.manage','tasks.submit'])).toEqual(['tasks.submit']);
    expect(effectivePermissions('DIRECTOR',['roles.manage'])).toEqual([]);
    expect(effectivePermissions('ADMIN',[])).toEqual([...ROLE_CEILINGS.ADMIN]);
    expect(effectivePermissions('PROREKTOR',[])).toEqual(effectivePermissions('ADMIN'));
    for (const view of ['dashboard','tasks','proofs','excel','users','admin','scheduler','audit','servicedesk','account']) expect(canAccessView(view,'PROREKTOR')).toBe(canAccessView(view,'ADMIN'));
    expect(canAccessView('proofs','DIRECTOR',[])).toBe(false);
  });
});
