import React, { useState } from 'react';
import { api } from '../utils/api';
import { DraftPlanImport, parseDraftPlanWorkbook } from '../utils/draftPlanImport';

type PreviewState = { plan: DraftPlanImport; digest: string; errors: string[] };
type SavedDraft = {
  id: string;
  title: string;
  year: number;
  sourceName: string;
  items: DraftPlanImport['items'];
};

type Props = {
  plans: any[];
  t: (text: string) => string;
  onCommitted: () => Promise<void>;
};

export const DraftPlanImportPanel: React.FC<Props> = ({ plans, t, onCommitted }) => {
  const [fileName, setFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [savedDraft, setSavedDraft] = useState<SavedDraft | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  const chooseFile = (file?: File) => {
    setError('');
    setSuccess('');
    setPreview(null);
    setSelectedFile(file || null);
    setFileName(file?.name || '');
    if (!file) return;
    if (!file.name.toLocaleLowerCase().endsWith('.xlsx')) {
      setError(t('Please select an Excel .xlsx file.'));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError(t('The selected file is larger than the 10 MB limit.'));
    }
  };

  const createPreview = async (file: File | null = selectedFile) => {
    if (!file || !fileName || file.size > 10 * 1024 * 1024 ||
        !file.name.toLocaleLowerCase().endsWith('.xlsx')) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const plan = parseDraftPlanWorkbook(await file.arrayBuffer(), file.name);
      const result = await api<{ digest: string; errors: string[] }>('/admin/work-plans/draft-import/preview', {
        method: 'POST',
        body: JSON.stringify(plan),
      });
      setPreview({ plan, digest: result.digest, errors: result.errors });
    } catch (cause) {
      setError(t(cause instanceof Error ? cause.message : 'Import failed.'));
    } finally {
      setBusy(false);
    }
  };

  const commit = async () => {
    if (!preview || preview.errors.length) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await api('/admin/work-plans/draft-import/commit', {
        method: 'POST',
        body: JSON.stringify({ plan: preview.plan, digest: preview.digest }),
      });
      setSuccess(t('Import completed. The plan is stored as an inactive draft.'));
      setPreview(null);
      setSelectedFile(null);
      setFileName('');
      setSavedDraft(null);
      await onCommitted();
    } catch (cause) {
      setError(t(cause instanceof Error ? cause.message : 'Import failed.'));
    } finally {
      setBusy(false);
    }
  };

  const viewSavedDraft = async (plan: any) => {
    setError('');
    if (savedDraft?.id === plan.id) {
      setSavedDraft(null);
      return;
    }
    setBusy(true);
    try {
      const result = await api<SavedDraft>(`/admin/work-plans/${encodeURIComponent(plan.id)}/draft-items`);
      setSavedDraft(result);
    } catch (cause) {
      setError(t(cause instanceof Error ? cause.message : 'Import failed.'));
    } finally {
      setBusy(false);
    }
  };

  const renderItems = (items: DraftPlanImport['items']) => (
    <div className="mt-3 max-h-[34rem] space-y-3 overflow-auto pr-1">
      {items.map(item => (
        <article key={`${item.sectionNumber}-${item.number}`} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
          <h4 className="font-semibold">{item.number}. {item.title}</h4>
          <p className="mt-1 text-xs text-slate-500">{item.sectionNumber} · {item.sectionTitle}</p>
          {item.completion?.sampleData && (
            <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              {t('Sample data — not real staff assignments')}
            </p>
          )}
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            {([
              ['Mechanism', item.mechanism],
              ['Schedule', item.schedule],
              ['Funding source', item.fundingSource],
              ['Oversight', item.oversight],
              ['Responsible', item.responsible],
              ['Distributed units', item.distributedUnits],
              ['Workbook plan code', item.completion?.planCode],
              ['Workbook priority', item.completion?.priority ? t(item.completion.priority) : ''],
              ['Work-plan category', item.completion?.category],
              ['Reviewer (source or sample)', item.completion?.reviewer],
              ['Suggested responsible department', item.completion?.responsibleDepartment],
              ['Sample execution responsibility', item.completion?.sampleResponsible],
            ] as const).filter(([, value]) => value).map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-xs font-medium text-slate-500">{t(label)}</dt>
                <dd className="whitespace-pre-wrap break-words">{value}</dd>
              </div>
            ))}
          </dl>
        </article>
      ))}
    </div>
  );

  const draftPlans = plans.filter(plan => plan.draftImportKind === 'UNASSIGNED_DRAFT');

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div>
        <h2 className="font-bold">{t('Unassigned draft plan import')}</h2>
        <p className="mt-1 text-sm text-slate-500">{t('No live tasks, priorities, or staff assignments will be created. Source schedule text is kept as written.')}</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="grid min-w-0 flex-1 gap-1 text-sm font-medium">
          <span>{t('Upload the original work-plan Excel file')}</span>
          <input
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            disabled={busy}
            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            onChange={event => {
              chooseFile(event.target.files?.[0]);
              event.currentTarget.value = '';
            }}
          />
        </label>
        <button
          type="button"
          disabled={busy || !selectedFile || selectedFile.size > 10 * 1024 * 1024 ||
            !selectedFile.name.toLocaleLowerCase().endsWith('.xlsx')}
          onClick={() => void createPreview()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? t('Importing...') : t('Preview import')}
        </button>
      </div>
      {fileName && <p className="text-xs text-slate-500">{t('Source file')}: {fileName}</p>}
      {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>}
      {success && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">{success}</p>}

      {preview && (
        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-bold">{t('Draft plan preview')}</h3>
              <p className="mt-1 text-sm">{preview.plan.title}</p>
              <p className="mt-1 text-xs text-slate-500">{preview.plan.year} · {preview.plan.sections.length} {t('sections')} · {preview.plan.items.length} {t('Items')}</p>
            </div>
            <button
              type="button"
              disabled={busy || preview.errors.length > 0}
              onClick={() => void commit()}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('Import draft plan')}
            </button>
          </div>
          {!!preview.errors.length && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-rose-700 dark:text-rose-300">
              {preview.errors.map((message, index) => <li key={`${message}-${index}`}>{t(message)}</li>)}
            </ul>
          )}
          <div className="mt-3 space-y-2">
            {preview.plan.items.slice(0, 12).map(item => (
              <div key={item.number} className="rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="font-medium">{item.number}. {item.title}</p>
                <p className="mt-1 whitespace-pre-wrap text-xs text-slate-500">{item.schedule}</p>
              </div>
            ))}
          </div>
          {preview.plan.items.length > 12 && <p className="mt-2 text-xs text-slate-500">{t('Only the first 12 items appear in this preview; all items are saved.')}</p>}
        </div>
      )}

      <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
        <h3 className="font-semibold">{t('Saved unassigned draft plans')}</h3>
        {!draftPlans.length && <p className="mt-2 text-sm text-slate-500">{t('No draft plans imported yet.')}</p>}
        <div className="mt-2 divide-y divide-slate-200 dark:divide-slate-800">
          {draftPlans.map(plan => (
            <div key={plan.id} className="py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{plan.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{plan.year} · {plan.draftItemCount || 0} {t('Items')} · {plan.sourceName}</p>
                   {plan.completedSourceName && <p className="mt-1 text-xs text-slate-500">{t('Completed workbook')}: {plan.completedSourceName}</p>}
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void viewSavedDraft(plan)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium dark:border-slate-700"
                >
                  {savedDraft?.id === plan.id ? t('Hide items') : t('View items')}
                </button>
              </div>
              {savedDraft && savedDraft.id === plan.id && renderItems(savedDraft.items)}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
