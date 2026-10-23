# Run this app on Replit

## Start the preview

This project is a React app served by Vite and uses Bun. Use the **Project** run button, which starts the **Start application** workflow:

```sh
bun run dev -- --port 5000
```

The workflow serves the app on port `5000`, which is mapped to the Replit web preview. To install the dependencies declared in `package.json`, run:

```sh
bun install
```

To check the TypeScript project and build the app, run:

```sh
bun run lint
bun run build
```

## Environment settings

This is an authenticated Bun/Express + React application backed by managed PostgreSQL.
`DATABASE_URL` must be provisioned. Apply migrations in development with `bun run db:migrate:dev`;
never run schema DDL at startup or during production builds. Publish applies the development schema diff.

There are exactly three active roles: `ADMIN`, `DIRECTOR`, `WORKER`. Department coordinators are assignments,
not roles. Do not reintroduce demo logins, browser-authoritative records, or client-selected identity.
The official source records are archival material, not automatically seeded accounts/tasks.

No default administrator is created. In workspace secrets, set `BOOTSTRAP_ADMIN_USERNAME`,
`BOOTSTRAP_ADMIN_EMAIL`, and `BOOTSTRAP_ADMIN_PASSWORD` (12–128 characters), run `bun run provision:admin`,
then remove the bootstrap password. The command refuses an existing active administrator.
Do not paste passwords into chat or source files.

The browser workspace works with normal account authentication. Verified Telegram linking/actions and actual
Telegram deliveries additionally require the server-only `TELEGRAM_BOT_TOKEN` secret.
Never use a `VITE_`-prefixed variable for secrets. Password recovery is administrator-assisted;
no email provider is configured.

Run `bun test`, `bun run lint`, and `bun run build` for validation. Integration tests require the
development database and use isolated temporary schemas, never public application records.
See `docs/operations.md` and `docs/audit-report.md` for setup, preservation rules, and remaining limitations.
