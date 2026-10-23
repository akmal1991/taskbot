import { describe, expect, it } from 'bun:test';
import * as XLSX from 'xlsx';
import { parseDraftPlanWorkbook } from './draftPlanImport';

const headers = [
  'Т/р',
  'Иш режа номи',
  'Амалга ошириш механизми',
  'Бажариш муддати',
  'Молиялаштириш манбалари',
  'Назорат',
  'Ижро учун масъул',
  'Тақсимланган бўлинмалар\n(бўлинма иш режасидаги банд рақамлари)',
];

function workbookBuffer(rows: unknown[][]) {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), 'Иш режа');
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
}

describe('draft work-plan workbook import', () => {
  it('preserves source sections, task text, and multi-date schedules without assignments', () => {
    const buffer = workbookBuffer([
      ['2027 йил сентябрь ойига қадар ToshTech иш режаси'],
      headers,
      ['I. Биринчи бўлим'],
      [1, 'Биринчи вазифа', '1. Биринчи қадам\n2. Иккинчи қадам', '2026 йил IV чорак\n2027 йил I чорак', 'Университет маблағлари', 'Проректор', 'Масъул шахс', 'Бўлим — 1-банд'],
      ['II. Иккинчи бўлим'],
      [2, 'Иккинчи вазифа', 'Амалга ошириш механизми', '2027 йил II чорак', 'Қўшимча маблағ талаб этилмайди', '', 'Бошқа масъул', 'Бўлим — 2-банд'],
    ]);

    const plan = parseDraftPlanWorkbook(buffer, 'ToshTech_2026_2027.xlsx');
    expect(plan.year).toBe(2026);
    expect(plan.sections.map(section => section.number)).toEqual(['I', 'II']);
    expect(plan.items).toHaveLength(2);
    expect(plan.items[0].schedule).toBe('2026 йил IV чорак\n2027 йил I чорак');
    expect(plan.items[0].mechanism).toContain('2. Иккинчи қадам');
    expect(plan.items[0].responsible).toBe('Масъул шахс');
    expect(plan.items[0]).not.toHaveProperty('assignedToId');
  });

  it('rejects duplicate item numbers and unsupported workbook layouts', () => {
    const duplicate = workbookBuffer([
      ['ToshTech 2026 plan'],
      headers,
      ['I. Section'],
      [1, 'Task one'],
      [1, 'Task duplicate'],
    ]);
    expect(() => parseDraftPlanWorkbook(duplicate, 'ToshTech_2026.xlsx'))
      .toThrow('duplicate section or item numbers');

    const unsupported = workbookBuffer([['Title'], ['Number', 'Task']]);
    expect(() => parseDraftPlanWorkbook(unsupported, 'ToshTech_2026.xlsx'))
      .toThrow('not a supported ToshTech work-plan workbook');
  });
  const completedHeaders = [...headers, 'Режа коди', 'Устуворлик (намунавий тақсимот)',
    'Иш режаси тоифаси (манба бўлимидан)', 'Тақризчи (манба / синов маълумоти)',
    'Масъул бўлинма (намунавий тақсимот)'];
  const completedRow = [1, 'Task', 'Mechanism', '2026 Q4\n2027 Q1', 'Source funding', '',
    'Синов ижрочиси EX-001 (синов маълумоти)', 'Source unit',
    'TT-2026-001', '🟠 HIGH', 'I. Section', 'Синов тақризчиси RV-001', 'Source unit'];
  it('imports final fields and uses the code year when the filename omits it', () => {
    const plan = parseDraftPlanWorkbook(workbookBuffer([
      ['2027 йил сентябрь ойига қадар иш режаси', '', 'НАМУНАВИЙ МАЪЛУМОТ'],
      completedHeaders, ['I. Section'], completedRow,
    ]), 'ToshTech_Work_Plan_Final.xlsx');
    expect(plan.year).toBe(2026);
    expect(plan.items[0].completion).toEqual({
      planCode: 'TT-2026-001', priority: 'HIGH', category: 'I. Section',
      reviewer: 'Синов тақризчиси RV-001', responsibleDepartment: 'Source unit',
      sampleData: true, sampleResponsible: String(completedRow[6]),
    });
    expect(plan.items[0]).not.toHaveProperty('assignedToId');
  });
  it('rejects invalid final priorities, categories, missing fields and duplicate plan codes', () => {
    for (const [index, value] of [[9, 'URGENT'], [10, 'II. Wrong section'], [11, '']] as const) {
      const row = [...completedRow]; row[index] = value;
      expect(() => parseDraftPlanWorkbook(workbookBuffer([
        ['2027 plan'], completedHeaders, ['I. Section'], row,
      ]), 'Final.xlsx')).toThrow('invalid or incomplete task fields');
    }
    const duplicate = [...completedRow]; duplicate[0] = 2;
    expect(() => parseDraftPlanWorkbook(workbookBuffer([
      ['2027 plan'], completedHeaders, ['I. Section'], completedRow, duplicate,
    ]), 'Final.xlsx')).toThrow('duplicate plan codes');
  });
});
