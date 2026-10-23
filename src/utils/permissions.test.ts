// @ts-nocheck
import { describe, expect, it } from 'bun:test';
import { canAccessView } from './permissions';

describe('view permissions used by navigation', () => {
  it('keeps dashboard and service desk available to every role', () => {
    expect(canAccessView('dashboard', 'USER')).toBe(true);
    expect(canAccessView('servicedesk', 'WORKER')).toBe(true);
  });

  it('does not expose restricted task, review, or scheduler navigation', () => {
    expect(canAccessView('tasks', 'USER')).toBe(false);
    expect(canAccessView('proofs', 'WORKER')).toBe(false);
    expect(canAccessView('scheduler', 'USER')).toBe(false);
    expect(canAccessView('scheduler', 'HEAD')).toBe(true);
  });
});
