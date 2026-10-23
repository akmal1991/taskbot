import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { localizeText } from '../utils/i18n';
export const AccountPanel: React.FC = () => {
  const { currentUser, language, notifications, markNotificationAsRead } = useApp();
  const { reloadAuth } = useAuth();
  const t = (text: string) => localizeText(text, language);
  const [currentPassword, setCurrentPassword] = useState(''), [password, setPassword] = useState('');
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const run = async (action: () => Promise<void>) => {
    setBusy(true); setError('');
    try { await action(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };
  const link = async () => {
    const initData = (window as any).Telegram?.WebApp?.initData;
    if (!initData) throw new Error('Open the Mini App inside Telegram to verify your account.');
    const { token } = await api('/telegram/link-token', { method: 'POST' });
    await api('/telegram/link', { method: 'POST', body: JSON.stringify({ token, initData }) });
    await reloadAuth();
  };
  return <div className="mx-auto max-w-3xl space-y-6">
    <h1 className="text-2xl font-bold">{t('My account')}</h1>
    <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="font-bold">{currentUser.fullName}</h2><p className="mt-2 text-sm text-slate-500">{currentUser.email} · {currentUser.role}</p>
      <p className="mt-4 text-sm">{currentUser.isTelegramBound ? currentUser.telegramUsername || currentUser.telegramId : t('Telegram is not linked')}</p>
      <button disabled={busy} className="mt-3 rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" onClick={() => {
        if (currentUser.isTelegramBound) {
          if (window.confirm(t('Unlink this Telegram account?'))) void run(async () => { await api('/telegram/unlink', { method: 'POST' }); await reloadAuth(); });
        } else void run(link);
      }}>{t(currentUser.isTelegramBound ? 'Unlink Telegram' : 'Verify Telegram account')}</button>
    </section>
    <form className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900" onSubmit={e => {
      e.preventDefault(); void run(async () => {
        await api('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, password }) });
        setPassword(''); setCurrentPassword(''); await reloadAuth();
      });
    }}>
      <h2 className="font-bold">{t('Change password')}</h2>
      <label className="block text-sm">{t('Current password')}<input required type="password" autoComplete="current-password" maxLength={128} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="mt-1 block w-full rounded-lg border p-2 dark:bg-slate-800" /></label>
      <label className="block text-sm">{t('New password')}<input required type="password" autoComplete="new-password" minLength={12} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full rounded-lg border p-2 dark:bg-slate-800" /></label>
      <button disabled={busy} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-sky-700">{t('Change password')}</button>
    </form>
    {error && <p role="alert" className="rounded-lg bg-rose-50 p-4 text-rose-800">{t(error)}</p>}
    <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-4 font-bold">{t('Notifications')}</h2>
      {!notifications.length && <p className="text-sm text-slate-500">{t('No notifications')}</p>}
      <ul className="divide-y dark:divide-slate-800">{notifications.map(n => <li key={n.id} className="py-4 text-sm">
        <h3 className="font-semibold">{n.title}</h3><p className="mt-1">{n.messageText}</p>
        <time className="text-xs text-slate-500">{new Date(n.sentAt).toLocaleString(language)}</time>
        {!n.isRead && <button disabled={busy} className="ml-4 text-sky-700 underline" onClick={() => { void run(() => markNotificationAsRead(n.id)); }}>{t('Mark as read')}</button>}
      </li>)}</ul>
    </section>
  </div>;
};
