import * as XLSX from 'xlsx';

export interface DraftPlanSection {
  number: string;
  title: string;
}

export interface DraftPlanItem {
  number: number;
  sectionNumber: string;
  sectionTitle: string;
  title: string;
  mechanism: string;
  schedule: string;
  fundingSource: string;
  oversight: string;
  responsible: string;
  distributedUnits: string;
  completion?: {
    planCode: string;
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    category: string;
    reviewer: string;
    responsibleDepartment: string;
    sampleData: boolean;
    sampleResponsible?: string;
  };
}

export interface DraftPlanImport {
  title: string;
  year: number;
  sourceName: string;
  sections: DraftPlanSection[];
  items: DraftPlanItem[];
}

const cleanCell = (value: unknown) => String(value ?? '').trim();
const normalizeHeader = (value: unknown) =>
  cleanCell(value).replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').toLocaleLowerCase();

const requiredHeaders = [
  'Т/р',
  'Иш режа номи',
  'Амалга ошириш механизми',
  'Бажариш муддати',
  'Молиялаштириш манбалари',
  'Назорат',
  'Ижро учун масъул',
  'Тақсимланган бўлинмалар (бўлинма иш режасидаги банд рақамлари)',
];

export function parseDraftPlanWorkbook(
  fileBuffer: ArrayBuffer | Uint8Array,
  sourceName: string,
): DraftPlanImport {
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) throw new Error('The workbook has no sheets.');

  const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[firstSheet], {
    header: 1,
    defval: '',
    blankrows: false,
    raw: false,
  });
  const headerIndex = rows.findIndex(row => {
    const headers = row.map(normalizeHeader);
    return normalizeHeader('Т/р') === headers[0] &&
      headers.includes(normalizeHeader('Иш режа номи')) &&
      headers.includes(normalizeHeader('Бажариш муддати'));
  });
  if (headerIndex < 0) {
    throw new Error('This is not a supported ToshTech work-plan workbook.');
  }

  const headers = rows[headerIndex].map(normalizeHeader);
  const columns = requiredHeaders.map(header => headers.indexOf(normalizeHeader(header)));
  if (columns.some(index => index < 0)) {
    throw new Error('The workbook is missing required work-plan columns.');
  }
  const completionColumns = [
    ['Режа коди'], ['Устуворлик', 'Устуворлик даражаси'], ['Иш режаси тоифаси'],
    ['Тақризчи'], ['Масъул бўлинма'],
  ].map(aliases => headers.findIndex(header =>
    aliases.some(alias => header.split('(')[0].trim() === normalizeHeader(alias))));
  const hasCompletion = completionColumns.some(index => index >= 0);
  if (hasCompletion && completionColumns.some(index => index < 0)) {
    throw new Error('The completed workbook contains invalid or incomplete task fields.');
  }
  const sampleWorkbook = rows.slice(0, headerIndex + 1).flatMap(row => row)
    .some(value => /намунавий|синов маълумоти/i.test(cleanCell(value)));

  const title = rows.slice(0, headerIndex)
    .flatMap(row => row)
    .map(cleanCell)
    .find(Boolean);
  if (!title) throw new Error('The workbook title is missing.');

  const yearText = sourceName.match(/20\d{2}/)?.[0] || title.match(/20\d{2}/)?.[0];
  const year = Number(yearText);
  if (!Number.isInteger(year) || year < 2000 || year > 2200) {
    throw new Error('Could not determine the work-plan year from the file name or title.');
  }

  const sections: DraftPlanSection[] = [];
  const items: DraftPlanItem[] = [];
  let currentSection: DraftPlanSection | undefined;

  for (const row of rows.slice(headerIndex + 1)) {
    const firstCell = cleanCell(row[columns[0]]);
    const sectionMatch = firstCell.match(/^([IVXLCDM]+)\.\s*(.+)$/i);
    if (sectionMatch) {
      currentSection = { number: sectionMatch[1].toUpperCase(), title: sectionMatch[2].trim() };
      sections.push(currentSection);
      continue;
    }

    if (!firstCell) continue;
    if (!/^\d+$/.test(firstCell)) continue;
    if (!currentSection) throw new Error('A numbered work-plan item is missing its section heading.');

    const number = Number(firstCell);
    items.push({
      number,
      sectionNumber: currentSection.number,
      sectionTitle: currentSection.title,
      title: cleanCell(row[columns[1]]),
      mechanism: cleanCell(row[columns[2]]),
      schedule: cleanCell(row[columns[3]]),
      fundingSource: cleanCell(row[columns[4]]),
      oversight: cleanCell(row[columns[5]]),
      responsible: cleanCell(row[columns[6]]),
      distributedUnits: cleanCell(row[columns[7]]),
    });
    if (hasCompletion) {
      const [planCode, priorityLabel, category, reviewer, responsibleDepartment] =
        completionColumns.map(column => cleanCell(row[column]));
      const priority = priorityLabel.replace(/^[^A-Z]+/, '');
      if (!/^[A-Za-z0-9][A-Za-z0-9_.-]{1,99}$/.test(planCode) ||
          !['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(priority) ||
          category !== `${currentSection.number}. ${currentSection.title}` ||
          !reviewer || !responsibleDepartment) {
        throw new Error('The completed workbook contains invalid or incomplete task fields.');
      }
      const item = items[items.length - 1];
      item.completion = {
        planCode, priority: priority as NonNullable<DraftPlanItem['completion']>['priority'],
        category, reviewer, responsibleDepartment,
        sampleData: sampleWorkbook || /синов маълумоти/i.test(item.responsible + reviewer),
        ...(/^Синов ижрочиси /i.test(item.responsible) ? { sampleResponsible: item.responsible } : {}),
      };
    }
  }

  if (!sections.length || !items.length) {
    throw new Error('No numbered work-plan items were found.');
  }
  const sectionNumbers = sections.map(section => section.number);
  const itemNumbers = items.map(item => item.number);
  if (new Set(sectionNumbers).size !== sectionNumbers.length ||
      new Set(itemNumbers).size !== itemNumbers.length) {
    throw new Error('The workbook contains duplicate section or item numbers.');
  }
  if (items.some(item => !item.title)) {
    throw new Error('Every numbered work-plan item must have a title.');
  }
  const codes = items.flatMap(item => item.completion ? [item.completion.planCode] : []);
  if (new Set(codes).size !== codes.length) {
    throw new Error('The completed workbook contains duplicate plan codes.');
  }
  // The source title mentions the end year (2027); final filenames may omit 2026.
  // A consistent explicit plan-code year identifies the completed plan instead.
  const codeYears = new Set(codes.map(code => code.match(/^TT-(20\d{2})-\d+$/)?.[1]).filter(Boolean));
  if (codeYears.size > 1) throw new Error('The completed workbook contains invalid or incomplete task fields.');

  return {
    title,
    year: codeYears.size === 1 ? Number([...codeYears][0]) : year,
    sourceName: sourceName.replace(/^.*[\\/]/, '').slice(0, 255),
    sections,
    items,
  };
}
