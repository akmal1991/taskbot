import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import test from 'node:test';
import * as XLSX from 'xlsx';
import { ExcelImportErrors } from '../components/ExcelImportErrors';
import {
  canApplyExcelImport,
  commitExcelImportIfValid,
  parseExcelWorkPlan,
  parseExcelWorkbook,
} from './excel';
import type { Department, User } from '../types';

const departments: Department[] = [{
  id: 'dept-1',
  code: 'D1',
  name: 'Engineering',
  headName: 'Department Head',
  staffCount: 1,
  completedTasksCount: 0,
  totalTasksCount: 0,
  targetKpiPercent: 80,
}];

const users: User[] = [{
  id: 'user-1',
  fullName: 'Worker One',
  role: 'WORKER',
  roleLabel: 'Worker',
  email: '',
  phone: '',
  isTelegramBound: false,
}];

function bufferForRows(rows: Record<string, unknown>[], headers?: string[]): ArrayBuffer {
  const sheet = headers
    ? XLSX.utils.aoa_to_sheet([headers, ...rows.map(row => headers.map(header => row[header] ?? ''))])
    : XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Work plan');
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
}

test('reports an empty workbook without producing importable tasks', async () => {
  const emptyBuffer = bufferForRows([], ['Title']);
  const report = await parseExcelWorkPlan(emptyBuffer, departments, users);

  assert.match(report.errors[0] ?? '', /bo'sh/i);
  assert.equal(report.tasksPreview.length, 0);
  assert.equal(canApplyExcelImport(report, report.tasksPreview), false);
});

test('reports a workbook with no sheets', () => {
  const report = parseExcelWorkbook({ SheetNames: [], Sheets: {} }, departments, users);

  assert.match(report.errors[0] ?? '', /sheet/i);
  assert.equal(report.tasksPreview.length, 0);
});

test('rejects malformed rows and prevents committing valid preview rows alongside them', () => {
  const report = parseExcelWorkbook({
    SheetNames: ['Work plan'],
    Sheets: {
      'Work plan': XLSX.utils.json_to_sheet([
        { Title: 'Valid task' },
        { Title: '   ' },
        { Title: 'Unknown assignment', Department: 'Unknown department' },
      ]),
    },
  }, departments, users);
  let committed = false;

  assert.equal(report.created, 1);
  assert.equal(report.skipped, 2);
  assert.match(report.errors[0] ?? '', /Qator 3.*nomi bo'sh/i);
  assert.match(report.errors[1] ?? '', /Qator 4.*Bo'lim.*topilmadi/i);
  assert.equal(canApplyExcelImport(report, report.tasksPreview), false);
  assert.equal(commitExcelImportIfValid(report, report.tasksPreview, () => { committed = true; }), false);
  assert.equal(committed, false);
});

test('converts Excel date serials to the correct calendar date', async () => {
  const report = await parseExcelWorkPlan(
    bufferForRows([{ Title: 'Dated task', Deadline: 45292 }]),
    departments,
    users,
  );

  assert.deepEqual(report.errors, []);
  assert.equal(report.tasksPreview[0]?.deadline, '2024-01-01');
  assert.equal(canApplyExcelImport(report, report.tasksPreview), true);
});

test('returns a clear parser error for malformed workbook bytes', async () => {
  const malformedBytes = new TextEncoder().encode('not an Excel workbook');
  const report = await parseExcelWorkPlan(
    malformedBytes.buffer as ArrayBuffer,
    departments,
    users,
  );

  assert.equal(report.tasksPreview.length, 0);
  assert.match(report.errors[0] ?? '', /bo'sh|sheet|tahlil qilishda xatolik/i);
});

test('renders parser errors in an alert for the import UI', () => {
  const html = renderToStaticMarkup(createElement(ExcelImportErrors, {
    errors: ["Qator 2: Topshiriq nomi bo'sh."],
  }));

  assert.match(html, /role="alert"/);
  assert.match(html, /Import xatolari/);
  assert.match(html, /Topshiriq nomi bo&#x27;sh/);
});
