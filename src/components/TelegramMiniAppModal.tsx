import React, { useEffect, useState } from 'react';
import { X, ListTodo, FileCheck2, Bell, Send, ExternalLink, LoaderCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import { authorizeTelegramAction, type TelegramAction } from '../utils/telegramAuth';
import { localizeText } from '../utils/i18n';
import type { ProofType } from '../types';
import { telegramLaunch } from '../utils/telegramSdk';

export const TelegramMiniAppModal: React.FC = () => {
  const { isTmaOpen, closeTma, tasks, currentUser, activeTmaTaskId, permissions, language,
    clockInTask, submitProof, approveProof, rejectProof, notifications, markNotificationAsRead } = useApp();
  const t = (text: string) => localizeText(text, language);
  const [tab, setTab] = useState<'tasks' | 'review' | 'notifications'>('tasks');
  const [taskId, setTaskId] = useState(''), [note, setNote] = useState(''), [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null), [type, setType] = useState<ProofType>('TEXT_NOTE');
  const [remarks, setRemarks] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const inTelegram = telegramLaunch || Boolean((window as any).Telegram?.WebApp?.initData);
  const own = tasks.filter(task => task.assignedToId === currentUser.id && !task.draft && !task.archivedAt);
  const reviews = tasks.filter(task => task.status === 'SUBMITTED_FOR_REVIEW' && !task.archivedAt && task.assignedToId !== currentUser.id &&
    (currentUser.role === 'ADMIN' || !task.approverId || task.approverId === currentUser.id));
  const task = tasks.find(item => item.id === taskId);
  useEffect(() => {
    if (!isTmaOpen) return;
    setTaskId(activeTmaTaskId || own[0]?.id || ''); setTab('tasks'); setError('');
    setNote(''); setFile(null); setUrl(''); setRemarks('');
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') closeTma(); };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isTmaOpen, activeTmaTaskId]);
  if (!isTmaOpen) return null;
  const authorize = async (action: TelegramAction, id: string) => {
    if (inTelegram) await authorizeTelegramAction(action, id, currentUser.telegramId || '');
  };
  const run = async (action: () => Promise<void>) => {
    setBusy(true); setError('');
    try { await action(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); if (!task) return;
    await run(async () => {
      await authorize('SUBMIT_PROOF', task.id);
      let attachmentId: string | undefined;
      if (['IMAGE','DOCUMENT'].includes(type)) {
        if (!file) throw new Error('Choose an evidence file.');
        const form = new FormData(); form.append('file', file);
        attachmentId = (await api<{ id: string }>(`/tasks/${encodeURIComponent(task.id)}/attachments`, { method: 'POST', body: form })).id;
      }
      await submitProof(task.id, { taskId: task.id, type, note: note.trim(), artifactUrl: url.trim() || undefined, attachmentId,
        submittedBy: currentUser.fullName, submittedById: currentUser.id });
      setNote(''); setFile(null); setUrl('');
    });
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-2 backdrop-blur-sm sm:p-6" onClick={e => { if (e.target === e.currentTarget) closeTma(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="task-workspace-title" className="flex max-h-[94dvh] w-full max-w-md flex-col overflow-hidden rounded-3xl border-4 border-slate-800 bg-[#18222d] text-slate-100 shadow-2xl">
      <header className="flex items-center justify-between border-b border-slate-700 bg-[#213040] px-5 py-4">
        <div><h2 id="task-workspace-title" className="font-bold">{t('Task workspace')}</h2><p className="text-xs text-slate-300">{currentUser.fullName}</p></div>
        <button autoFocus onClick={closeTma} aria-label="Close" className="rounded-lg p-2 hover:bg-slate-700"><X size={20} /></button>
      </header>
      <nav className="flex border-b border-slate-700 text-xs font-semibold">
        <button onClick={() => { setTab('tasks'); setTaskId(own[0]?.id || ''); }} className={`flex flex-1 items-center justify-center gap-2 p-4 ${tab === 'tasks' ? 'bg-sky-800' : ''}`}><ListTodo size={16} />{t('My tasks')}</button>
        {permissions.includes('tasks.review') && <button onClick={() => { setTab('review'); setTaskId(reviews[0]?.id || ''); }} className={`flex flex-1 items-center justify-center gap-2 p-4 ${tab === 'review' ? 'bg-sky-800' : ''}`}><FileCheck2 size={16} />{t('Review')}</button>}
        <button onClick={() => setTab('notifications')} className={`flex flex-1 items-center justify-center gap-2 p-4 ${tab === 'notifications' ? 'bg-sky-800' : ''}`}><Bell size={16} />{t('Notifications')}</button>
      </nav>
      <div className="space-y-4 overflow-y-auto p-5">
        {error && <p role="alert" className="rounded-lg border border-rose-700 bg-rose-950 p-3 text-sm text-rose-100">{t(error)}</p>}
        {tab === 'notifications' ? <ul className="space-y-3">
          {!notifications.length && <li className="text-sm text-slate-300">{t('No notifications')}</li>}
          {notifications.map(n => <li key={n.id} className="rounded-xl bg-[#213040] p-4 text-sm">
            <h3 className="font-bold">{n.title}</h3><p className="mt-2">{n.messageText}</p>
            {!n.isRead && <button disabled={busy} onClick={() => { void run(() => markNotificationAsRead(n.id)); }} className="mt-3 text-sky-300 underline">{t('Mark as read')}</button>}
          </li>)}
        </ul> : <>
          <label className="block text-sm">{t('Select task')}
            <select value={taskId} onChange={e => { setTaskId(e.target.value); setError(''); setNote(''); setFile(null); setRemarks(''); }} className="mt-2 w-full rounded-lg border border-slate-600 bg-[#213040] p-3">
              <option value="">{t('Select task')}</option>
              {(tab === 'tasks' ? own : reviews).map(item => <option key={item.id} value={item.id}>{item.planCode} · {item.title}</option>)}
            </select>
          </label>
          {task && <article className="space-y-4 rounded-xl bg-[#213040] p-4">
            <p className="text-xs font-mono text-sky-300">{task.planCode} · {t(task.status)}</p>
            <h3 className="font-bold leading-snug">{task.title}</h3>
            <p className="whitespace-pre-wrap text-sm text-slate-300">{task.description}</p>
            {task.acceptanceCriteria && <p className="whitespace-pre-wrap text-sm">{task.acceptanceCriteria}</p>}
            <p className="text-xs">{t('Deadline')}: {task.deadline} · {task.progressPercent}%</p>
            {tab === 'tasks' && task.assignedToId === currentUser.id && ['PENDING','ASSIGNED'].includes(task.status) &&
              <button disabled={busy} className="w-full rounded-lg bg-sky-600 p-3 text-sm font-bold disabled:opacity-50" onClick={() => { void run(async () => { await authorize('CLOCK_IN', task.id); await clockInTask(task.id); }); }}>{t('Start task')}</button>}
            {tab === 'tasks' && task.assignedToId === currentUser.id && task.status === 'IN_PROGRESS' && <form onSubmit={submit} className="space-y-3 border-t border-slate-600 pt-4">
              <h4 className="font-semibold">{t('Submit evidence')}</h4>
              <label className="block text-sm">{t('Evidence type')}<select value={type} onChange={e => { setType(e.target.value as ProofType); setFile(null); setUrl(''); }} className="mt-1 w-full rounded-lg bg-[#18222d] p-2">
                {(['TEXT_NOTE','URL','DOCUMENT','IMAGE'] as ProofType[]).map(value => <option key={value} value={value}>{t(value)}</option>)}
              </select></label>
              <label className="block text-sm">{t('Evidence note')}<textarea required={task.requiresEvidence} minLength={task.requiresEvidence ? 20 : 0} maxLength={20000} value={note} onChange={e => setNote(e.target.value)} className="mt-1 min-h-24 w-full rounded-lg bg-[#18222d] p-3" /></label>
              {type === 'URL' && <label className="block text-sm">{t('Evidence URL')}<input required type="url" value={url} onChange={e => setUrl(e.target.value)} className="mt-1 w-full rounded-lg bg-[#18222d] p-2" /></label>}
              {['IMAGE','DOCUMENT'].includes(type) && <label className="block text-sm">{t('Evidence file')}<input required type="file" accept={type === 'IMAGE' ? 'image/png,image/jpeg' : 'application/pdf'} onChange={e => setFile(e.target.files?.[0] || null)} className="mt-2 block w-full text-xs" /><span className="mt-1 block text-xs text-slate-300">{t('PDF, PNG or JPEG; maximum 10 MB.')}</span></label>}
              <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 p-3 font-bold disabled:opacity-50">{busy ? <LoaderCircle className="animate-spin" size={16} /> : <Send size={16} />}{t('Submit evidence')}</button>
            </form>}
            {tab === 'review' && task.status === 'SUBMITTED_FOR_REVIEW' && <div className="space-y-3 border-t border-slate-600 pt-4">
              <label className="block text-sm">{t('Review remarks')}<textarea required minLength={1} maxLength={20000} value={remarks} onChange={e => setRemarks(e.target.value)} className="mt-1 w-full rounded-lg bg-[#18222d] p-3" /></label>
              <div className="flex gap-3">{(['REJECTED','APPROVED'] as const).map(decision => <button key={decision} disabled={busy || !remarks.trim()} className={`flex-1 rounded-lg p-3 text-sm font-bold disabled:opacity-50 ${decision === 'APPROVED' ? 'bg-emerald-700' : 'bg-rose-800'}`} onClick={() => { void run(async () => {
                await authorize(decision === 'APPROVED' ? 'APPROVE_PROOF' : 'REJECT_PROOF', task.id);
                if (decision === 'APPROVED') await approveProof(task.id, task.proofs[0]?.id || '', remarks);
                else await rejectProof(task.id, task.proofs[0]?.id || '', remarks);
                setRemarks(''); setTaskId('');
              }); }}>{t(decision === 'APPROVED' ? 'Approve' : 'Return for revision')}</button>)}</div>
            </div>}
            {!!task.proofs.length && <section className="space-y-3 border-t border-slate-600 pt-4">
              <h4 className="font-semibold">{t('Evidence history')}</h4>
              {task.proofs.map(proof => <div key={proof.id} className="rounded-lg bg-[#18222d] p-3 text-sm">
                <p className="mb-2 text-xs text-sky-300">{t(proof.status)} · {new Date(proof.submittedAt).toLocaleString(language)}</p>
                <p className="whitespace-pre-wrap">{proof.note}</p>
                {proof.fileUrl && <a href={proof.fileUrl} className="mt-2 flex items-center gap-2 text-sky-300 underline"><ExternalLink size={14} />{proof.fileName}</a>}
                {proof.artifactUrl && <a href={proof.artifactUrl} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center gap-2 text-sky-300 underline"><ExternalLink size={14} />{t('Evidence URL')}</a>}
                {proof.reviewerRemarks && <p className="mt-2 whitespace-pre-wrap text-slate-300">{proof.reviewerRemarks}</p>}
              </div>)}
            </section>}
          </article>}
          {!task && <p className="py-8 text-center text-sm text-slate-300">{t('No tasks selected')}</p>}
        </>}
      </div>
    </section>
  </div>;
};
