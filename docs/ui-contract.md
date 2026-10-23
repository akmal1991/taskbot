# Secure UI implementation contract

Implement LoginPage.tsx and AdminPanel.tsx only, plus top-level Admin*.tsx helpers and catalog entries. Main agent handles shell/context/backend.

UniTask is an existing university work-plan system for administrators, directors, and employees. Preserve its visual identity, not a new design. Creative presentation is yours within that constraint. No emojis. No mock data, fake buttons, default credentials, or role switcher. Exactly ADMIN/DIRECTOR/WORKER. Add every new static UI string to interfaceTranslations.ts with en, ru, uz-Latn; Cyrillic derives from Latin. Do not bypass localization.

## Hooks
- useAuth(): user, permissions, loading, error, login(identifier,password):Promise<void>, logout(), reloadAuth().
- api<T>(path,RequestInit): prefixes /api, manages cookies/CSRF, throws Error on server failure.
- useApp(): users, departments, tasks, currentUser, refreshState():Promise<void>, language, setLanguage, theme, toggleTheme.
- Read existing types/index.ts for User, Department, Task. User adds username,active; Task adds version,archivedAt,draft,workPlanId,categoryId,requiresEvidence,requiresApproval.

## LoginPage
Mounted inside AuthProvider but OUTSIDE AppProvider. Own language selector using unitask_language preference, normalizeLanguage/syncDocumentLanguage. No demo sign-in. Handle ?setup=TOKEN, POST /auth/setup-password {token,password}, clear query and return to login. Forgot password POST /auth/forgot-password {identifier} returns generic message; no configured mail provider is assumed, never claim mail was sent. Show unavailable-server errors. Explain secure initial admin provisioning command without displaying secrets.

## AdminPanel API
All requests JSON. Mutations only update UI after successful API response; reload state. Accessible forms, search/filter/sort/pagination, confirmations for destructive changes, explicit loading/errors.

GET /admin/overview:
{users,departments,rolePermissions:{ADMIN:[],DIRECTOR:[],WORKER:[]},permissionCeilings:same,workPlans:[{id,title,year,active,sections:[{id,number,title}]}],categories:[{id,name,active}],imports:[{id,source,rowCount,createdAt,operatorName,report}],settings:{notificationsEnabled,reminderHour,reminderTemplate},deliveries:[{id,title,status,attempts,lastError,createdAt,recipientName}],stats:{tasks,users,departments}}.

- POST /admin/users {username,email,fullName,role,departmentId:null|string,phone} -> {user,token,expiresAt}.
- PATCH /admin/users/:id editable fields above plus active. No password field.
- POST /admin/users/:id/reset {purpose:"RESET"|"ACTIVATE"} -> {token,expiresAt}. Display setup link current origin + "?setup="+token once; securely share. Do not persist tokens.
- POST /admin/departments {code,name,coordinatorId:null|string}. PATCH /admin/departments/:id same plus active.
- PUT /admin/role-permissions/:role {permissions:[]}. Ceilings enforced server-side; ADMIN essential/fixed.
- POST /admin/work-plans {title,year}. PATCH /admin/work-plans/:id {title,year,active}.
- POST /admin/work-plans/:id/sections {number,title}. PATCH /admin/sections/:id {number,title}.
- POST /admin/categories {name}. PATCH /admin/categories/:id {name,active}.
- PUT /admin/settings {notificationsEnabled:boolean,reminderHour:number,reminderTemplate:string}.
- POST /admin/deliveries/:id/retry {}.
- POST /admin/jobs/run {job:"reminders"|"delivery"} -> {processed}. Unconfigured Telegram fails 503; never simulate sending.

Task maintenance uses useApp tasks:
- PATCH /tasks/:id {version, title?,description?,expectedOutcome?,acceptanceCriteria?,departmentId?,assignedToId?,approverId:null|string,deadline?,priority?,requiresEvidence?,requiresApproval?,workPlanId:null|string,sectionId:null|string,categoryId:null|string,draft?,reason?}. Completed corrections require reason.
- POST /tasks/:id/archive {version,reason}.
- POST /tasks/:id/restore {version,reason}.
- DELETE /tasks/:id {version,reason}. Only eligible drafts without history; show server refusal.

## Migration surface
Never modify localStorage unitask_app_data_v1. Offer exact raw snapshot download, or accept uploaded JSON.
- POST /admin/migration/preview {snapshot} -> {digest,counts:{users,departments,tasks,evidence,auditLogs},accounts:[{id,fullName,legacyRole,suggestedRole:null}],warnings:[]}.
- Every account MUST have an explicit ADMIN/DIRECTOR/WORKER choice, no default mass conversion.
- POST /admin/migration/commit {snapshot,digest,roleMapping:{legacyId:role},backupConfirmed:true} -> {imported:true}.
Require backup confirmation and explicit commit confirmation. Server preserves immutable original and refuses collisions; never auto-seed official tasks.

User management is ADMIN only. Directors have operational views in existing shell. Keep layout usable on mobile.
