import React from 'react';
import { X } from 'lucide-react';
import { localizeText } from '../utils/i18n';

export const AdminPanelShell: React.FC<React.PropsWithChildren<{ title: string; subtitle?: string; onClose?: () => void }>> = ({ title, subtitle, onClose, children }) => (
  <section className="space-y-5">
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
      <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-sky-700 dark:text-sky-300">UniTask · Administration</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>{subtitle && <p className="mt-1 max-w-3xl text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}</div>
      {onClose && <button type="button" onClick={onClose} aria-label={localizeText('Close')} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"><X size={17} /></button>}
    </header>
    {children}
  </section>
);

export const AdminModal: React.FC<React.PropsWithChildren<{ title: string; onClose: () => void }>> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 backdrop-blur-[2px]" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="admin-dialog-title" className="my-auto max-h-[94dvh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-700 dark:bg-slate-900"><h2 id="admin-dialog-title" className="font-bold text-slate-900 dark:text-white">{title}</h2><button type="button" onClick={onClose} aria-label={localizeText('Close dialog')} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={17} /></button></header>
      <div className="p-5">{children}</div>
    </section>
  </div>
);

export const AdminField: React.FC<React.PropsWithChildren<{ label: string; htmlFor?: string; hint?: string }>> = ({ label, htmlFor, hint, children }) => (
  <div className="space-y-1.5"><label htmlFor={htmlFor} className="block text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</label>{children}{hint && <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>}</div>
);

export const AdminButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'primary' | 'quiet' | 'danger' }> = ({ tone = 'quiet', className = '', ...props }) => {
  const base = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500';
  const colors = tone === 'primary' ? 'bg-slate-900 text-white hover:bg-slate-700 dark:bg-sky-600 dark:hover:bg-sky-500' : tone === 'danger' ? 'border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700';
  return <button {...props} className={`${base} ${colors} ${className}`} />;
};

export const AdminInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} className={`min-h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-600/15 dark:border-slate-700 dark:bg-slate-800 dark:text-white ${props.className ?? ''}`} />;
export const AdminSelect = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => <select {...props} className={`min-h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-600/15 dark:border-slate-700 dark:bg-slate-800 dark:text-white ${props.className ?? ''}`} />;
export const AdminTextarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} className={`w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-600/15 dark:border-slate-700 dark:bg-slate-800 dark:text-white ${props.className ?? ''}`} />;

export const AdminAlert: React.FC<React.PropsWithChildren<{ tone?: 'error' | 'success' | 'info' }>> = ({ tone = 'info', children }) => {
  const styles = tone === 'error' ? 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200' : tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200' : 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200';
  return <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-4 py-3 text-sm ${styles}`}>{children}</div>;
};

export const AdminSkeleton = () => <div className="animate-pulse space-y-3" aria-label={localizeText('Loading')}><div className="h-20 rounded-xl bg-slate-200 dark:bg-slate-800" /><div className="h-44 rounded-xl bg-slate-200 dark:bg-slate-800" /><div className="h-32 rounded-xl bg-slate-200 dark:bg-slate-800" /></div>;
