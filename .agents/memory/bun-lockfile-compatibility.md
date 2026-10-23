---
name: Bun lockfile compatibility
description: Handling imported Bun lockfiles that do not match the Bun runtime configured in this Repl.
---

An imported JSON-format `bun.lock` was rejected by the configured Bun 1.3.6 as an unknown lockfile version. A normal `bun install` regenerated the lockfile in the supported format and allowed the build to complete.

**Why:** A frozen install fails before dependencies are present when the checked-in lockfile schema is unsupported by the configured runtime.

**How to apply:** If Bun reports an unknown lockfile version, confirm the Repl's Bun version and regenerate the lock with that version before switching to frozen installs.
