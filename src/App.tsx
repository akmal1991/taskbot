import React, { lazy, Suspense, useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './components/LoginPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoaderCircle } from 'lucide-react';
import { canAccessView } from './utils/permissions';
const Dashboard = lazy(()=>import('./components/Dashboard').then(m=>({default:m.Dashboard})));
const TaskRegister = lazy(()=>import('./components/TaskRegister').then(m=>({default:m.TaskRegister})));
const ProofVerificationConsole = lazy(()=>import('./components/ProofVerificationConsole').then(m=>({default:m.ProofVerificationConsole})));
const ExcelManager = lazy(()=>import('./components/ExcelManager').then(m=>({default:m.ExcelManager})));
const AdminPanel = lazy(()=>import('./components/AdminPanel').then(m=>({default:m.AdminPanel})));
const AccountPanel = lazy(()=>import('./components/AccountPanel').then(m=>({default:m.AccountPanel})));
const SchedulerQueueConsole = lazy(()=>import('./components/SchedulerQueueConsole').then(m=>({default:m.SchedulerQueueConsole})));
const AuditLogView = lazy(()=>import('./components/AuditLogView').then(m=>({default:m.AuditLogView})));
const ServiceDeskView = lazy(()=>import('./components/ServiceDeskView').then(m=>({default:m.ServiceDeskView})));
const TelegramMiniAppModal = lazy(()=>import('./components/TelegramMiniAppModal').then(m=>({default:m.TelegramMiniAppModal})));

const MainLayout: React.FC = () => {
  const [activeView, setActiveView] = useState<string>(() => window.location.hash.slice(1) || 'dashboard');
  const { currentUser, permissions, loading, error, refreshState, isTmaOpen } = useApp();
  const visibleView = canAccessView(activeView, currentUser.role, permissions) ? activeView : 'denied';

  useEffect(() => {
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${activeView}`);
  }, [activeView]);
  useEffect(() => {
    const change = () => setActiveView(window.location.hash.slice(1) || 'dashboard');
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-slate-200 dark:selection:bg-slate-800 transition-colors">
      {/* Top Bar */}
      <Header activeView={visibleView} setActiveView={setActiveView} />

      {error && <div role="alert" className="bg-rose-50 px-6 py-3 text-sm text-rose-900 dark:bg-rose-950 dark:text-rose-200">
        {error} <button className="ml-3 font-bold underline" onClick={() => { void refreshState().catch(() => {}); }}>Retry</button>
      </div>}

      {/* Main Container with Sidebar + Content */}
      <div className="flex-1 flex max-w-[1720px] w-full mx-auto">
        <div className="hidden md:block">
          <Sidebar activeView={visibleView} setActiveView={setActiveView} />
        </div>

        <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 overflow-y-auto">
          {loading ? <div role="status" className="flex justify-center py-24"><LoaderCircle className="animate-spin" aria-label="Loading" /></div> : <Suspense fallback={<div role="status" className="flex justify-center py-24"><LoaderCircle className="animate-spin" aria-label="Loading" /></div>}>
          {visibleView === 'dashboard' && <Dashboard setActiveView={setActiveView} />}
          {visibleView === 'tasks' && <TaskRegister />}
          {visibleView === 'proofs' && <ProofVerificationConsole />}
          {visibleView === 'excel' && <ExcelManager />}
          {['users', 'admin'].includes(visibleView) && <AdminPanel />}
          {visibleView === 'scheduler' && <SchedulerQueueConsole />}
          {visibleView === 'audit' && <AuditLogView />}
          {visibleView === 'servicedesk' && <ServiceDeskView />}
          {visibleView === 'account' && <AccountPanel />}
          {visibleView === 'denied' && <section role="alert" className="rounded-xl border border-rose-200 bg-white p-8 dark:bg-slate-900">
            <h1 className="text-xl font-bold">Access denied</h1><p className="mt-2">You do not have permission to open this module.</p>
            <button onClick={() => setActiveView('dashboard')} className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-white">Boshqaruv Paneli</button>
          </section>}
          </Suspense>}
        </main>
      </div>

      {!loading && isTmaOpen && <Suspense fallback={<div role="status" className="fixed bottom-4 right-4 rounded-lg bg-white p-4 shadow">Loading</div>}><TelegramMiniAppModal /></Suspense>}
    </div>
  );
};

const AuthenticatedApp = () => {
  const { user, loading } = useAuth();
  if (loading) return <div role="status" className="grid min-h-screen place-items-center bg-slate-50"><LoaderCircle className="animate-spin" aria-label="Loading" /></div>;
  return user ? <AppProvider key={user.id}><MainLayout /></AppProvider> : <LoginPage />;
};
export default function App() { return <AuthProvider><AuthenticatedApp /></AuthProvider>; }
