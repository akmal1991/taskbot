import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { TaskRegister } from './components/TaskRegister';
import { ProofVerificationConsole } from './components/ProofVerificationConsole';
import { ExcelManager } from './components/ExcelManager';
import { UserManagement } from './components/UserManagement';
import { SchedulerQueueConsole } from './components/SchedulerQueueConsole';
import { AuditLogView } from './components/AuditLogView';
import { ServiceDeskView } from './components/ServiceDeskView';
import { TelegramMiniAppModal } from './components/TelegramMiniAppModal';
import { canAccessView } from './utils/permissions';

const MainLayout: React.FC = () => {
  const [activeView, setActiveView] = useState<string>('dashboard');
  const { currentUser, storageStatus } = useApp();
  const visibleView = canAccessView(activeView, currentUser.role) ? activeView : 'dashboard';

  useEffect(() => {
    if (visibleView !== activeView) setActiveView(visibleView);
  }, [activeView, visibleView]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-slate-200 dark:selection:bg-slate-800 transition-colors">
      {/* Top Bar */}
      <Header activeView={visibleView} setActiveView={setActiveView} />

      {storageStatus !== 'saved' && (
        <div
          role="status"
          className={`px-6 py-2 text-xs ${
            storageStatus === 'unavailable'
              ? 'bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200'
              : storageStatus === 'recovered'
                ? 'bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200'
                : 'bg-sky-50 text-sky-900 dark:bg-sky-950/60 dark:text-sky-200'
          }`}
        >
          {storageStatus === 'demo' &&
            'Demo ma’lumotlari yuklandi. O‘zgarishlar ushbu qurilmada saqlanadi.'}
          {storageStatus === 'recovered' &&
            'Saqlangan ma’lumotlarni o‘qib bo‘lmadi. Demo ma’lumotlari yuklandi, avvalgi nusxa zaxiralandi va yangi o‘zgarishlar ushbu qurilmada saqlanadi.'}
          {storageStatus === 'unavailable' &&
            'Brauzer xotirasi mavjud emas. O‘zgarishlar sahifani yangilagandan so‘ng saqlanmasligi mumkin.'}
        </div>
      )}

      {/* Main Container with Sidebar + Content */}
      <div className="flex-1 flex max-w-[1720px] w-full mx-auto">
        <div className="hidden md:block">
          <Sidebar activeView={visibleView} setActiveView={setActiveView} />
        </div>

        <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 overflow-y-auto">
          {visibleView === 'dashboard' && <Dashboard setActiveView={setActiveView} />}
          {visibleView === 'tasks' && <TaskRegister />}
          {visibleView === 'proofs' && <ProofVerificationConsole />}
          {visibleView === 'excel' && <ExcelManager />}
          {visibleView === 'users' && <UserManagement />}
          {visibleView === 'scheduler' && <SchedulerQueueConsole />}
          {visibleView === 'audit' && <AuditLogView />}
          {visibleView === 'servicedesk' && <ServiceDeskView />}
        </main>
      </div>

      {/* Interactive Telegram Mini App & Bot Simulator */}
      <TelegramMiniAppModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
