---
name: Bun lockfile compatibility
description: Handling imported Bun lockfiles that do not match the Bun runtime configured in this Repl.
---

An imported `bun.lock` written with `lockfileVersion` 2 was rejected by the configured Bun 1.3.6 as an unknown lockfile version. A normal `bun install` can resolve dependencies from `package.json`, regenerate the lockfile in the supported format, and allow a subsequent frozen install.

**Why:** Replit's configured Bun module may lag the version that produced a restored project's lockfile, preventing the workflow from finding installed packages.

**How to apply:** Check the Bun version and lockfile header before changing app code. If regeneration is necessary, inspect the resulting dependency and source changes, then confirm `bun install --frozen-lockfile` works.
