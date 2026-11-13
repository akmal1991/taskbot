import React, { useState } from 'react';
import { Globe, KeyRound, Languages, LockKeyhole, Mail, Phone, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { DEFAULT_LANGUAGE, normalizeLanguage, syncDocumentLanguage, localizeText } from '../utils/i18n';
import type { Language } from '../types';
import { readLanguagePreference, saveLanguagePreference } from '../utils/preferences';

const languages: { value: Language; label: string }[] = [
  { value: 'uz-Latn', label: "O'zbekcha" }, { value: 'uz-Cyrl', label: 'Ўзбекча' }, { value: 'ru', label: 'Русский' }, { value: 'en', label: 'English' },
];

// Tashkent University of Technology brand palette (tashkenttech-edu.uz).
const field = 'min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-normal text-slate-900 outline-none transition focus:border-[#143D5A] focus:ring-4 focus:ring-[#143D5A]/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:ring-sky-400/15';
const labelClass = 'block space-y-2 text-[13px] font-semibold text-slate-700 dark:text-slate-300';
const primary = 'flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#ec4815] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#c9380b] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E54519]/30 disabled:opacity-60 dark:bg-[#E54519] dark:hover:bg-[#C93B12]';
const linkClass = 'w-full text-center text-sm font-semibold text-[#143D5A] transition hover:text-[#E54519] hover:underline dark:text-sky-300';

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

  // Sync <html lang> before re-rendering: build-time localizeNode() wrappers read it during render.
  const changeLanguage = (next: string) => setLanguage(saveLanguagePreference(next));
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
  const features = [t('Work plans'), t('Assignments'), t('Progress reports')];

  return <main style={{ fontFamily: "'Montserrat', 'Plus Jakarta Sans', system-ui, sans-serif" }} className="min-h-[100dvh] bg-[#F3F5F8] text-slate-900 dark:bg-slate-950 dark:text-slate-100 lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
    <aside className="relative overflow-hidden bg-[#ec4815] text-white">
      <div aria-hidden="true" className="absolute inset-0 opacity-[.07]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
      <div aria-hidden="true" className="absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-[#E54519]/20 blur-3xl" />
      <div aria-hidden="true" className="absolute left-0 top-0 h-1 w-full bg-[#E54519]" />
      <div className="relative flex h-full flex-col justify-between px-4 py-5 sm:px-10 lg:px-14 lg:py-12">
        <a href="https://tashkenttech-edu.uz" target="_blank" rel="noopener noreferrer" className="inline-flex w-fit"><img src="/brand/footer-logo.svg" alt={t('Tashkent University of Technology')} className="h-7 w-auto sm:h-9" /></a>
        <div className="hidden max-w-xl py-16 lg:block">
          <p className="text-xs font-bold uppercase tracking-[.22em] text-[#F27F5F]">{t('Internal staff portal')}</p>
          <h1 className="mt-5 text-5xl font-extrabold leading-[1.05] tracking-tight">UniTask<span className="text-[#E54519]">.</span></h1>
          <p className="mt-3 text-lg font-semibold text-white/90">{t('University work-plan system')}</p>
          <p className="mt-6 max-w-md text-[15px] leading-7 text-white/70">{t('One secure workspace for university plans, responsibilities, and progress.')}</p>
          <ul className="mt-9 flex flex-wrap gap-2.5">{features.map(item => <li key={item} className="rounded-full border border-white/15 bg-white/[.06] px-4 py-2 text-xs font-semibold text-white/85">{item}</li>)}</ul>
        </div>
        <div className="hidden border-t border-white/10 pt-6 lg:block">
          <p className="max-w-lg text-xs leading-6 text-white/60">{t('A new-generation state engineering university established by Resolution of the President of the Republic of Uzbekistan No. PQ-274.')}</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-white/75">
            <a href="mailto:info@tashkenttech-edu.uz" className="inline-flex items-center gap-2 hover:text-white"><Mail size={14} className="text-[#F27F5F]" /><span translate="no">info@tashkenttech-edu.uz</span></a>
            <a href="tel:+998555138282" className="inline-flex items-center gap-2 hover:text-white"><Phone size={14} className="text-[#F27F5F]" /><span translate="no">+998 55 513 82 82</span></a>
            <a href="https://tashkenttech-edu.uz" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-white"><Globe size={14} className="text-[#F27F5F]" />{t('Official website')}</a>
          </div>
        </div>
      </div>
    </aside>
    <section className="flex min-h-[calc(100dvh-4.5rem)] flex-col px-4 py-5 sm:px-10 lg:min-h-[100dvh] lg:px-16 lg:py-10">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400"><LockKeyhole size={15} className="text-[#E54519]" />{t('Secure sign-in')}</div>
        <label className="flex items-center gap-2"><Languages size={16} className="text-slate-500" /><span className="sr-only">{t('Interface language')}</span><select value={language} onChange={e => changeLanguage(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-[#143D5A] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">{languages.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      </div>
      <div className="flex flex-1 items-center justify-center py-8 lg:py-10">
        <div className="w-full max-w-[420px] rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_50px_-24px_rgba(20,61,90,.35)] dark:border-slate-800 dark:bg-slate-900 sm:p-9">
          <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#E54519]">{t(mode === 'setup' ? 'Account activation' : mode === 'forgot' ? 'Account recovery' : 'Welcome back')}</p>
          <h2 className="mt-2 text-[26px] font-bold leading-tight tracking-tight text-[#143D5A] dark:text-white">{t(mode === 'setup' ? 'Create your password' : mode === 'forgot' ? 'Recover access' : 'Sign in to UniTask')}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{t(mode === 'setup' ? 'Choose a strong password to activate your account.' : mode === 'forgot' ? 'Enter your username or email to request account recovery.' : 'Use your university account credentials to continue.')}</p>
          {(error || authError) && <div role="alert" className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">{error || authError}</div>}
          {notice && <div role="status" className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">{notice}</div>}
          {mode === 'login' && <form onSubmit={onLogin} className="mt-7 space-y-5">
            <label className={labelClass}>{t('Username or email')}<input autoComplete="username" required value={identifier} onChange={e => setIdentifier(e.target.value)} className={field} /></label>
            <label className={labelClass}>{t('Password')}<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} className={field} /></label>
            <button disabled={busy} className={primary}>{busy ? t('Signing in…') : <><KeyRound size={16} />{t('Sign in')}</>}</button>
            <button type="button" onClick={() => { setError(''); setNotice(''); setMode('forgot'); }} className={linkClass}>{t('Forgot password?')}</button>
          </form>}
          {mode === 'setup' && <form onSubmit={onSetup} className="mt-7 space-y-5">
            <label className={labelClass}>{t('New password')}<input type="password" autoComplete="new-password" required minLength={12} value={setupPassword} onChange={e => setSetupPassword(e.target.value)} className={field} /></label>
            <label className={labelClass}>{t('Confirm password')}<input type="password" autoComplete="new-password" required value={setupConfirm} onChange={e => setSetupConfirm(e.target.value)} className={field} /></label>
            <button disabled={busy} className={primary}>{busy ? t('Saving…') : t('Set password')}</button>
            <button type="button" onClick={() => { setMode('login'); setError(''); }} className={linkClass}>{t('Back to sign in')}</button>
          </form>}
          {mode === 'forgot' && <form onSubmit={onForgot} className="mt-7 space-y-5">
            <label className={labelClass}>{t('Username or email')}<input required autoComplete="username" value={identifier} onChange={e => setIdentifier(e.target.value)} className={field} /></label>
            <button disabled={busy} className={primary}>{busy ? t('Submitting…') : t('Request recovery')}</button>
            <button type="button" onClick={() => { setMode('login'); setError(''); setNotice(''); }} className={linkClass}>{t('Back to sign in')}</button>
          </form>}
          {mode === 'login' && <p className="mt-7 flex gap-2.5 border-t border-slate-100 pt-5 text-xs leading-5 text-slate-500 dark:border-slate-800 dark:text-slate-400"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#143D5A] dark:text-sky-300" />{t('Initial administrator access is provisioned by the secure server-side setup command. Contact your system administrator; credentials are never displayed here.')}</p>}
        </div>
      </div>
      <p className="text-center text-xs text-slate-400 dark:text-slate-500"><span translate="no">©</span> {new Date().getFullYear()} {t('Tashkent University of Technology')}</p>
    </section>
  </main>;
};
