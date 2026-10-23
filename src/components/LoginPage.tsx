import React, { useEffect, useState } from 'react';
import { KeyRound, Languages, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { DEFAULT_LANGUAGE, normalizeLanguage, syncDocumentLanguage, localizeText } from '../utils/i18n';
import type { Language } from '../types';
import { readLanguagePreference, saveLanguagePreference } from '../utils/preferences';

const languages: { value: Language; label: string }[] = [
  { value: 'uz-Latn', label: "O'zbekcha" }, { value: 'uz-Cyrl', label: 'Ўзбекча' }, { value: 'ru', label: 'Русский' }, { value: 'en', label: 'English' },
];

export const LoginPage: React.FC = () => {
  const { login, error: authError } = useAuth();
  const [language, setLanguage] = useState<Language>(() => {
    return syncDocumentLanguage(readLanguagePreference());
  });
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirm, setSetupConfirm] = useState('');
  const [setupToken, setSetupToken] = useState(() => new URLSearchParams(window.location.search).get('setup') || '');
  const [mode, setMode] = useState<'login' | 'setup' | 'forgot'>(() => new URLSearchParams(window.location.search).has('setup') ? 'setup' : 'login');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const t = (text: string) => localizeText(text, language);

  useEffect(() => { saveLanguagePreference(language); }, [language]);
  const onLogin = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setNotice(''); setBusy(true);
    try { await login(identifier.trim(), password); } catch (e) { setError((e as Error).message || t('Unable to sign in. Check your details and try again.')); } finally { setBusy(false); }
  };
  const onSetup = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setNotice('');
    const token = setupToken;
    if (!token) { setError(t('This setup link is incomplete or has expired.')); return; }
    if (setupPassword.length < 12) { setError(t('Use at least 12 characters for your password.')); return; }
    if (setupPassword !== setupConfirm) { setError(t('The passwords do not match.')); return; }
    setBusy(true);
    try {
      await api('/auth/setup-password', { method: 'POST', body: JSON.stringify({ token, password: setupPassword }) });
      window.history.replaceState({}, '', `${window.location.pathname}${window.location.hash}`);
      setSetupToken('');
      setMode('login'); setSetupPassword(''); setSetupConfirm(''); setNotice(t('Password established. Sign in with your account.'));
    } catch (e) { setError((e as Error).message || t('The setup service is unavailable. Please try again later.')); } finally { setBusy(false); }
  };
  const onForgot = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setNotice(''); setBusy(true);
    try {
      await api('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ identifier: identifier.trim() }) });
      setNotice(t('If the account can be recovered, the next steps will be provided by your administrator.'));
    } catch (e) { setError((e as Error).message || t('The recovery service is unavailable. Please try again later.')); } finally { setBusy(false); }
  };

  return <main className="min-h-[100dvh] bg-slate-100 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-8">
    <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-[1fr_.92fr]">
      <aside className="relative flex flex-col justify-between overflow-hidden bg-slate-900 p-7 text-white sm:p-10 lg:p-12">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-sky-300/20" /><div className="absolute -right-12 -top-12 h-56 w-56 rounded-full border border-sky-300/20" />
        <div className="relative"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-600 font-extrabold tracking-tight">UT</div><div className="mt-12 max-w-lg"><p className="text-xs font-semibold uppercase tracking-[.2em] text-sky-300">{t('University work-plan system')}</p><h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">UniTask<span className="text-sky-400">.</span></h1><p className="mt-5 max-w-md text-sm leading-7 text-slate-300 sm:text-base">{t('One secure workspace for university plans, responsibilities, and progress.')}</p></div></div>
        <div className="relative mt-14 flex items-center gap-3 border-t border-white/10 pt-5 text-xs text-slate-300"><ShieldCheck size={17} className="text-sky-300" />{t('Secure access · ToshTech')}</div>
      </aside>
      <section className="flex flex-col justify-center p-6 sm:p-10 lg:p-14">
        <div className="mb-10 flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400"><LockKeyhole size={17} />{t('Secure sign-in')}</div><label className="flex items-center gap-2"><Languages size={16} className="text-slate-500" /><span className="sr-only">{t('Interface language')}</span><select value={language} onChange={e => setLanguage(e.target.value as Language)} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800">{languages.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label></div>
        <div className="max-w-md">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-sky-700 dark:text-sky-300">{t(mode === 'setup' ? 'Account activation' : mode === 'forgot' ? 'Account recovery' : 'Welcome back')}</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">{t(mode === 'setup' ? 'Create your password' : mode === 'forgot' ? 'Recover access' : 'Sign in to UniTask')}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{t(mode === 'setup' ? 'Choose a strong password to activate your account.' : mode === 'forgot' ? 'Enter your username or email to request account recovery.' : 'Use your university account credentials to continue.')}</p>
          {(error || authError) && <div role="alert" className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{error || authError}</div>}
          {notice && <div role="status" className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">{notice}</div>}
          {mode === 'login' && <form onSubmit={onLogin} className="mt-7 space-y-5">
            <label className="block space-y-2 text-sm font-semibold">{t('Username or email')}<input autoComplete="username" required value={identifier} onChange={e => setIdentifier(e.target.value)} className="min-h-12 w-full rounded-lg border border-slate-300 bg-slate-50 px-3.5 text-sm font-normal outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-600/15 dark:border-slate-700 dark:bg-slate-800" /></label>
            <label className="block space-y-2 text-sm font-semibold">{t('Password')}<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} className="min-h-12 w-full rounded-lg border border-slate-300 bg-slate-50 px-3.5 text-sm font-normal outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-600/15 dark:border-slate-700 dark:bg-slate-800" /></label>
            <button disabled={busy} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 font-bold text-white transition hover:bg-slate-700 disabled:opacity-60 dark:bg-sky-600 dark:hover:bg-sky-500">{busy ? t('Signing in…') : <><KeyRound size={16} />{t('Sign in')}</>}</button>
            <button type="button" onClick={() => { setError(''); setNotice(''); setMode('forgot'); }} className="w-full text-center text-sm font-semibold text-sky-700 hover:underline dark:text-sky-300">{t('Forgot password?')}</button>
          </form>}
          {mode === 'setup' && <form onSubmit={onSetup} className="mt-7 space-y-5">
            <label className="block space-y-2 text-sm font-semibold">{t('New password')}<input type="password" autoComplete="new-password" required minLength={12} value={setupPassword} onChange={e => setSetupPassword(e.target.value)} className="min-h-12 w-full rounded-lg border border-slate-300 bg-slate-50 px-3.5 text-sm font-normal outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-600/15 dark:border-slate-700 dark:bg-slate-800" /></label>
            <label className="block space-y-2 text-sm font-semibold">{t('Confirm password')}<input type="password" autoComplete="new-password" required value={setupConfirm} onChange={e => setSetupConfirm(e.target.value)} className="min-h-12 w-full rounded-lg border border-slate-300 bg-slate-50 px-3.5 text-sm font-normal outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-600/15 dark:border-slate-700 dark:bg-slate-800" /></label>
            <button disabled={busy} className="min-h-12 w-full rounded-lg bg-slate-900 px-4 font-bold text-white hover:bg-slate-700 disabled:opacity-60 dark:bg-sky-600">{busy ? t('Saving…') : t('Set password')}</button>
            <button type="button" onClick={() => { setMode('login'); setError(''); }} className="w-full text-sm font-semibold text-sky-700 hover:underline dark:text-sky-300">{t('Back to sign in')}</button>
          </form>}
          {mode === 'forgot' && <form onSubmit={onForgot} className="mt-7 space-y-5">
            <label className="block space-y-2 text-sm font-semibold">{t('Username or email')}<input required autoComplete="username" value={identifier} onChange={e => setIdentifier(e.target.value)} className="min-h-12 w-full rounded-lg border border-slate-300 bg-slate-50 px-3.5 text-sm font-normal outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-600/15 dark:border-slate-700 dark:bg-slate-800" /></label>
            <button disabled={busy} className="min-h-12 w-full rounded-lg bg-slate-900 px-4 font-bold text-white hover:bg-slate-700 disabled:opacity-60 dark:bg-sky-600">{busy ? t('Submitting…') : t('Request recovery')}</button>
            <button type="button" onClick={() => { setMode('login'); setError(''); setNotice(''); }} className="w-full text-sm font-semibold text-sky-700 hover:underline dark:text-sky-300">{t('Back to sign in')}</button>
          </form>}
          {mode === 'login' && <p className="mt-8 border-t border-slate-200 pt-5 text-xs leading-5 text-slate-500 dark:border-slate-800 dark:text-slate-400">{t('Initial administrator access is provisioned by the secure server-side setup command. Contact your system administrator; credentials are never displayed here.')}</p>}
        </div>
      </section>
    </div>
  </main>;
};
