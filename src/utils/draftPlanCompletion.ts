import type { DraftPlanItem } from './draftPlanImport';

/** Enrich a known source snapshot, never replace reviewed source or operational IDs. */
export function mergeDraftCompletion(existing: DraftPlanItem[], incoming: DraftPlanItem[]): DraftPlanItem[] {
  const source = new Map(existing.map(item => [item.number, item]));
  if (source.size !== existing.length || new Set(incoming.map(item => item.number)).size !== incoming.length ||
      existing.length !== incoming.length) throw new Error('Draft item sets do not match.');
  const unchanged = ['sectionNumber', 'sectionTitle', 'title', 'mechanism', 'schedule',
    'fundingSource', 'oversight', 'distributedUnits'] as const;
  const updates = new Map(incoming.map(item => {
    const previous = source.get(item.number);
    if (!previous || unchanged.some(key => previous[key] !== item[key])) {
      throw new Error(`Source item ${item.number} changed; manual reconciliation is required.`);
    }
    if (!item.completion) throw new Error(`Completed fields missing for item ${item.number}.`);
    if (previous.responsible !== item.responsible &&
        !(item.completion.sampleData && item.completion.sampleResponsible === item.responsible &&
          /^Синов ижрочиси /.test(item.responsible) && !previous.responsible.trim())) {
      throw new Error(`Source responsibility changed for item ${item.number}.`);
    }
    const completionKeys = ['planCode', 'priority', 'category', 'reviewer', 'responsibleDepartment', 'sampleData', 'sampleResponsible'] as const;
    if (previous.completion && completionKeys.some(key => previous.completion![key] !== item.completion![key])) {
      throw new Error(`Completed fields already reviewed for item ${item.number}; manual reconciliation is required.`);
    }
    return [item.number, { ...previous, completion: item.completion }] as const;
  }));
  return existing.map(item => updates.get(item.number)!);
}
