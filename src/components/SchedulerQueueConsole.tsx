import React, { useState } from 'react';
import { Play, Timer, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
export const SchedulerQueueConsole: React.FC = () => {
  const { queueJobs, triggerJobRun } = useApp();
  const [busy, setBusy] = useState('');
  return <div className="space-y-6">
    <h1 className="text-xl font-bold">Notification jobs</h1>
    <p className="text-sm text-slate-500">Delivery settings and failed notifications are managed in Administration.</p>
    <div className="space-y-4">{queueJobs.map(job => <article key={job.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div><h2 className="flex items-center gap-2 font-bold"><Timer size={16} />{job.name}</h2>
        <p className="mt-2 text-sm text-slate-500">{job.payloadSummary}</p>
        {job.lastRun && <p className="mt-2 flex items-center gap-2 text-xs text-emerald-700"><CheckCircle2 size={14} />{new Date(job.lastRun).toLocaleString()}</p>}
      </div>
      <button disabled={Boolean(busy)} className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-sky-700" onClick={async () => {
        setBusy(job.id); try { await triggerJobRun(job.id); } catch { /* The shared error banner displays the failed request. */ } finally { setBusy(''); }
      }}><Play size={14} />{busy === job.id ? 'Running…' : 'Run job'}</button>
    </article>)}</div>
  </div>;
};
