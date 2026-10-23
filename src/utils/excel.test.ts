import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import test from 'node:test';
import * as XLSX from 'xlsx';
import { ExcelImportErrors } from '../components/ExcelImportErrors';
import { canApplyExcelImport, commitExcelImportIfValid, parseExcelWorkPlan, parseExcelWorkbook, safeSpreadsheetValue } from './excel';
import type { Department, User } from '../types';
const departments: Department[] = [{ id:'dept-1',code:'D1',name:'Engineering',headName:'Coordinator',staffCount:1,completedTasksCount:0,totalTasksCount:0,targetKpiPercent:80 }];
const users: User[] = [{ id:'user-1',fullName:'Worker One',role:'WORKER',roleLabel:'Worker',email:'worker@example.test',phone:'',isTelegramBound:false }];
const row = (extra: Record<string, unknown> = {}) => ({ Number:1,Title:'Valid task',Department:'Engineering',Xodim:'Worker One',Priority:'HIGH',Deadline:'2028-01-01',...extra });
const workbook = (rows: Record<string, unknown>[]) => ({ SheetNames:['Work plan'],Sheets:{'Work plan':XLSX.utils.json_to_sheet(rows)} });
const parse = (rows: Record<string, unknown>[]) => parseExcelWorkbook(workbook(rows),departments,users);
test('rejects empty and sheetless workbooks', () => {
  assert.equal(canApplyExcelImport(parse([]),[]),false);
  assert.match(parseExcelWorkbook({SheetNames:[],Sheets:{}},departments,users).errors[0],/sheet/i);
});
test('rejects malformed rows and prevents partial UI commits', async () => {
  const report = parse([row(),row({Number:2,Title:' '}),row({Number:3,Department:'Unknown department'})]);
  let committed = false;
  assert.equal(report.created,1); assert.equal(report.skipped,2);
  assert.match(report.errors[0],/Qator 3.*nomi bo'sh/i); assert.match(report.errors[1],/Qator 4.*Bo'lim.*topilmadi/i);
  assert.equal(await commitExcelImportIfValid(report,report.tasksPreview,()=>{committed=true;}),false); assert.equal(committed,false);
});
test('converts Excel serial dates and rejects invalid calendar dates', async () => {
  const buffer = XLSX.write(workbook([row({Deadline:45292})]),{type:'array',bookType:'xlsx'});
  const report = await parseExcelWorkPlan(buffer,departments,users);
  assert.deepEqual(report.errors,[]); assert.equal(report.tasksPreview[0]?.deadline,'2024-01-01');
  for (const value of ['2028-02-31','not-a-date','',-10]) assert.ok(parse([row({Deadline:value})]).errors.length);
});
test('rejects malformed bytes without importable data', async () => {
  const report = await parseExcelWorkPlan(new TextEncoder().encode('not an Excel workbook').buffer,departments,users);
  assert.equal(report.tasksPreview.length,0); assert.ok(report.errors.length);
});
test('requires explicit unambiguous assignment instead of choosing the first account or department', () => {
  for (const extra of [{Department:''},{Xodim:''},{Xodim:'Worker'},{Department:'Engineer'}]) assert.ok(parse([row(extra)]).errors.length);
});
test('rejects missing or duplicate work-plan numbers and invalid priority/progress', () => {
  assert.ok(parse([row(),row({Title:'Duplicate'})]).errors.some(e=>e.includes('Takroriy')));
  assert.ok(parse([row({Number:0})]).errors.length);
  assert.ok(parse([row({Priority:'UNKNOWN'})]).errors.length);
  for (const progress of [-1,101,2.5,'abc']) assert.ok(parse([row({Progress:progress})]).errors.length);
});
test('does not silently reset historical states or completion percentages during a new-task import', () => {
  assert.ok(parse([row({Progress:40})]).errors.length);
  assert.ok(parse([row({Status:'COMPLETED'})]).errors.length);
  assert.deepEqual(parse([row({Progress:0,Status:'ASSIGNED'})]).errors,[]);
});
test('waits for committed API success and propagates failures', async () => {
  const report = parse([row()]); let committed = false;
  assert.equal(await commitExcelImportIfValid(report,report.tasksPreview,async()=>{await Promise.resolve();committed=true;}),true); assert.equal(committed,true);
  await assert.rejects(commitExcelImportIfValid(report,report.tasksPreview,async()=>{throw new Error('Server rejected');}),/Server rejected/);
});
test('renders parser errors as an accessible alert', () => {
  const html = renderToStaticMarkup(createElement(ExcelImportErrors,{errors:["Qator 2: Topshiriq nomi bo'sh."]}));
  assert.match(html,/role="alert"/); assert.match(html,/Topshiriq nomi bo&#x27;sh/);
});
test('neutralizes spreadsheet formulas while keeping normal numbers and text intact', () => {
  for(const input of ['=2+2','+CMD','-formula','@formula','  =formula']) assert.equal(safeSpreadsheetValue(input),`'${input}`);
  assert.equal(safeSpreadsheetValue('Ordinary title'),'Ordinary title'); assert.equal(safeSpreadsheetValue(42),42);
});
