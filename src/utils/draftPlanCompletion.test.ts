import { describe, expect, it } from 'bun:test';
import { mergeDraftCompletion } from './draftPlanCompletion';
import type { DraftPlanItem } from './draftPlanImport';

const source: DraftPlanItem = {
  number: 1, sectionNumber: 'I', sectionTitle: 'Section', title: 'Task', mechanism: 'Mechanism',
  schedule: '2026 Q4\n2027 Q1', fundingSource: 'Funding', oversight: '', responsible: '',
  distributedUnits: 'Source unit',
};
const incoming: DraftPlanItem = {
  ...source, responsible: 'Синов ижрочиси EX-001',
  completion: {
    planCode: 'TT-2026-001', priority: 'HIGH', category: 'I. Section',
    reviewer: 'Синов тақризчиси RV-001', responsibleDepartment: 'Source unit',
    sampleData: true, sampleResponsible: 'Синов ижрочиси EX-001',
  },
};
describe('completed draft enrichment', () => {
  it('preserves original source responsibilities and schedules, keeping samples separate', () => {
    const merged = mergeDraftCompletion([source], [incoming]);
    expect(merged[0].responsible).toBe('');
    expect(merged[0].schedule).toBe(source.schedule);
    expect(merged[0].completion?.sampleResponsible).toBe(incoming.responsible);
    expect(source).not.toHaveProperty('completion');
  });
  it('is idempotent after JSONB reorders object keys', () => {
    const saved = { ...source, completion: Object.fromEntries(Object.entries(incoming.completion!).reverse()) } as DraftPlanItem;
    expect(mergeDraftCompletion([saved], [incoming])[0]).toEqual({ ...source, completion: incoming.completion });
  });
  it('refuses source drift, lost items, overwriting reviewed metadata and real responsibilities', () => {
    expect(() => mergeDraftCompletion([source], [])).toThrow('sets do not match');
    expect(() => mergeDraftCompletion([source], [{ ...incoming, schedule: '2030' }])).toThrow('manual reconciliation');
    expect(() => mergeDraftCompletion([{ ...source, responsible: 'Existing owner' }], [incoming])).toThrow('responsibility changed');
    expect(() => mergeDraftCompletion([{ ...source, completion: { ...incoming.completion!, reviewer: 'Reviewed owner' } }], [incoming])).toThrow('already reviewed');
  });
});
