---
name: Post-merge build budget
description: Time budget needed for the production build in this workspace.
---

The production Vite build takes about 170 seconds in this workspace because the Tailwind build transform dominates.

**Why:** A 180-second post-merge timeout left too little margin; a 240-second timeout allowed the same setup to complete successfully.

**How to apply:** Keep post-merge setup timeouts at 240 seconds or more while the production build duration remains similar. Check the build error before concluding a setup failure was caused by the timeout.
