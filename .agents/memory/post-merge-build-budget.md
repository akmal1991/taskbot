---
name: Tailwind scan boundaries
description: Why build timeouts were misleading and how to avoid workspace-wide Tailwind scans.
---

Keep Tailwind scanning limited to application UI sources, including any deliberately added UI directories.

**Why:** Automatic workspace scanning previously took approximately 170–325 seconds and delayed the first preview load. Restricting scanning to actual UI sources reduced production builds to approximately 3–4 seconds. The earlier long-timeout recommendation is no longer needed for this cause.

**How to apply:** Do not restore workspace-wide scanning when adding artifacts or dependencies. Extend explicit sources when UI moves outside existing directories. Inspect scan scope and actual build errors before increasing post-merge timeouts.
