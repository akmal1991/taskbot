---
name: Unassigned work-plan drafts
description: Product rules for importing official Excel work plans before staff mappings exist.
---

Imported work-plan entries must remain inactive draft data, separate from live tasks. Do not infer assignees, departments, priorities, statuses, or turn multi-date source schedules into a single deadline. Preserve source schedule text verbatim. Promotion to live tasks requires explicit administrator mapping and an auditable action.

**Why:** the supplied work plan has no platform account or department IDs, and many schedule cells contain multiple milestone dates; the user selected an unassigned draft import.

**How to apply:** future import, revision, assignment, and promotion flows must keep draft entries non-operational until an administrator explicitly maps them.

Explicitly requested sample workbook assignments may be saved as clearly labeled, separate draft enrichment, not operational assignments. Keep original source responsibilities and schedules intact.

**Why:** the user requested that the finalized workbook, including synthetic assignees and reviewers, be added to the platform without providing real platform account mappings.

**How to apply:** display sample fields and their synthetic status in the draft view. Never create real accounts, send notifications, or replace source responsibilities with synthetic staff.
