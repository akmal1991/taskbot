---
name: Runtime tool availability
description: Native package lifecycle tools may be absent despite declared Replit modules.
---
Check actual executable availability before choosing dependencies that require Node/npm/node-gyp lifecycle scripts.

**Why:** The configured Node module was present in project configuration while node/npm/node-gyp were unavailable during package installation. Native Argon2 installation failed; the application uses portable scrypt instead, as documented in operations.

**How to apply:** Prefer Bun-compatible portable implementations where appropriate, or deliberately provision the required build tools. Recheck availability rather than assuming the limitation is permanent.
