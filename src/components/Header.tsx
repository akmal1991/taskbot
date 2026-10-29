import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Smartphone, Bell, Sun, Moon, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { canAccessView } from '../utils/permissions';

interface HeaderProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeView, setActiveView }) => {
  const { 
    currentUser, 
    permissions,
    notifications, 
    pendingProofsCount, 
    language,
    setLanguage,
    theme,
    toggleTheme,
    markNotificationAsRead,
    openTma
  } = useApp();
  const { logout, error: sessionError } = useAuth();

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const [noticesOpen, setNoticesOpen] = useState(false);
  const noticesRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (event: PointerEvent) => { if (!noticesRef.current?.contains(event.target as Node)) setNoticesOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setNoticesOpen(false); };
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape); };
  }, []);
  const navigationItems = [
    { id: 'dashboard', label: 'Boshqaruv Paneli' },
    { id: 'tasks', label: 'Ish Reja Vazifalari' },
    { id: 'proofs', label: 'Proof-of-Work Tekshiruvi' },
    { id: 'excel', label: 'Excel Ingestion & Reja' },
    { id: 'admin', label: 'Administration' },
    { id: 'scheduler', label: 'Notification jobs' },
    { id: 'audit', label: 'Audit Jurnali' },
    { id: 'servicedesk', label: 'Murojaatlar (HelpDesk)' },
    { id: 'account', label: 'My account' },
  ].filter((item) => canAccessView(item.id, currentUser.role, permissions));
  const desktopNavigationItems = navigationItems.filter((item) =>
    ['dashboard', 'tasks', 'proofs', 'excel', 'scheduler'].includes(item.id),
  );

  return (
    <header className="min-h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 md:px-6 py-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 sticky top-0 z-30 transition-colors">
      {/* Zone 1: Brand Wordmark & University Context */}
      <div className="flex items-center gap-4 shrink-0">
        <a 
          href="#dashboard" 
          onClick={(e) => { e.preventDefault(); setActiveView('dashboard'); }}
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap flex items-center gap-2 group"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-sky-600 text-white flex items-center justify-center font-extrabold text-sm tracking-tighter shadow-xs">
            UT
          </div>
          <span className="hidden sm:inline">UniTask Platform</span>
          <span className="sm:hidden">UniTask</span>
        </a>
        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium hidden lg:inline">
          University work plans
        </span>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden 2xl:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
        {desktopNavigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                activeView === item.id
                  ? 'text-slate-900 dark:text-white font-semibold border-b-2 border-slate-900 dark:border-sky-500'
                  : ''
              }`}
            >
              {item.label}
              {item.id === 'proofs' && pendingProofsCount > 0 && (
                <span className="ml-1.5 text-[11px] font-mono px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 rounded font-semibold border border-transparent dark:border-amber-800/40">
                  {pendingProofsCount}
                </span>
              )}
            </button>
          ))}
      </nav>

      {/* Zone 3: Actions, Role Selector & TMA Launcher */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Global Dark / Light Theme Toggle */}
        <button
          onClick={toggleTheme}
          type="button"
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center border border-slate-200/60 dark:border-slate-700/60"
          title={theme === 'dark' ? "Kunduzgi rejimga o'tish (Light Mode)" : "Tungi rejimga o'tish (Dark Mode)"}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 hover:rotate-90" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600 transition-transform duration-300 hover:-rotate-12" />
          )}
        </button>

        {/* Language selector */}
        <div className="relative shrink-0">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as typeof language)}
            aria-label="Interface language"
            className="text-[10px] sm:text-xs max-w-[132px] sm:max-w-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-1.5 px-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500 font-medium"
          >
            <option value="uz-Latn">O'zbekcha (Lotin)</option>
            <option value="uz-Cyrl">Ўзбекча (Кирилл)</option>
            <option value="ru">Русский</option>
            <option value="en">English</option>
          </select>
        </div>

        <button onClick={() => setActiveView('account')} className="hidden xl:flex flex-col items-end text-xs">
          <span className="font-semibold">{currentUser.fullName}</span><span className="text-slate-500">{currentUser.role}</span>
        </button>
        <button type="button" title="Sign out" aria-label="Sign out" className="rounded-lg border border-slate-200 p-2 dark:border-slate-700" onClick={() => { void logout().catch(() => {}); }}>
          <LogOut className="h-4 w-4" />
        </button>

        <a
          href="https://t.me/UniTaskTashTech_bot"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold shadow-xs bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white border border-transparent dark:border-slate-700"
          title="Open in Telegram"
        >
          <Smartphone className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden lg:inline">Telegram Mini App</span>
          <span className="lg:hidden">Telegram</span>
        </a>

        {/* Notification bell */}
        <div ref={noticesRef}>
          <button 
            onClick={() => setNoticesOpen(value => !value)}
            aria-label="Notifications"
            aria-expanded={noticesOpen}
            className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 rounded-full bg-amber-500 px-1 text-[10px] font-bold text-slate-950">{unreadCount}</span>
            )}
          </button>
          {noticesOpen && <section aria-label="Notifications" className="absolute right-2 top-full z-50 mt-2 max-h-[70dvh] w-[min(24rem,calc(100vw-1rem))] overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-3 font-bold">Notifications</h2>
            {!notifications.length && <p className="py-4 text-sm text-slate-500">No notifications</p>}
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">{notifications.slice(0, 20).map(notice => <li key={notice.id} className={`py-3 text-sm ${notice.isRead ? 'text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}>
              <p className="font-semibold">{notice.title}</p><p className="mt-1 break-words">{notice.messageText}</p>
              <time className="mt-1 block text-xs text-slate-500">{new Date(notice.sentAt).toLocaleString(language)}</time>
              <div className="mt-2 flex flex-wrap gap-3">
                {notice.taskId && <button className="font-semibold text-sky-700 dark:text-sky-400" onClick={() => { if (!notice.isRead) void markNotificationAsRead(notice.id).catch(() => {}); setNoticesOpen(false); openTma(notice.taskId); }}>Ish maydonini ochish</button>}
                {!notice.isRead && <button className="text-sky-700 underline dark:text-sky-400" onClick={() => { void markNotificationAsRead(notice.id).catch(() => {}); }}>Mark as read</button>}
              </div>
            </li>)}</ul>
            {!currentUser.isTelegramBound && <p className="mt-3 text-xs text-slate-500">Link Telegram in My account to receive task messages.</p>}
            <button className="mt-4 text-sm font-semibold text-sky-700 dark:text-sky-400" onClick={() => { setNoticesOpen(false); setActiveView('account'); }}>My account</button>
          </section>}
        </div>
      </div>

      <div className="w-full md:hidden">
        <select
          value={activeView}
          onChange={(event) => setActiveView(event.target.value)}
          aria-label="Modullar & Nazorat"
          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-medium px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400"
        >
          {navigationItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      {sessionError && <p role="alert" className="fixed right-4 top-20 z-50 max-w-sm rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900">{sessionError}</p>}
    </header>
  );
};
