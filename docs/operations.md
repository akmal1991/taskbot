# UniTaskBot operations and security model

## Runtime and database
- Bun runs Express and the Vite development middleware on port 5000. Production serves the built `dist/` app.
- PostgreSQL is authoritative for accounts, sessions, tasks, evidence, reviews, comments, settings, notifications, tickets, and audit events.
- Install with `bun install`; apply **development-only** migrations with `bun run db:migrate:dev`; start with `bun run dev -- --port 5000`.
- The post-merge script installs, migrates development, then builds. Startup and production builds never execute DDL.
- For production, use Replit's Publish schema review. Do not point the development migration command at production.
- Do not automatically import archival fixtures or browser state. A fresh database intentionally has no demo data or default credentials.

## Initial administrator
Set `BOOTSTRAP_ADMIN_USERNAME`, `BOOTSTRAP_ADMIN_EMAIL`, and a strong `BOOTSTRAP_ADMIN_PASSWORD` in workspace secrets, not source or chat.
Run `bun run provision:admin` in the intended development environment and remove the bootstrap password afterward.
The command refuses to provision another administrator while an active one exists.
To reset the active administrator associated with `BOOTSTRAP_ADMIN_EMAIL`, set a new `ADMIN_RESET_PASSWORD` in workspace secrets and run `bun run reset:admin-password`. It sets the login name to `admin`, invalidates that account's sessions and pending setup/reset links, and records an audit event. Remove the temporary secret after the command succeeds; never provide passwords in chat or source files.
After publishing, use the environment's normal protected account-provisioning process; do not assume development records are copied to a production database.
No production migration/provisioning has been performed in this implementation session.

## Accounts and permissions
- Exactly **ADMIN / DIRECTOR / WORKER**. Department coordinators are account assignments, not extra roles.
- ADMIN manages users, department membership/coordinators, role permission subsets, work plans/sections/categories, task corrections/archive, imports, notification settings, and delivery retries.
- DIRECTOR operates university tasks, assignment, authorized non-self review, reports, operational audit, and service requests. No account/security administration.
- WORKER sees their assigned active tasks and their own account/notifications/requests; start/progress/submit/comment actions are ownership checked.
- Permissions can be reduced within each fixed role's ceiling. They cannot elevate a director/worker into administration; essential administrator permissions remain.
- All requests reload current account/permission state. Deactivation, password/role changes invalidate sessions. The last active administrator cannot be disabled or demoted.
- Passwords use scrypt N=131072, r=8, p=1 with individual random salts, bounded concurrency, and timing-safe comparison. Native Argon2id was unavailable in this runtime.
- Sessions use hashed opaque identifiers and HttpOnly cookies, Secure in production, SameSite=Strict, an 8-hour absolute lifetime and 30-minute idle timeout.
- Origin checks and per-session CSRF tokens protect mutations. Account/IP login throttles are persisted.
- Activation/reset tokens are hashed, single-use and expire after one hour. Recovery requests are generic and administrator-assisted; no email is pretended to be sent.

## Task lifecycle and evidence
Tasks may include up to 50 named assignees across departments. Select the primary assignee/department and add additional assignee/department pairs at creation. Every assignee must be active and belong to their selected department; reviewers must be outside the task team. Team membership is fixed after creation to preserve evidence ownership.
Each member has independent progress, submission and review state. Task participants can read each other's submitted evidence and download its attachments, but cannot access other members' unsubmitted uploads. Users outside the team retain no additional access. Overall completion requires every member to complete their contribution; approval remains per member where required. Notifications and reminders target each outstanding assignee. Existing single-assignee tasks retain their prior behavior. Bounded team state is stored in the existing task JSONB record and updated under the task row lock; no production schema migration is required for this feature.

`PENDING → ASSIGNED → IN_PROGRESS → SUBMITTED_FOR_REVIEW → COMPLETED`; normal creation assigns immediately.
A rejected submission returns to IN_PROGRESS while preserving the submitted evidence and review decision.
Overdue is a computed property using Asia/Tashkent dates, not another editable lifecycle state.
Starting/submitting requires completed prerequisites. Dependency cycles are rejected.
Updates carry versions; conflicting cross-device edits return 409 instead of overwriting newer data.
Mandatory evidence requires a meaningful note; selected URL/file types require a real HTTP(S) URL or owned upload.
PDF/PNG/JPEG uploads are signature/MIME checked and capped at 10 MB. Downloads require task authorization.
There is no antivirus/content-disarm service; do not describe signature validation as malware scanning.
Approval must concern the newest submission and an authorized reviewer other than its submitter/assignee.
Completion requires approval unless the task's explicit approval policy disables it.
Completed corrections require an administrator reason. Published tasks cannot become deletable drafts.
Only unused drafts with no linked operational history can be deleted; historical tasks are archived.
Audit events, evidence submissions, reviews, and original migration snapshots are database-immutable.

## Record relationships
```
department --< membership >-- user --< session / account_token
work_plan --< section --< task >-- category
department --< task >-- assignee / creator / reviewer (user)
task --< dependency >-- task
task --< evidence --< review >-- reviewer
task --< attachment / comment --< reaction >-- user
task --< notification >-- recipient
user --< service_ticket >-- department
user --< audit_event / import_job -- original legacy_snapshot
```
Application foreign keys enforce actual relationships; archival JSON retains source-only metadata.

## Imports and preservation
- Excel imports are validated before commit, limited to 2,000 rows / 10 MB, require exact owners/departments and valid dates/priorities/progress, reject duplicates, and commit atomically.
- Normal Excel creates **new assigned tasks at zero progress only**. It does not silently erase historical statuses/progress. Use reviewed JSON migration for historical data.
- Exported CSV/Excel text neutralizes leading spreadsheet formula characters.
- Administration can download the browser's exact `unitask_app_data_v1` value. That key is read-only and never loaded as identity or authoritative state.
- Historical JSON import requires an unchanged preview digest, backup confirmation, and an explicit role mapping for every account. Existing records/collisions are never overwritten.
- Imported accounts stay inactive, without passwords, until secure activation. Legacy Telegram identifiers remain unverified archival metadata.
- Tasks, metadata, original progress/status, evidence decisions, threaded comments/reactions, dependencies, resolvable tickets and recipient notifications are retained. Original snapshots/audit actors remain immutable.
- Valid, identifiable non-self historical reviews are materialized. Ambiguous reviewers, unknown notification recipients, unmatched ticket applicants and simulated queue history remain only in the original snapshot rather than being invented.
- Imported notifications are historical failed/nonqueued records with infinite retry delay; no automatic re-send occurs. An administrator must intentionally retry a known failed delivery.
- Browser-only attachment contents cannot be recovered from filenames. UI explicitly marks missing bytes; original filenames/metadata remain available.

## Telegram and notification jobs
Normal web actions use the authenticated server session. Telegram launch data is captured by the official SDK when present, then removed from navigation.
Linking requires the authenticated account, a one-use linking token, and fresh verified Telegram initData. Active Telegram IDs are unique.
Task actions additionally enforce ownership/reviewer authorization; a valid Telegram signature alone grants no access.
Set `TELEGRAM_BOT_TOKEN` only in server secrets to enable linking/delivery, then enable notifications in Administration.
The minute scheduler and manual controls use database advisory locks; reminders deduplicate by Asia/Tashkent day.
Delivery is real Telegram HTTP delivery with recorded failures and bounded retries, not a simulated Redis/BullMQ service.
Telegram's API has no delivery idempotency key; a process crash after a successful send and before commit can cause retry duplicates.
There is no standalone inbound bot-command/webhook conversational workflow in this implementation.

## Verification and publishing
Run `bun run lint`, `bun test`, `bun run build`, and `bun run test:production`.
The production smoke check starts a short-lived local production-mode server on port 5002, verifies health/assets/CSP/auth,
and stops it; it does not publish or migrate a production database.
Integration tests refuse a production environment, create an isolated random schema, and drop only that schema.
Do not run application tests against production.
Production CSP permits local code, Google fonts, and the official Telegram SDK; do not weaken this to arbitrary script execution.
Review production database configuration, account provisioning, Telegram settings and backups before publishing.
Signed-in UI was covered through API tests and focused DOM tests, not an authenticated screenshot session.
