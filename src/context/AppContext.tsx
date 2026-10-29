import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { User, Department, Task, TaskProof, AuditLog, QueueJob, TelegramNotification, ServiceDeskTicket, Language, WorkPlanSection } from '../types';
import { useAuth } from './AuthContext';
import { api } from '../utils/api';
import { normalizeLanguage, syncDocumentLanguage } from '../utils/i18n';
import { readLanguagePreference, saveLanguagePreference } from '../utils/preferences';
import type { Permission } from '../../shared/policy';

interface ServerState {
  users: User[]; departments: Department[]; tasks: Task[]; auditLogs: AuditLog[];
  queueJobs: QueueJob[]; notifications: TelegramNotification[]; tickets: ServiceDeskTicket[];
  sections: WorkPlanSection[]; workPlans: { id: string; title: string; year: number; active: boolean; sections: WorkPlanSection[] }[];
  categories: { id: string; name: string; active: boolean }[];
}
interface AppContextType extends ServerState {
  currentUser: User; permissions: Permission[]; language: Language; setLanguage: (language: Language) => void;
  theme: 'light' | 'dark'; toggleTheme: () => void; setTheme: (theme: 'light' | 'dark') => void;
  loading: boolean; error: string; dismissError: () => void; refreshState: () => Promise<void>;
  isTmaOpen: boolean; activeTmaTaskId: string | null; openTma: (taskId?: string) => void; closeTma: () => void;
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'proofs'>) => Promise<Task>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  clockInTask: (taskId: string) => Promise<void>;
  submitProof: (taskId: string, proof: Omit<TaskProof, 'id' | 'submittedAt' | 'status'>) => Promise<boolean>;
  approveProof: (taskId: string, proofId: string, remarks: string) => Promise<void>;
  rejectProof: (taskId: string, proofId: string, remarks: string) => Promise<void>;
  addTaskComment: (taskId: string, content: string, parentId?: string) => Promise<void>;
  toggleCommentReaction: (taskId: string, commentId: string, emoji: string) => Promise<void>;
  importTasks: (tasks: Partial<Task>[]) => Promise<void>; triggerJobRun: (id: string) => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  createTicket: (ticket: Omit<ServiceDeskTicket, 'id' | 'ticketNumber' | 'status' | 'createdAt'>) => Promise<void>;
  resolveTicket: (id: string, responseNote: string) => Promise<void>;
  workPlanProgressPercent: number; overdueTasksCount: number; pendingProofsCount: number;
}
const AppContext = createContext<AppContextType | undefined>(undefined);
const empty: ServerState = { users: [], departments: [], tasks: [], auditLogs: [], queueJobs: [], notifications: [], tickets: [], sections: [], workPlans: [], categories: [] };
const preference = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const storePreference = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* Preferences are optional; records are always server-owned. */ } };
const taskFields = ['planCode','title','description','expectedOutcome','acceptanceCriteria','sourceReference','fundingSource','assignedDate',
  'assignedToId','departmentId','additionalAssignees','approverId','workPlanId','sectionId','categoryId','priority','deadline','requiresEvidence','requiresApproval','draft','dependsOnIds'] as const;
const pickTaskInput = (task: Partial<Task>) => Object.fromEntries(taskFields.filter(k => task[k] !== undefined).map(k => [k, task[k]]));

export const AppProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { user, permissions } = useAuth();
  if (!user) throw new Error('Sign in before opening application data.');
  const [state, setState] = useState<ServerState>(empty);
  const [language, setLanguageState] = useState<Language>(() => syncDocumentLanguage(readLanguagePreference()));
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => preference('unitask_theme') === 'dark' ? 'dark' : 'light');
  const [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [isTmaOpen, setTmaOpen] = useState(false), [activeTmaTaskId, setActiveTmaTaskId] = useState<string | null>(null);
  const requestNumber = useRef(0);
  const refreshState = useCallback(async () => {
    const number = ++requestNumber.current;
    try {
      const data = await api<ServerState>('/state');
      if (number === requestNumber.current) { setState(data); setError(''); }
    } catch (e) { if (number === requestNumber.current) setError((e as Error).message); throw e; }
    finally { if (number === requestNumber.current) setLoading(false); }
  }, []);
  useEffect(() => {
    const refresh = () => { void refreshState().catch(() => {}); };
    refresh(); const timer = setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => { clearInterval(timer); window.removeEventListener('focus', refresh); requestNumber.current++; };
  }, [refreshState]);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark'); storePreference('unitask_theme', theme);
  }, [theme]);
  const setLanguage = (next: Language) => { setLanguageState(saveLanguagePreference(next)); };
  const mutate = async <T,>(path: string, body?: unknown, method = 'POST'): Promise<T> => {
    try { const result = await api<T>(path, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }); await refreshState(); return result; }
    catch (e) { setError((e as Error).message); throw e; }
  };
  const version = (taskId: string) => {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task?.version) throw new Error('Task is unavailable. Reload the task list.');
    return task.version;
  };
  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    if (updates.progressPercent !== undefined) {
      await mutate(`/tasks/${encodeURIComponent(taskId)}/progress`, { version: version(taskId), progressPercent: updates.progressPercent });
    } else {
      const fields = pickTaskInput(updates); delete fields.planCode;
      await mutate(`/tasks/${encodeURIComponent(taskId)}`, { ...fields, version: version(taskId) }, 'PATCH');
    }
  };
  const createTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'proofs'>) =>
    (await mutate<{ task: Task }>('/tasks', pickTaskInput(task))).task;
  const review = async (taskId: string, evidenceId: string, remarks: string, decision: 'APPROVED' | 'REJECTED') => {
    await mutate(`/tasks/${encodeURIComponent(taskId)}/reviews`, { version: version(taskId), evidenceId, remarks, decision });
  };
  const activeTasks = state.tasks.filter(t => !t.archivedAt && !t.draft);
  return <AppContext.Provider value={{
    ...state, currentUser: user, permissions, language, setLanguage, theme, setTheme: setThemeState,
    toggleTheme: () => setThemeState(value => value === 'dark' ? 'light' : 'dark'),
    loading, error, dismissError: () => setError(''), refreshState, isTmaOpen, activeTmaTaskId,
    openTma: taskId => { setActiveTmaTaskId(taskId || null); setTmaOpen(true); }, closeTma: () => setTmaOpen(false),
    createTask, updateTask,
    clockInTask: async taskId => { await mutate(`/tasks/${encodeURIComponent(taskId)}/start`, { version: version(taskId) }); },
    submitProof: async (taskId, proof) => {
      await mutate(`/tasks/${encodeURIComponent(taskId)}/evidence`, { version: version(taskId), type: proof.type, note: proof.note,
        ...(proof.attachmentId ? { attachmentId: proof.attachmentId } : {}), ...(proof.artifactUrl ? { artifactUrl: proof.artifactUrl } : {}) });
      return true;
    },
    approveProof: (taskId, evidenceId, remarks) => review(taskId, evidenceId, remarks, 'APPROVED'),
    rejectProof: (taskId, evidenceId, remarks) => review(taskId, evidenceId, remarks, 'REJECTED'),
    addTaskComment: async (taskId, content, parentId) => { await mutate(`/tasks/${encodeURIComponent(taskId)}/comments`, { content, ...(parentId ? { parentId } : {}) }); },
    toggleCommentReaction: async (taskId, commentId, emoji) => { await mutate(`/tasks/${encodeURIComponent(taskId)}/reactions`, { commentId, emoji }); },
    importTasks: async tasks => {
      if (tasks.some(t => (t.progressPercent ?? 0) !== 0 || (t.status && t.status !== 'ASSIGNED')))
        throw new Error('Use the reviewed JSON migration to preserve historical task progress and decisions.');
      const input = { tasks: tasks.map(pickTaskInput), source: 'Excel work plan' };
      const preview = await api<{ errors: string[]; digest: string }>('/imports/preview', { method: 'POST', body: JSON.stringify(input) });
      if (preview.errors.length) throw new Error(preview.errors.join('\n'));
      await mutate('/imports/commit', { ...input, digest: preview.digest });
    },
    triggerJobRun: async job => { await mutate('/admin/jobs/run', { job }); },
    markNotificationAsRead: async notice => { await mutate(`/notifications/${encodeURIComponent(notice)}/read`); },
    createTicket: async ticket => { await mutate('/tickets', { title: ticket.title, description: ticket.description, departmentId: ticket.departmentId, priority: ticket.priority }); },
    resolveTicket: async (ticketId, responseNote) => { await mutate(`/tickets/${encodeURIComponent(ticketId)}/resolve`, { responseNote }); },
    workPlanProgressPercent: activeTasks.length ? Math.round(activeTasks.reduce((n, t) => n + t.progressPercent, 0) / activeTasks.length) : 0,
    overdueTasksCount: activeTasks.filter(t => t.isOverdue).length,
    pendingProofsCount: activeTasks.filter(t => t.status === 'SUBMITTED_FOR_REVIEW').length,
  }}>{children}</AppContext.Provider>;
};
export const useApp = () => {
  const value = useContext(AppContext);
  if (!value) throw new Error('AppProvider is required.');
  return value;
};
