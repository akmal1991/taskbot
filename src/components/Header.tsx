import React from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { Smartphone, Bell, ChevronDown, CheckCircle2, ShieldCheck, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeView, setActiveView }) => {
  const { 
    currentUser, 
    switchRole, 
    notifications, 
    pendingProofsCount, 
    overdueTasksCount, 
    openTma,
    isTmaOpen,
    language,
    setLanguage,
    theme,
    toggleTheme
  } = useApp();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between gap-8 sticky top-0 z-30 transition-colors">
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
          <span>UniTask Platform</span>
        </a>
        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium hidden lg:inline">
          ToshTech 2026–2027 Ish Rejasi
        </span>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
        <button
          onClick={() => setActiveView('dashboard')}
          className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            activeView === 'dashboard' ? 'text-slate-900 dark:text-white font-semibold border-b-2 border-slate-900 dark:border-sky-500' : ''
          }`}
        >
          Boshqaruv Paneli
        </button>
        <button
          onClick={() => setActiveView('tasks')}
          className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            activeView === 'tasks' ? 'text-slate-900 dark:text-white font-semibold border-b-2 border-slate-900 dark:border-sky-500' : ''
          }`}
        >
          Ish Reja Vazifalari
        </button>
        <button
          onClick={() => setActiveView('proofs')}
          className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 flex items-center gap-1.5 ${
            activeView === 'proofs' ? 'text-slate-900 dark:text-white font-semibold border-b-2 border-slate-900 dark:border-sky-500' : ''
          }`}
        >
          <span>Ko'rik Nazorati</span>
          {pendingProofsCount > 0 && (
            <span className="text-[11px] font-mono px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 rounded font-semibold border border-transparent dark:border-amber-800/40">
              {pendingProofsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveView('excel')}
          className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            activeView === 'excel' ? 'text-slate-900 dark:text-white font-semibold border-b-2 border-slate-900 dark:border-sky-500' : ''
          }`}
        >
          Excel Import/Eksport
        </button>
        <button
          onClick={() => setActiveView('scheduler')}
          className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            activeView === 'scheduler' ? 'text-slate-900 dark:text-white font-semibold border-b-2 border-slate-900 dark:border-sky-500' : ''
          }`}
        >
          Telegram Navbati
        </button>
      </nav>

      {/* Zone 3: Actions, Role Selector & TMA Launcher */}
      <div className="flex items-center gap-2.5 shrink-0">
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
        <div className="relative hidden xl:block">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-1.5 px-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500 font-medium"
          >
            <option value="uz_latn">O'zbekcha (Lotin)</option>
            <option value="uz_cyrl">Ўзбекча (Кирилл)</option>
            <option value="ru">Русский</option>
            <option value="en">English</option>
          </select>
        </div>

        {/* 5-Tier RBAC Switcher for fast verification */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 pl-1.5 pr-0.5 hidden sm:inline">Rol:</span>
          <select
            value={currentUser.role}
            onChange={(e) => switchRole(e.target.value as UserRole)}
            className="text-xs font-semibold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 py-1 px-2 rounded-md shadow-xs border border-slate-200/80 dark:border-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="DIRECTOR">DIRECTOR (Rektor)</option>
            <option value="HEAD">HEAD (Bo'lim Boshlig'i)</option>
            <option value="ADMIN">ADMIN (Tizim Admini)</option>
            <option value="WORKER">WORKER (Ijrochi Xodim)</option>
            <option value="USER">USER (Murojaatchi)</option>
          </select>
        </div>

        {/* Telegram Mini App (TMA) Simulator Launch Button */}
        <button
          onClick={() => openTma()}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs ${
            isTmaOpen 
              ? 'bg-sky-600 text-white shadow-sky-600/20' 
              : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white border border-transparent dark:border-slate-700'
          }`}
          title="Telegram Mini App (TMA) mobil interfeysini ochish"
        >
          <Smartphone className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Telegram Mini App</span>
          <span className="sm:hidden">TMA</span>
        </button>

        {/* Notification bell */}
        <button 
          onClick={() => setActiveView('scheduler')}
          className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Telegram bildirishnomalari"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full" />
          )}
        </button>
      </div>
    </header>
  );
};
