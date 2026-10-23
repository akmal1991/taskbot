// @ts-nocheck
import { describe, expect, it } from 'bun:test';
import { LEGACY_STORAGE_KEY, readLegacySnapshot } from './appStorage';
describe('read-only browser migration support', () => {
  it('never loads a demo or user identity when storage is empty', () => {
    expect(readLegacySnapshot({ getItem: () => null })).toEqual({ raw: null, snapshot: null, error: null });
  });
  it('preserves the exact original snapshot without writes', () => {
    const raw = '{ "users": [], "tasks": [] }';
    const storage = { getItem: key => { expect(key).toBe(LEGACY_STORAGE_KEY); return raw; } };
    expect(readLegacySnapshot(storage)).toEqual({ raw, snapshot: { users: [], tasks: [] }, error: null });
  });
  it('retains corrupt source bytes rather than replacing them or a previous backup', () => {
    const result = readLegacySnapshot({ getItem: () => 'broken original' });
    expect(result.raw).toBe('broken original'); expect(result.snapshot).toBe(null); expect(result.error).toBeTruthy();
  });
  it('fails explicitly when storage is blocked', () => {
    expect(readLegacySnapshot({ getItem: () => { throw new Error('blocked'); } }).error).toBe('Browser storage is unavailable.');
  });
});
