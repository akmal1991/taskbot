// Read-only migration support. Browser records are never identity or authoritative state.
export const LEGACY_STORAGE_KEY = 'unitask_app_data_v1';
export interface LegacySnapshotRead { raw: string | null; snapshot: unknown; error: string | null; }
export function readLegacySnapshot(storage?: Pick<Storage, 'getItem'>): LegacySnapshotRead {
  try {
    const source = storage || (typeof window !== 'undefined' ? window.localStorage : null);
    const raw = source?.getItem(LEGACY_STORAGE_KEY) ?? null;
    if (!raw) return { raw, snapshot: null, error: null };
    try { return { raw, snapshot: JSON.parse(raw), error: null }; }
    catch { return { raw, snapshot: null, error: 'The original browser snapshot is not valid JSON. Export it unchanged before repairing it.' }; }
  } catch { return { raw: null, snapshot: null, error: 'Browser storage is unavailable.' }; }
}
