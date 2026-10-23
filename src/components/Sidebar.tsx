import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  CheckSquare, 
  FileCheck2, 
  FileSpreadsheet, 
  Users2, 
  Timer, 
  History, 
  HelpCircle,
  Smartphone,
  Send,
  Building2,
  ExternalLink
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  const { 
    currentUser, 
    tasks, 
    pendingProofsCount, 
    overdueTasksCount, 
    openTma,
    workPlanProgressPercent
  } = useApp();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Boshqaruv Paneli',
      icon: LayoutDashboard,
      badge: null,
      allowedRoles: ['DIRECTOR', 'HEAD', 'ADMIN', 'WORKER', 'USER'],
    },
    {
      id: 'tasks',
      label: 'Ish Reja Vazifalari',
      icon: CheckSquare,
      badge: tasks.length.toString(),
      allowedRoles: ['DIRECTOR', 'HEAD', 'ADMIN', 'WORKER'],
    },
    {
      id: 'proofs',
      label: 'Proof-of-Work Tekshiruvi',
      icon: FileCheck2,
      badge: pendingProofsCount > 0 ? pendingProofsCount.toString() : null,
      badgeColor: 'amber',
      allowedRoles: ['DIRECTOR', 'HEAD', 'ADMIN'],
    },
    {
      id: 'excel',
      label: 'Excel Ingestion & Reja',
      icon: FileSpreadsheet,
      badge: null,
      allowedRoles: ['DIRECTOR', 'HEAD', 'ADMIN'],
    },
    {
      id: 'users',
      label: 'Xodimlar & Telegram ID',
      icon: Users2,
      badge: null,
      allowedRoles: ['DIRECTOR', 'HEAD', 'ADMIN'],
    },
    {
      id: 'scheduler',
      label: 'Redis & Queue Navbati',
      icon: Timer,
      badge: overdueTasksCount > 0 ? `${overdueTasksCount} overdue` : null,
      badgeColor: 'rose',
      allowedRoles: ['DIRECTOR', 'HEAD', 'ADMIN'],
    },
    {
      id: 'audit',
      label: 'Audit Jurnali',
      icon: History,
      badge: null,
      allowedRoles: ['DIRECTOR', 'ADMIN'],
    },
    {
      id: 'servicedesk',
      label: 'Murojaatlar (HelpDesk)',
      icon: HelpCircle,
      badge: null,
      allowedRoles: ['DIRECTOR', 'HEAD', 'ADMIN', 'WORKER', 'USER'],
    },
  ];

  return (
    <aside className="w-64 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)] transition-colors">
      {/* Navigation Links */}
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Modullar &amp; Nazorat
        </div>

        {navItems.map((item) => {
          const isAllowed = item.allowedRoles.includes(currentUser.role);
          const isActive = activeView === item.id;
          const Icon = item.icon;

          if (!isAllowed) return null;

          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                isActive 
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-xs border border-slate-200 dark:border-slate-700' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-900 dark:text-sky-400' : 'text-slate-500 dark:text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                  item.badgeColor === 'amber'
                    ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-transparent dark:border-amber-800/40'
                    : item.badgeColor === 'rose'
                      ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-transparent dark:border-rose-800/40'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-transparent dark:border-slate-700'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Quick Launch Mobile TMA Banner */}
        <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="p-3 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-xl text-white shadow-xs border border-transparent dark:border-slate-700/60">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <Send className="w-3 h-3 text-sky-400" />
                Telegram Mini App
              </span>
              <span className="text-[10px] font-mono text-slate-400">@UniTaskBot</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
              Xodimlar uchun mobil topshiriqlar, Clock-In va Proof-of-Work yuklash interfeysi.
            </p>
            <button
              onClick={() => openTma()}
              className="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-lg text-xs transition-colors shadow-xs cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mini Appni ochish</span>
            </button>
          </div>
        </div>
      </div>

      {/* User Status Card */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-xs shrink-0 border border-slate-300 dark:border-slate-700">
            {currentUser.fullName.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
              {currentUser.fullName}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {currentUser.roleLabel}
            </div>
          </div>
        </div>

        {currentUser.departmentName && (
          <div className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
            <Building2 className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
            <span className="truncate">{currentUser.departmentName}</span>
          </div>
        )}

        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
          <span className="text-slate-500 dark:text-slate-400">Telegram:</span>
          {currentUser.isTelegramBound ? (
            <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-transparent dark:border-emerald-800/40">
              Ulangan (ID: {currentUser.telegramId?.slice(0, 4)}***)
            </span>
          ) : (
            <span className="font-mono text-[10px] text-amber-700 dark:text-amber-300 font-semibold bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-transparent dark:border-amber-800/40">
              Ulanmagan
            </span>
          )}
        </div>
      </div>
    </aside>
  );
};
