import React, { useState } from 'react';
import { FileSpreadsheet, Upload, Download, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import { parseExcelWorkPlan, exportTasksToExcel, OFFICIAL_WORK_PLAN_COLUMNS, type ImportReport } from '../utils/excel';
import type { Task } from '../types';
import { localizeText } from '../utils/i18n';
export const ExcelManager: React.FC = () => {
  const { tasks, departments, users, importTasks, language, workPlans } = useApp();
  const t = (text: string) => localizeText(text, language);
  const [report, setReport] = useState<ImportReport | null>(null), [fileName, setFileName] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [success, setSuccess] = useState(false);
  const [workPlanId, setWorkPlanId] = useState('');
  const read = async (file?: File) => {
    if (!file) return;
    setBusy(true); setReport(null); setError(''); setSuccess(false); setFileName(file.name);
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('Import files must not exceed 10 MB.');
      const parsed = await parseExcelWorkPlan(await file.arrayBuffer(), departments.filter(d => d.active !== false), users.filter(u => u.active));
      setReport(parsed);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };
  const commit = async () => {
    if (!report || report.errors.length || !report.tasksPreview.length) return;
    setBusy(true); setError('');
    try {
      const plan = workPlans.find(p => p.id === workPlanId);
      const records = report.tasksPreview.map(task => {
        const section = plan?.sections.find(s => s.title.toLowerCase().trim() === task.sectionTitle?.toLowerCase().trim());
        return { ...task, workPlanId: plan?.id, sectionId: section?.id } as Partial<Task>;
      });
      await importTasks(records); setSuccess(true); setReport(null);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };
  const template = () => {
    const sheet = XLSX.utils.aoa_to_sheet([[...OFFICIAL_WORK_PLAN_COLUMNS, 'Муҳимлик даражаси']]);
    const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, sheet, 'Work plan');
    XLSX.writeFile(book, 'unitask-work-plan-template.xlsx');
  };
  const downloadErrors = () => {
    const blob = new Blob([report?.errors.join('\n') || error], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob), anchor = document.createElement('a'); anchor.href = url; anchor.download = 'import-errors.txt'; anchor.click(); URL.revokeObjectURL(url);
  };
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
      <div><h1 className="flex items-center gap-2 text-xl font-bold"><FileSpreadsheet size={22} />{t('Work-plan import')}</h1><p className="mt-2 max-w-xl text-sm text-slate-500">{t('Preview and validate every row before an atomic import. Existing records are never overwritten.')}</p></div>
      <div className="flex flex-wrap gap-2"><button onClick={template} className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700">{t('Download template')}</button>
        <button onClick={() => exportTasksToExcel(tasks)} className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white dark:bg-sky-700"><Download size={16} />{t('Export tasks')}</button></div>
    </div>
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <label className="block text-sm font-semibold">{t('Work plan')}<select value={workPlanId} onChange={e => setWorkPlanId(e.target.value)} className="mt-2 block w-full rounded-lg border p-2 dark:bg-slate-800"><option value="">{t('No work plan')}</option>{workPlans.filter(p => p.active).map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></label>
      <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
        <Upload className="text-sky-600" /><span className="text-sm font-semibold">{t('Choose Excel file')}</span><span className="text-xs text-slate-500">{t('Up to 2,000 rows; maximum 10 MB.')}</span>
        <input disabled={busy} type="file" accept=".xlsx,.xls" onChange={e => { void read(e.target.files?.[0]); e.target.value = ''; }} className="max-w-full text-sm" />
      </label>
      {fileName && <p className="text-sm text-slate-500">{fileName}</p>}
      {busy && <p role="status">{t('Processing…')}</p>}
      {error && <p role="alert" className="whitespace-pre-wrap rounded-lg bg-rose-50 p-4 text-sm text-rose-800">{t(error)}</p>}
      {success && <p role="status" className="flex items-center gap-2 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 size={16} />{t('Import committed successfully.')}</p>}
    </section>
    {report && <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5 dark:border-slate-800">
        <h2 className="font-bold">{t('Preview')} · {report.tasksPreview.length}</h2><div className="flex gap-2">
          {!!report.errors.length && <button onClick={downloadErrors} className="rounded-lg border px-3 py-2 text-sm">{t('Download validation errors')}</button>}
          <button disabled={busy || report.errors.length > 0 || !report.tasksPreview.length} onClick={() => { void commit(); }} className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">{t('Commit import')}</button></div>
      </div>
      {!!report.errors.length && <ul role="alert" className="max-h-64 list-inside list-disc overflow-auto bg-rose-50 p-5 text-sm text-rose-800">{report.errors.map((message, index) => <li key={index}>{t(message)}</li>)}</ul>}
      <div className="overflow-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs dark:bg-slate-800"><tr><th className="p-4">{t('Task number')}</th><th className="p-4">{t('Title')}</th><th className="p-4">{t('Assignee')}</th><th className="p-4">{t('Deadline')}</th></tr></thead>
        <tbody>{report.tasksPreview.slice(0,100).map((task, index) => <tr key={index} className="border-t dark:border-slate-800"><td className="p-4 font-mono">{task.planCode}</td><td className="min-w-64 p-4">{task.title}</td><td className="p-4">{task.assignedToName}</td><td className="whitespace-nowrap p-4">{task.deadline}</td></tr>)}</tbody></table></div>
    </section>}
  </div>;
};
