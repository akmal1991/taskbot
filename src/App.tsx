import React, { useState } from 'react';
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

const MainLayout: React.FC = () => {
  const [activeView, setActiveView] = useState<string>('dashboard');
  const { currentUser } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-slate-200 dark:selection:bg-slate-800 transition-colors">
      {/* Top Bar */}
      <Header activeView={activeView} setActiveView={setActiveView} />

      {/* Main Container with Sidebar + Content */}
      <div className="flex-1 flex max-w-[1720px] w-full mx-auto">
        <Sidebar activeView={activeView} setActiveView={setActiveView} />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {activeView === 'dashboard' && <Dashboard setActiveView={setActiveView} />}
          {activeView === 'tasks' && <TaskRegister />}
          {activeView === 'proofs' && <ProofVerificationConsole />}
          {activeView === 'excel' && <ExcelManager />}
          {activeView === 'users' && <UserManagement />}
          {activeView === 'scheduler' && <SchedulerQueueConsole />}
          {activeView === 'audit' && <AuditLogView />}
          {activeView === 'servicedesk' && <ServiceDeskView />}
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
