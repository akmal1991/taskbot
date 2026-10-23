import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, Archive, Building2, Check, ChevronLeft, ChevronRight, CircleAlert, ClipboardList, Cog, Download, KeyRound, Layers3, LoaderCircle, Play, Plus, RefreshCw, RotateCcw, Search, Shield, Trash2, Upload, UsersRound } from 'lucide-react';
import { api } from '../utils/api';
import { useApp } from '../context/AppContext';
import { DraftPlanImportPanel } from './DraftPlanImportPanel';
import { PERMISSIONS, ROLES, type Role } from '../../shared/policy';
import type { Task } from '../types';
import { localizeText } from '../utils/i18n';
import { AdminAlert, AdminButton, AdminField, AdminInput, AdminModal, AdminPanelShell, AdminSelect, AdminSkeleton, AdminTextarea } from './AdminPrimitives';

type PanelApp = { users: any[]; departments: any[]; tasks: Task[]; currentUser: any; language: string; refreshState: () => Promise<void> };
type Overview = {
  users: any[]; departments: any[]; rolePermissions: Record<Role, string[]>; permissionCeilings: Record<Role, string[]>;
  workPlans: any[]; categories: any[]; imports: any[]; settings: { notificationsEnabled: boolean; reminderHour: number; reminderTemplate: string };
  deliveries: any[]; stats: { tasks: number; users: number; departments: number };
};
type Area = 'overview' | 'users' | 'departments' | 'roles' | 'plans' | 'tasks' | 'settings' | 'delivery' | 'migration';
type FormState = { type: 'user' | 'department' | 'plan' | 'section' | 'category'; id?: string; values: Record<string, any> };
const PERMISSION_NAMES: Record<string, string> = {
  'users.manage': 'Manage users', 'roles.manage': 'Manage roles', 'departments.manage': 'Manage departments', 'settings.manage': 'Manage settings',
  'tasks.readAll': 'Read all tasks', 'tasks.create': 'Create tasks', 'tasks.edit': 'Edit tasks', 'tasks.archive': 'Archive tasks', 'tasks.delete': 'Delete eligible drafts',
  'tasks.start': 'Start tasks', 'tasks.progress': 'Update progress', 'tasks.submit': 'Submit tasks', 'tasks.comment': 'Comment on tasks',
  'tasks.review': 'Review tasks', 'workplans.manage': 'Manage work plans', 'imports.manage': 'Manage imports', 'reports.export': 'Export reports',
  'audit.read': 'Read audit log', 'notifications.manage': 'Manage notifications', 'tickets.resolve': 'Resolve service tickets',
};
const tabs: { id: Area; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: Activity }, { id: 'users', label: 'Users', icon: UsersRound }, { id: 'departments', label: 'Departments', icon: Building2 },
  { id: 'roles', label: 'Role permissions', icon: Shield }, { id: 'plans', label: 'Work plans & categories', icon: Layers3 }, { id: 'tasks', label: 'Task maintenance', icon: ClipboardList },
  { id: 'settings', label: 'Settings', icon: Cog }, { id: 'delivery', label: 'Deliveries & jobs', icon: Play }, { id: 'migration', label: 'Migration', icon: Upload },
];
const emptyOverview: Overview = { users: [], departments: [], rolePermissions: { ADMIN: [], DIRECTOR: [], WORKER: [] }, permissionCeilings: { ADMIN: [], DIRECTOR: [], WORKER: [] }, workPlans: [], categories: [], imports: [], settings: { notificationsEnabled: false, reminderHour: 9, reminderTemplate: '' }, deliveries: [], stats: { tasks: 0, users: 0, departments: 0 } };

export const AdminPanel: React.FC = () => {
  const app = useApp() as unknown as PanelApp;
  const t = (value: string) => localizeText(value, app.language);
  const [area, setArea] = useState<Area>('overview');
  const [overview, setOverview] = useState<Overview>(emptyOverview);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState('name');
  const [page, setPage] = useState(1);
  const [userToken, setUserToken] = useState('');
  const [taskEditor, setTaskEditor] = useState<Task | null>(null);
  const [migrationSnapshot, setMigrationSnapshot] = useState<any>(null);
  const [migrationFileName, setMigrationFileName] = useState('');
  const [migrationPreview, setMigrationPreview] = useState<any>(null);
  const [roleMapping, setRoleMapping] = useState<Record<string, Role>>({});
  const [backupConfirmed, setBackupConfirmed] = useState(false);
  const [commitConfirmed, setCommitConfirmed] = useState(false);

  const reloadState = app.refreshState;
  const refreshOverview = useCallback(async () => {
    setLoadError('');
    try {
      const data = await api<Overview>('/admin/overview');
      setOverview(data);
    } catch (e) { setLoadError((e as Error).message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refreshOverview(); }, [refreshOverview]);
  useEffect(() => { setPage(1); }, [search, area]);
  const refreshAll = async () => { await refreshOverview(); if (reloadState) await reloadState(); };
  const mutate = async <T,>(path: string, method: string, body?: unknown): Promise<T | undefined> => {
    setBusy(true); setActionError(''); setSuccess(''); setUserToken('');
    try {
      const result = await api<T>(path, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
      await refreshAll();
      return result;
    } catch (e) { setActionError((e as Error).message); return undefined; }
    finally { setBusy(false); }
  };
  const openForm = (type: FormState['type'], value?: any) => setForm({ type, id: value?.id, values: value ? { ...value } : {} });
  const submitForm = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form) return;
    const v = form.values;
    let path = '';
    let body: any = {};
    let method = form.id ? 'PATCH' : 'POST';
    if (form.type === 'user') {
      path = form.id ? `/admin/users/${encodeURIComponent(form.id)}` : '/admin/users';
      body = { username: v.username, email: v.email, fullName: v.fullName, role: v.role, departmentId: v.departmentId || null, phone: v.phone, ...(form.id ? { active: Boolean(v.active) } : {}) };
    } else if (form.type === 'department') {
      path = form.id ? `/admin/departments/${encodeURIComponent(form.id)}` : '/admin/departments';
      body = { code: v.code, name: v.name, coordinatorId: v.coordinatorId || null, ...(form.id ? { active: Boolean(v.active) } : {}) };
    } else if (form.type === 'plan') {
      path = form.id ? `/admin/work-plans/${encodeURIComponent(form.id)}` : '/admin/work-plans';
      body = { title: v.title, year: Number(v.year), ...(form.id ? { active: Boolean(v.active) } : {}) };
    } else if (form.type === 'section') {
      path = form.id ? `/admin/sections/${encodeURIComponent(form.id)}` : `/admin/work-plans/${encodeURIComponent(v.workPlanId)}/sections`;
      body = { number: v.number, title: v.title };
    } else {
      path = form.id ? `/admin/categories/${encodeURIComponent(form.id)}` : '/admin/categories';
      body = { name: v.name, ...(form.id ? { active: Boolean(v.active) } : {}) };
    }
    const response = await mutate<any>(path, method, body);
    if (response) {
      setForm(null);
      if (form.type === 'user' && !form.id && response.token) setUserToken(`${window.location.origin}?setup=${encodeURIComponent(response.token)}`);
      setSuccess(t('Changes saved successfully.'));
    }
  };
  const runReset = async (userId: string, purpose: 'RESET' | 'ACTIVATE') => {
    if (!window.confirm(t(purpose === 'ACTIVATE' ? 'Create an account activation link for this user?' : 'Issue a password reset link for this user?'))) return;
    const response = await mutate<{ token: string }>('/admin/users/' + encodeURIComponent(userId) + '/reset', 'POST', { purpose });
    if (response?.token) setUserToken(`${window.location.origin}?setup=${encodeURIComponent(response.token)}`);
  };
  const launchJob = async (job: 'reminders' | 'delivery') => {
    const result = await mutate<{ processed: number }>('/admin/jobs/run', 'POST', { job });
    if (result) setSuccess(`${t('Job completed')}: ${result.processed}`);
  };
  const filteredUsers = useMemo(() => overview.users.filter(u =>
    `${u.fullName} ${u.username} ${u.email} ${u.role}`.toLowerCase().includes(search.toLowerCase()) &&
    (!roleFilter || u.role === roleFilter) &&
    (!statusFilter || (statusFilter === 'ACTIVE' ? u.active : !u.active))
  ).sort((a, b) => String(sortField === 'email' ? a.email : a.fullName).localeCompare(String(sortField === 'email' ? b.email : b.fullName))), [overview.users, search, roleFilter, statusFilter, sortField]);
  const tasks = app.tasks || [];
  const filteredTasks = useMemo(() => tasks.filter(task =>
    `${task.title} ${task.planCode} ${task.status}`.toLowerCase().includes(search.toLowerCase()) &&
    (!statusFilter || (statusFilter === 'OVERDUE' ? Boolean(task.isOverdue) : task.status === statusFilter))
  ).sort((a, b) => String(sortField === 'deadline' ? a.deadline : a.title).localeCompare(String(sortField === 'deadline' ? b.deadline : b.title))), [tasks, search, statusFilter, sortField]);
  const pageSize = 10;
  const pages = Math.max(1, Math.ceil((area === 'users' ? filteredUsers.length : filteredTasks.length) / pageSize));
  const currentRows = (area === 'users' ? filteredUsers : filteredTasks).slice((page - 1) * pageSize, page * pageSize);
  const inputClass = 'min-h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800';
  const cardClass = 'rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900';
  const statCards = [
    { label: 'Tasks', value: overview.stats.tasks, icon: ClipboardList, color: 'text-sky-700 bg-sky-50 dark:text-sky-300 dark:bg-sky-950/40' },
    { label: 'Users', value: overview.stats.users, icon: UsersRound, color: 'text-indigo-700 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-950/40' },
    { label: 'Departments', value: overview.stats.departments, icon: Building2, color: 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40' },
  ];

  if (app.currentUser?.role !== 'ADMIN') return <AdminPanelShell title={t('Administration')}><AdminAlert tone="error">{t('Administrator access is required to view this console.')}</AdminAlert></AdminPanelShell>;
  if (loading) return <AdminPanelShell title={t('Administration')} subtitle={t('Loading current system data')}><AdminSkeleton /></AdminPanelShell>;

  return <AdminPanelShell title={t('Administration')} subtitle={t('Central control for accounts, work plans, task governance, and system operations.')}>
    <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
      <nav aria-label={t('Administration sections')} className={`${cardClass} h-fit overflow-x-auto p-2 lg:sticky lg:top-5`}>
        <div className="flex min-w-max gap-1 lg:min-w-0 lg:flex-col">{tabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => { setArea(id); setStatusFilter(''); setRoleFilter(''); setSortField('name'); }} className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${area === id ? 'bg-slate-900 text-white dark:bg-sky-700' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}><Icon size={16} /><span>{t(label)}</span></button>)}</div>
      </nav>
      <div className="min-w-0 space-y-4">
        {loadError && <AdminAlert tone="error"><div className="flex items-center justify-between gap-3"><span>{t('Could not load administration data')}: {loadError}</span><AdminButton onClick={() => { setLoading(true); void refreshOverview(); }}><RefreshCw size={15} />{t('Retry')}</AdminButton></div></AdminAlert>}
        {actionError && <AdminAlert tone="error">{actionError}</AdminAlert>}
        {success && <AdminAlert tone="success">{success}</AdminAlert>}
        {userToken && <AdminAlert tone="success"><div className="space-y-2"><p className="font-semibold">{t('One-time setup link. Share it securely; it will not be stored.')}</p><div className="flex flex-col gap-2 sm:flex-row"><input readOnly value={userToken} className={inputClass} aria-label={t('Setup link')} /><AdminButton onClick={async () => { try { await navigator.clipboard.writeText(userToken); setSuccess(t('Link copied.')); } catch { setActionError(t('Clipboard unavailable. Select and copy the link manually.')); } }}>{t('Copy link')}</AdminButton></div></div></AdminAlert>}

        {area === 'overview' && <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">{statCards.map(({ label, value, icon: Icon, color }) => <article key={label} className={`${cardClass} flex items-center justify-between p-4`}><div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t(label)}</p><p className="mt-2 font-mono text-3xl font-bold tabular-nums text-slate-900 dark:text-white">{value}</p></div><div className={`rounded-xl p-3 ${color}`}><Icon size={20} /></div></article>)}</div>
          <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
            <article className={`${cardClass} p-5`}><div className="flex items-center justify-between gap-3"><div><h2 className="font-bold">{t('Recent imports')}</h2><p className="mt-1 text-xs text-slate-500">{t('Latest administrative data operations')}</p></div><Download size={18} className="text-slate-400" /></div>
              {overview.imports.length ? <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">{overview.imports.slice(0, 6).map((item: any) => <div key={item.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><div><p className="font-semibold">{item.source}</p><p className="text-xs text-slate-500">{item.rowCount} {t('rows')} · {item.operatorName}</p></div><time className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</time></div>)}</div> : <p className="mt-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800">{t('No import activity yet.')}</p>}
            </article>
            <article className={`${cardClass} p-5`}><h2 className="font-bold">{t('System activity')}</h2><p className="mt-1 text-xs text-slate-500">{t('Delivery status from the server')}</p>
              <div className="mt-4 space-y-2">{overview.deliveries.slice(0, 4).map((d: any) => <div key={d.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-800"><div className="min-w-0"><p className="truncate text-sm font-semibold">{d.title}</p><p className="text-xs text-slate-500">{d.recipientName} · {d.attempts} {t('attempts')}</p></div><span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-bold uppercase dark:bg-slate-700">{t(d.status)}</span></div>)}
              {!overview.deliveries.length && <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800">{t('No delivery records.')}</p>}</div>
            </article>
          </div>
        </div>}

        {area === 'users' && <section className={`${cardClass} overflow-hidden`}>
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold">{t('Account directory')}</h2><p className="mt-1 text-xs text-slate-500">{t('User management is restricted to administrators.')}</p></div><AdminButton tone="primary" onClick={() => openForm('user')}><Plus size={16} />{t('Add user')}</AdminButton></div>
          <div className="flex flex-col gap-2 p-4 sm:flex-row sm:flex-wrap">
            <SearchControl value={search} onChange={setSearch} placeholder={t('Search users')} />
            <AdminSelect aria-label={t('Filter by role')} value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="sm:max-w-44"><option value="">{t('All roles')}</option>{ROLES.map(role => <option key={role} value={role}>{t(role)}</option>)}</AdminSelect>
            <AdminSelect aria-label={t('Filter by status')} value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="sm:max-w-40"><option value="">{t('All statuses')}</option><option value="ACTIVE">{t('Active')}</option><option value="INACTIVE">{t('Inactive')}</option></AdminSelect>
            <AdminSelect aria-label={t('Sort users')} value={sortField} onChange={e => setSortField(e.target.value)} className="sm:max-w-44"><option value="name">{t('Sort by name')}</option><option value="email">{t('Sort by email')}</option></AdminSelect>
          </div>
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-800"><tr><th className="px-4 py-3">{t('Account')}</th><th className="px-4 py-3">{t('Department')}</th><th className="px-4 py-3">{t('Role')}</th><th className="px-4 py-3">{t('Status')}</th><th className="px-4 py-3 text-right">{t('Actions')}</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{(currentRows as any[]).map(user => <tr key={user.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50"><td className="px-4 py-3"><p className="font-semibold">{user.fullName}</p><p className="text-xs text-slate-500">{user.username} · {user.email}</p></td><td className="px-4 py-3">{user.departmentName || '—'}</td><td className="px-4 py-3"><RoleChip role={user.role} /></td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${user.active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800'}`}>{t(user.active ? 'Active' : 'Inactive')}</span></td><td className="px-4 py-3"><div className="flex justify-end gap-2"><AdminButton onClick={() => openForm('user', user)}>{t('Edit')}</AdminButton><AdminButton aria-label={`${t('Reset password')} ${user.fullName}`} onClick={() => void runReset(user.id, 'RESET')}><KeyRound size={14} />{t('Reset')}</AdminButton>{!user.active && <AdminButton aria-label={`${t('Activate')} ${user.fullName}`} onClick={() => void runReset(user.id, 'ACTIVATE')}>{t('Activate')}</AdminButton>}</div></td></tr>)}</tbody></table></div>
          {!filteredUsers.length && <EmptyState title={t('No users found')} detail={t('Try a different search term or add an account.')} />}
          <Pagination page={page} pages={pages} onPage={setPage} label={t('users')} />
        </section>}

        {area === 'departments' && <section className={`${cardClass} overflow-hidden`}>
          <SectionHeader title={t('Departments')} actionLabel={t('Add department')} onAdd={() => openForm('department')} />
          <DataTable columns={[t('Code'), t('Name'), t('Coordinator'), t('Status'), t('Actions')]} rows={overview.departments.map((d: any) => [<code>{d.code}</code>, d.name, overview.users.find((u: any) => u.id === d.coordinatorId)?.fullName || '—', <span>{t(d.active ? 'Active' : 'Inactive')}</span>, <AdminButton onClick={() => openForm('department', d)}>{t('Edit')}</AdminButton>])} empty={t('No departments configured.')} />
        </section>}

        {area === 'roles' && <section className={`${cardClass} p-4 sm:p-5`}><div className="mb-4"><h2 className="font-bold">{t('Role permission matrix')}</h2><p className="mt-1 text-sm text-slate-500">{t('Ceilings are enforced by the server. Administrator permissions are fixed.')}</p></div>
          <div className="space-y-4">{ROLES.map(role => <RolePermissions key={role} role={role} enabled={overview.rolePermissions?.[role] || []} ceiling={overview.permissionCeilings?.[role] || []} onSave={async permissions => { const result = await mutate(`/admin/role-permissions/${role}`, 'PUT', { permissions }); if (result !== undefined) setSuccess(t('Permissions saved.')); }} busy={busy} t={t} />)}</div>
        </section>}

        {area === 'plans' && <div className="space-y-5">
          <DraftPlanImportPanel plans={overview.workPlans} t={t} onCommitted={refreshAll} />
          <section className={`${cardClass} overflow-hidden`}><SectionHeader title={t('Work plans')} actionLabel={t('Add work plan')} onAdd={() => openForm('plan')} />
            <div className="divide-y divide-slate-100 dark:divide-slate-800">{overview.workPlans.map((plan: any) => <div key={plan.id} className="p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-bold">{plan.title}</p><p className="mt-1 text-xs text-slate-500">{plan.year} · {plan.sections?.length || 0} {t('sections')}</p></div><div className="flex gap-2"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800">{t(plan.active ? 'Active' : 'Inactive')}</span><AdminButton onClick={() => openForm('plan', plan)}>{t('Edit')}</AdminButton><AdminButton onClick={() => openForm('section', { workPlanId: plan.id })}><Plus size={14} />{t('Add section')}</AdminButton></div></div>
              {!!plan.sections?.length && <div className="mt-3 grid gap-2 sm:grid-cols-2">{plan.sections.map((section: any) => <div key={section.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800"><span><b>{section.number}</b> · {section.title}</span><AdminButton onClick={() => openForm('section', { ...section, workPlanId: plan.id })}>{t('Edit')}</AdminButton></div>)}</div>}</div>)}</div>
            {!overview.workPlans.length && <EmptyState title={t('No work plans yet')} detail={t('Create a work plan to organize sections and tasks.')} />}
          </section>
          <section className={`${cardClass} overflow-hidden`}><SectionHeader title={t('Task categories')} actionLabel={t('Add category')} onAdd={() => openForm('category')} /><DataTable columns={[t('Category'), t('Status'), t('Actions')]} rows={overview.categories.map((category: any) => [category.name, t(category.active ? 'Active' : 'Inactive'), <AdminButton onClick={() => openForm('category', category)}>{t('Edit')}</AdminButton>])} empty={t('No categories configured.')} /></section>
        </div>}

        {area === 'tasks' && <section className={`${cardClass} overflow-hidden`}>
          <div className="border-b border-slate-200 p-4 dark:border-slate-800"><h2 className="font-bold">{t('Task maintenance')}</h2><p className="mt-1 text-xs text-slate-500">{t('Corrections and lifecycle actions are submitted with the current task version.')}</p><div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap"><SearchControl value={search} onChange={setSearch} placeholder={t('Search tasks')} /><AdminSelect aria-label={t('Filter by status')} value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="sm:max-w-48"><option value="">{t('All statuses')}</option>{['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'SUBMITTED_FOR_REVIEW', 'COMPLETED'].map(status => <option key={status} value={status}>{t(status)}</option>)}<option value="OVERDUE">{t('OVERDUE')}</option></AdminSelect><AdminSelect aria-label={t('Sort tasks')} value={sortField} onChange={e => setSortField(e.target.value)} className="sm:max-w-48"><option value="name">{t('Sort by title')}</option><option value="deadline">{t('Sort by deadline')}</option></AdminSelect></div></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800"><tr>{[t('Task'), t('Department'), t('Assignee'), t('Status'), t('Deadline'), t('Actions')].map(x => <th className="px-3 py-3" key={x}>{x}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{(currentRows as Task[]).map(task => <tr key={task.id}><td className="px-3 py-3"><b>{task.planCode}</b><p className="max-w-56 truncate text-xs text-slate-500">{task.title}</p></td><td className="px-3 py-3">{task.departmentName}</td><td className="px-3 py-3">{task.assignedToName}</td><td className="px-3 py-3">{t(task.status)}</td><td className="px-3 py-3">{task.deadline}</td><td className="px-3 py-3"><div className="flex gap-1.5"><AdminButton onClick={() => setTaskEditor(task)}>{t('Edit')}</AdminButton>{(task as any).archivedAt ? <AdminButton onClick={() => void taskLifecycle(task, 'restore') }><RotateCcw size={14} />{t('Restore')}</AdminButton> : <AdminButton onClick={() => void taskLifecycle(task, 'archive')}><Archive size={14} />{t('Archive')}</AdminButton>}<AdminButton tone="danger" aria-label={`${t('Delete eligible draft')} ${task.planCode}`} title={t('Only eligible drafts can be deleted.')} disabled={!(task as any).draft} onClick={() => void taskLifecycle(task, 'delete')}><Trash2 size={14} /></AdminButton></div></td></tr>)}</tbody></table></div>
          {!filteredTasks.length && <EmptyState title={t('No tasks found')} detail={t('Tasks available to this account appear here.')} />}
          <Pagination page={page} pages={pages} onPage={setPage} label={t('tasks')} />
        </section>}

        {area === 'settings' && <SettingsForm initial={overview.settings} onSave={async settings => { const response = await mutate('/admin/settings', 'PUT', settings); if (response !== undefined) setSuccess(t('Settings saved.')); }} busy={busy} t={t} />}

        {area === 'delivery' && <div className="space-y-5">
          <section className={`${cardClass} p-4 sm:p-5`}><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold">{t('Scheduled jobs')}</h2><p className="mt-1 text-xs text-slate-500">{t('Jobs execute on the server; a missing Telegram configuration is reported as an error.')}</p></div><div className="flex flex-wrap gap-2"><AdminButton disabled={busy} onClick={() => void launchJob('reminders')}><Play size={14} />{t('Run reminders')}</AdminButton><AdminButton disabled={busy} onClick={() => void launchJob('delivery')}><Play size={14} />{t('Run delivery')}</AdminButton></div></div></section>
          <section className={`${cardClass} overflow-hidden`}><div className="p-4"><h2 className="font-bold">{t('Delivery records')}</h2></div><DataTable columns={[t('Title'), t('Recipient'), t('Status'), t('Attempts'), t('Last error'), t('Created'), t('Action')]} rows={overview.deliveries.map((d: any) => [d.title, d.recipientName, t(d.status), d.attempts, d.lastError || '—', new Date(d.createdAt).toLocaleString(), <AdminButton disabled={busy} onClick={() => void mutate(`/admin/deliveries/${encodeURIComponent(d.id)}/retry`, 'POST', {})}><RotateCcw size={14} />{t('Retry')}</AdminButton>])} empty={t('No delivery records.')} /></section>
        </div>}

        {area === 'migration' && <MigrationPanel fileName={migrationFileName} preview={migrationPreview} mapping={roleMapping} backupConfirmed={backupConfirmed} commitConfirmed={commitConfirmed} busy={busy} t={t} onFile={async (file: File) => { setActionError(''); setMigrationPreview(null); setMigrationSnapshot(null); setMigrationFileName(file.name); try { const raw = JSON.parse(await file.text()); if (!raw || typeof raw !== 'object') throw new Error(t('The selected file must contain a JSON snapshot.')); setMigrationSnapshot(raw); } catch (e) { setActionError((e as Error).message); } }} onPreview={async () => { if (!migrationSnapshot) return; const result = await mutate<any>('/admin/migration/preview', 'POST', { snapshot: migrationSnapshot }); if (result) { setMigrationPreview(result); setRoleMapping({}); setBackupConfirmed(false); setCommitConfirmed(false); } }} onMapping={(id: string, role: Role) => setRoleMapping(previous => ({ ...previous, [id]: role }))} onBackup={setBackupConfirmed} onCommitConfirm={setCommitConfirmed} onCommit={async () => {
          if (!migrationPreview || !backupConfirmed || !commitConfirmed) return;
          const everyMapped = migrationPreview.accounts.every((account: any) => roleMapping[account.id]);
          if (!everyMapped) { setActionError(t('Choose a role for every account before importing.')); return; }
          if (!window.confirm(t('Import this snapshot now? This action cannot be undone.'))) return;
          const result = await mutate<any>('/admin/migration/commit', 'POST', { snapshot: migrationSnapshot, digest: migrationPreview.digest, roleMapping, backupConfirmed: true });
          if (result?.imported) { setSuccess(t('Migration completed.')); setMigrationPreview(null); setMigrationSnapshot(null); setMigrationFileName(''); }
        }} />}
      </div>
    </div>

    {form && <AdminModal title={t(`${form.id ? 'Edit' : 'Add'} ${form.type}`)} onClose={() => setForm(null)}><form onSubmit={submitForm} className="space-y-4">
      {form.type === 'user' && <><FormText label={t('Username')} name="username" required value={form.values.username || ''} set={updateForm} /><FormText label={t('Email')} name="email" type="email" required value={form.values.email || ''} set={updateForm} /><FormText label={t('Full name')} name="fullName" required value={form.values.fullName || ''} set={updateForm} /><FormText label={t('Phone')} name="phone" value={form.values.phone || ''} set={updateForm} /><AdminField label={t('Role')}><AdminSelect required value={form.values.role || 'WORKER'} onChange={e => updateForm('role', e.target.value)}>{ROLES.map(role => <option key={role} value={role}>{t(role)}</option>)}</AdminSelect></AdminField><AdminField label={t('Department')}><AdminSelect value={form.values.departmentId || ''} onChange={e => updateForm('departmentId', e.target.value)}><option value="">{t('No department')}</option>{overview.departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}</AdminSelect></AdminField>{form.id && <CheckField label={t('Active account')} checked={Boolean(form.values.active)} onChange={v => updateForm('active', v)} />}</>}
      {form.type === 'department' && <><FormText label={t('Code')} name="code" required value={form.values.code || ''} set={updateForm} /><FormText label={t('Name')} name="name" required value={form.values.name || ''} set={updateForm} /><AdminField label={t('Coordinator')}><AdminSelect value={form.values.coordinatorId || ''} onChange={e => updateForm('coordinatorId', e.target.value)}><option value="">{t('Unassigned')}</option>{overview.users.map((u: any) => <option key={u.id} value={u.id}>{u.fullName}</option>)}</AdminSelect></AdminField>{form.id && <CheckField label={t('Active')} checked={Boolean(form.values.active)} onChange={v => updateForm('active', v)} />}</>}
      {form.type === 'plan' && <><FormText label={t('Title')} name="title" required value={form.values.title || ''} set={updateForm} /><FormText label={t('Year')} name="year" type="number" required value={form.values.year || new Date().getFullYear()} set={updateForm} />{form.id && <CheckField label={t('Active')} checked={Boolean(form.values.active)} onChange={v => updateForm('active', v)} />}</>}
      {form.type === 'section' && <>{!form.id && <AdminField label={t('Work plan')}><AdminSelect required value={form.values.workPlanId || ''} onChange={e => updateForm('workPlanId', e.target.value)}><option value="">{t('Select work plan')}</option>{overview.workPlans.map((p: any) => <option key={p.id} value={p.id}>{p.title}</option>)}</AdminSelect></AdminField>}<FormText label={t('Section number')} name="number" required value={form.values.number || ''} set={updateForm} /><FormText label={t('Title')} name="title" required value={form.values.title || ''} set={updateForm} /></>}
      {form.type === 'category' && <><FormText label={t('Name')} name="name" required value={form.values.name || ''} set={updateForm} />{form.id && <CheckField label={t('Active')} checked={Boolean(form.values.active)} onChange={v => updateForm('active', v)} />}</>}
      <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800"><AdminButton type="button" onClick={() => setForm(null)}>{t('Cancel')}</AdminButton><AdminButton tone="primary" type="submit" disabled={busy}>{busy && <LoaderCircle className="animate-spin" size={15} />}{t('Save')}</AdminButton></div>
    </form></AdminModal>}
    {taskEditor && <TaskEditor task={taskEditor} departments={overview.departments} users={overview.users} plans={overview.workPlans} categories={overview.categories} busy={busy} t={t} onClose={() => setTaskEditor(null)} onSave={async (payload) => { const result = await mutate(`/tasks/${encodeURIComponent(taskEditor.id)}`, 'PATCH', payload); if (result !== undefined) { setTaskEditor(null); setSuccess(t('Task updated.')); } }} />}
  </AdminPanelShell>;

  function updateForm(key: string, value: any) { setForm(current => current ? { ...current, values: { ...current.values, [key]: value } } : current); }
  async function taskLifecycle(task: any, action: 'archive' | 'restore' | 'delete') {
    const reason = window.prompt(t('Enter a reason for this task change:'));
    if (!reason?.trim()) return;
    const confirmText = action === 'delete' ? t('Permanently delete this eligible draft? The server may refuse if it has history.') : t(`Confirm task ${action}?`);
    if (!window.confirm(confirmText)) return;
    const result = await mutate(`/tasks/${encodeURIComponent(task.id)}/${action}`, action === 'delete' ? 'DELETE' : 'POST', { version: task.version, reason: reason.trim() });
    if (result !== undefined) setSuccess(t('Task updated.'));
  }
};

function SearchControl({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="relative block max-w-md"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="min-h-10 w-full rounded-lg border border-slate-300 bg-slate-50 pl-9 pr-3 text-sm dark:border-slate-700 dark:bg-slate-800" /></label>;
}
function EmptyState({ title, detail }: { title: string; detail: string }) { return <div className="m-4 flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-9 text-center dark:border-slate-700 dark:bg-slate-800/50"><CircleAlert size={19} className="text-slate-400" /><p className="mt-2 font-semibold">{title}</p><p className="mt-1 text-sm text-slate-500">{detail}</p></div>; }
function Pagination({ page, pages, onPage, label }: { page: number; pages: number; onPage: (page: number) => void; label: string }) { return <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-slate-800"><span>{page} / {pages} · {label}</span><div className="flex gap-1"><button disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label={localizeText('Previous page')} className="rounded-md border p-2 disabled:opacity-40 dark:border-slate-700"><ChevronLeft size={15} /></button><button disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label={localizeText('Next page')} className="rounded-md border p-2 disabled:opacity-40 dark:border-slate-700"><ChevronRight size={15} /></button></div></div>; }
function RoleChip({ role }: { role: string }) { return <span className="inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-800 dark:bg-sky-950/50 dark:text-sky-200">{role}</span>; }
function SectionHeader({ title, actionLabel, onAdd }: { title: string; actionLabel: string; onAdd: () => void }) { return <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4 dark:border-slate-800"><h2 className="font-bold">{title}</h2><AdminButton tone="primary" onClick={onAdd}><Plus size={15} />{actionLabel}</AdminButton></div>; }
function DataTable({ columns, rows, empty }: { columns: string[]; rows: React.ReactNode[][]; empty: string }) { return <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-800"><tr>{columns.map(c => <th key={c} className="px-4 py-3">{c}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j} className="px-4 py-3">{cell}</td>)}</tr>)}</tbody></table>{!rows.length && <EmptyState title={empty} detail="" />}</div>; }
function FormText({ label, name, value, set, required, type = 'text' }: { label: string; name: string; value: any; set: (key: string, value: any) => void; required?: boolean; type?: string }) { return <AdminField label={label}><AdminInput name={name} type={type} required={required} value={value} onChange={e => set(name, e.target.value)} /></AdminField>; }
function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-3 text-sm font-medium dark:bg-slate-800"><input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="h-4 w-4 accent-sky-700" />{label}</label>; }
function RolePermissions({ role, enabled, ceiling, onSave, busy, t }: { role: Role; enabled: string[]; ceiling: string[]; onSave: (permissions: string[]) => void; busy: boolean; t: (value: string) => string }) {
  const [selected, setSelected] = useState(enabled);
  useEffect(() => setSelected(enabled), [enabled.join('|')]);
  const locked = role === 'ADMIN';
  return <article className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"><header className="flex items-center justify-between gap-3"><div><RoleChip role={role} /><p className="mt-1 text-xs text-slate-500">{t('Permission ceiling')}: {ceiling.length}</p></div><AdminButton tone="primary" disabled={busy || locked} onClick={() => onSave(selected)}>{t('Save permissions')}</AdminButton></header><div className="mt-4 grid gap-x-4 gap-y-2 sm:grid-cols-2">{PERMISSIONS.map(permission => { const allowed = ceiling.includes(permission); return <label key={permission} className={`flex items-center gap-2 rounded-md px-2 py-2 text-sm ${allowed ? '' : 'opacity-45'}`}><input type="checkbox" checked={role === 'ADMIN' || selected.includes(permission)} disabled={!allowed || locked} onChange={e => setSelected(value => e.target.checked ? [...value, permission] : value.filter(p => p !== permission))} className="accent-sky-700" /><span>{t(PERMISSION_NAMES[permission] || permission)}</span></label>; })}</div></article>;
}
function SettingsForm({ initial, onSave, busy, t }: { initial: Overview['settings']; onSave: (settings: Overview['settings']) => void; busy: boolean; t: (value: string) => string }) {
  const [value, setValue] = useState(initial);
  useEffect(() => setValue(initial), [initial.notificationsEnabled, initial.reminderHour, initial.reminderTemplate]);
  return <form className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900" onSubmit={e => { e.preventDefault(); onSave({ ...value, reminderHour: Number(value.reminderHour) }); }}>
    <div><h2 className="font-bold">{t('Notification settings')}</h2><p className="mt-1 text-sm text-slate-500">{t('Changes are applied after the server confirms the update.')}</p></div>
    <CheckField label={t('Enable reminders')} checked={value.notificationsEnabled} onChange={checked => setValue(v => ({ ...v, notificationsEnabled: checked }))} />
    <AdminField label={t('Reminder hour')}><AdminInput type="number" min={0} max={23} step={1} value={value.reminderHour} onChange={e => setValue(v => ({ ...v, reminderHour: Number(e.target.value) }))} /></AdminField>
    <AdminField label={t('Reminder template')}><AdminTextarea rows={5} value={value.reminderTemplate} onChange={e => setValue(v => ({ ...v, reminderTemplate: e.target.value }))} /></AdminField>
    <AdminButton type="submit" tone="primary" disabled={busy}>{t('Save settings')}</AdminButton>
  </form>;
}
function TaskEditor({ task, departments, users, plans, categories, busy, t, onClose, onSave }: { task: any; departments: any[]; users: any[]; plans: any[]; categories: any[]; busy: boolean; t: (value: string) => string; onClose: () => void; onSave: (payload: any) => void }) {
  const [value, setValue] = useState<any>({ ...task });
  const [reason, setReason] = useState('');
  const completed = task.status === 'COMPLETED';
  const change = (key: string, next: any) => setValue((old: any) => ({ ...old, [key]: next }));
  return <AdminModal title={t('Correct task')} onClose={onClose}><form onSubmit={e => { e.preventDefault(); if (completed && !reason.trim()) return; onSave({ version: task.version, title: value.title, description: value.description, expectedOutcome: value.expectedOutcome, acceptanceCriteria: value.acceptanceCriteria, departmentId: value.departmentId, assignedToId: value.assignedToId, approverId: value.approverId || null, deadline: value.deadline, priority: value.priority, requiresEvidence: Boolean(value.requiresEvidence), requiresApproval: Boolean(value.requiresApproval), workPlanId: value.workPlanId || null, sectionId: value.sectionId || null, categoryId: value.categoryId || null, draft: Boolean(value.draft), ...(completed ? { reason: reason.trim() } : {}) }); }} className="space-y-4">
    <AdminField label={t('Title')}><AdminInput required value={value.title || ''} onChange={e => change('title', e.target.value)} /></AdminField>
    <AdminField label={t('Description')}><AdminTextarea rows={3} value={value.description || ''} onChange={e => change('description', e.target.value)} /></AdminField>
    <div className="grid gap-3 sm:grid-cols-2"><AdminField label={t('Expected outcome')}><AdminInput value={value.expectedOutcome || ''} onChange={e => change('expectedOutcome', e.target.value)} /></AdminField><AdminField label={t('Acceptance criteria')}><AdminInput value={value.acceptanceCriteria || ''} onChange={e => change('acceptanceCriteria', e.target.value)} /></AdminField></div>
    <div className="grid gap-3 sm:grid-cols-2"><AdminField label={t('Department')}><AdminSelect value={value.departmentId || ''} onChange={e => change('departmentId', e.target.value)}>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</AdminSelect></AdminField><AdminField label={t('Assignee')}><AdminSelect value={value.assignedToId || ''} onChange={e => change('assignedToId', e.target.value)}>{users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}</AdminSelect></AdminField></div>
    <div className="grid gap-3 sm:grid-cols-3"><AdminField label={t('Priority')}><AdminSelect value={value.priority || 'MEDIUM'} onChange={e => change('priority', e.target.value)}>{['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(x => <option key={x}>{x}</option>)}</AdminSelect></AdminField><AdminField label={t('Deadline')}><AdminInput type="date" value={(value.deadline || '').slice(0, 10)} onChange={e => change('deadline', e.target.value)} /></AdminField><AdminField label={t('Work plan')}><AdminSelect value={value.workPlanId || ''} onChange={e => change('workPlanId', e.target.value)}><option value="">{t('None')}</option>{plans.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</AdminSelect></AdminField></div>
    <div className="grid gap-3 sm:grid-cols-2"><AdminField label={t('Category')}><AdminSelect value={value.categoryId || ''} onChange={e => change('categoryId', e.target.value)}><option value="">{t('None')}</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</AdminSelect></AdminField><AdminField label={t('Approver')}><AdminSelect value={value.approverId || ''} onChange={e => change('approverId', e.target.value)}><option value="">{t('No approver')}</option>{users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}</AdminSelect></AdminField></div>
    <div className="grid gap-2 sm:grid-cols-3"><CheckField label={t('Requires evidence')} checked={Boolean(value.requiresEvidence)} onChange={v => change('requiresEvidence', v)} /><CheckField label={t('Requires approval')} checked={Boolean(value.requiresApproval)} onChange={v => change('requiresApproval', v)} /><CheckField label={t('Draft')} checked={Boolean(value.draft)} onChange={v => change('draft', v)} /></div>
    {completed && <AdminField label={t('Reason required for completed-task correction')}><AdminTextarea required value={reason} onChange={e => setReason(e.target.value)} /></AdminField>}
    <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800"><AdminButton type="button" onClick={onClose}>{t('Cancel')}</AdminButton><AdminButton tone="primary" disabled={busy}>{t('Save task')}</AdminButton></div>
  </form></AdminModal>;
}
function MigrationPanel({ fileName, preview, mapping, backupConfirmed, commitConfirmed, busy, t, onFile, onPreview, onMapping, onBackup, onCommitConfirm, onCommit }: any) {
  return <section className="space-y-4">
    <article className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-start gap-3"><div className="rounded-lg bg-sky-50 p-2 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300"><Upload size={18} /></div><div><h2 className="font-bold">{t('Legacy snapshot migration')}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{t('Upload a JSON snapshot for server-side preview. The original remains immutable; no official tasks are seeded automatically.')}</p></div></div>
      <label className="mt-4 flex cursor-pointer flex-col items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-7 text-center dark:border-slate-700 dark:bg-slate-800"><Upload size={20} className="text-slate-500" /><span className="mt-2 text-sm font-semibold">{t('Choose a JSON snapshot')}</span><span className="mt-1 text-xs text-slate-500">{fileName || t('The legacy local storage is not modified.')}</span><input className="sr-only" type="file" accept="application/json,.json" onChange={e => { if (e.target.files?.[0]) onFile(e.target.files[0]); }} /></label>
      <div className="mt-4 flex justify-end"><AdminButton tone="primary" disabled={!fileName || busy} onClick={onPreview}><Search size={15} />{t('Preview migration')}</AdminButton></div>
    </article>
    {preview && <article className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div><h3 className="font-bold">{t('Snapshot preview')}</h3><p className="mt-1 break-all font-mono text-xs text-slate-500">{t('Digest')}: {preview.digest}</p></div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">{Object.entries(preview.counts || {}).map(([key, count]) => <div key={key} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800"><p className="text-xs text-slate-500">{t(key)}</p><p className="mt-1 font-mono text-xl font-bold">{count as React.ReactNode}</p></div>)}</div>
      {!!preview.warnings?.length && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"><b>{t('Warnings')}</b><ul className="mt-1 list-inside list-disc">{preview.warnings.map((warning: string, i: number) => <li key={i}>{warning}</li>)}</ul></div>}
      <div><h4 className="mb-2 text-sm font-bold">{t('Map every legacy account to a role')}</h4><div className="space-y-2">{preview.accounts.map((account: any) => <div key={account.id} className="grid gap-2 rounded-lg bg-slate-50 p-3 sm:grid-cols-[1fr_180px] sm:items-center dark:bg-slate-800"><div><p className="text-sm font-semibold">{account.fullName}</p><p className="text-xs text-slate-500">{account.legacyRole} · {account.id}</p></div><AdminSelect aria-label={`${t('Role for')} ${account.fullName}`} value={mapping[account.id] || ''} onChange={e => onMapping(account.id, e.target.value)}><option value="">{t('Choose role')}</option>{ROLES.map((role: string) => <option key={role} value={role}>{t(role)}</option>)}</AdminSelect></div>)}</div></div>
      <CheckField label={t('I have backed up the target system and reviewed the immutable source snapshot.')} checked={backupConfirmed} onChange={onBackup} />
      <CheckField label={t('I explicitly confirm committing this migration after reviewing the preview and role mapping.')} checked={commitConfirmed} onChange={onCommitConfirm} />
      <div className="flex justify-end"><AdminButton tone="primary" disabled={busy || !backupConfirmed || !commitConfirmed || preview.accounts.some((a: any) => !mapping[a.id])} onClick={onCommit}><Check size={15} />{t('Commit migration')}</AdminButton></div>
    </article>}
  </section>;
}
