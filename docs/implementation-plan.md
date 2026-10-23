# UniTask security and persistence implementation plan

## Baseline audit
- React/TypeScript and Express/Vite already exist and will be retained.
- There are no persistent database tables, password accounts, or server sessions.
- AppContext selects a demo user and allows switching roles; browser state is authoritative.
- Mutations, approvals, imports, audit events, notifications, and queue execution currently run in the browser.
- Telegram verifies initData but does not bind it to an authenticated account or check record ownership.
- Existing official plan source files and browser snapshots must not be reset or seeded over live records.

## Controlled stages
1. Inventory architecture and security risks. Retain source records and existing design.
2. Introduce fixed ADMIN/DIRECTOR/WORKER roles with immutable security ceilings and configurable permissions within those ceilings.
3. Add related PostgreSQL tables, development migrations, memory-hard password accounts, server sessions, CSRF protection, throttling, activation/reset tokens, and one-time administrator provisioning.
4. Move state loading and mutations into authenticated, validated, transaction-backed API routes with worker record isolation, optimistic concurrency, audit events, and task transition checks.
5. Integrate login, authenticated shell, existing task/review/import screens, and functional administration for users, departments, permissions, work plans, task maintenance, and settings.
6. Integrate evidence uploads/downloads, reviews/comments, notifications, Telegram linking, reports, imports, and reviewed legacy migration.
7. Run unit/integration tests, TypeScript, production build, and public-route visual checks; document verified behavior and gaps honestly.

## Permission boundaries
- ADMIN administers records and security. Essential integrity checks, immutable audit history, and the last-active-admin rule cannot be disabled.
- DIRECTOR has operational university-wide access, task assignment, authorized review, exports, and operational audit access, but never account/security administration.
- WORKER is scoped to assigned tasks, their own submissions/comments/notifications/tickets, and permitted progress actions. No self-approval.
- Department coordinators are assignments to existing accounts, not extra roles.

## Data preservation and migration
- No automatic import of demo data or browser identity/roles.
- Preserve the existing browser key untouched and offer a download of its exact raw snapshot.
- Preview validates identifiers and references. Commit requires backup confirmation, a matching snapshot digest, and an explicit fixed-role decision for every legacy account.
- Store the original snapshot immutably, import transactionally, refuse collisions instead of overwriting existing official records, and create imported accounts without passwords pending secure activation.
- Legacy rejected/overdue task states are mapped to the consistent lifecycle; original values remain in the immutable snapshot. Overdue is calculated, not a second persisted lifecycle.

## Infrastructure and deployment
- Use the project's managed PostgreSQL. Apply DDL only in development; production schema is applied through Publish.
- Never run schema DDL during application startup or a production build.
- Provision the first administrator with a one-time environment-secret-driven command. No default login.
- No Telegram token or mail service is assumed. Unconfigured external delivery must fail explicitly rather than pretend to send.
- Password hashing uses the OWASP-approved scrypt alternative (N=131072, r=8, p=1; 128 MiB), not Argon2id. The native Argon2 package could not build in this runtime. Password work has bounded concurrency.
