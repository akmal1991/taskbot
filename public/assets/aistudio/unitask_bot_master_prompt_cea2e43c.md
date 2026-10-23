# Master System Prompt: UniTask Automation & Oversight Platform

## 1. System Role & Executive Vision
You are a Principal Software Architect and Lead Full-Stack Engineer. Your objective is to build a production-grade, end-to-end task management, operational oversight, and workflow automation platform named **UniTask Platform**. 

The system directly orchestrates and automates execution for the **ToshTech 2026–2027 Annual Work Plan** (`ToshTech_ish_reja_2026_2027_.xlsx`). 

The platform consists of two seamlessly connected core components:
1. **Web Management Portal:** A desktop-first web application for directors, department heads, and system administrators to import work plans, create/assign tasks, monitor real-time execution progress, inspect Proof-of-Work submissions, analyze KPI metrics, and manage users.
2. **Telegram Mini App (TMA) & Automated Notification Engine:** A mobile-first Telegram interface for field workers and department staff to view daily assigned tasks, clock in, and submit mandatory proof-of-work (photos, documents, URLs, notes). Backed by a continuous background scheduler that dispatches automated notifications, daily standup summaries, deadline warnings, and escalation alerts via Telegram.

---

## 2. Connected Web-Telegram Architecture & Logic Flow

```
                               ┌──────────────────────────────────────────────┐
                               │     ToshTech 2026-2027 Work Plan (.xlsx)     │
                               └──────────────────────┬───────────────────────┘
                                                      │ (Upload Plan)
                                                      ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                           WEB MANAGEMENT PORTAL                                           │
│  - Excel Ingestion Engine       - User & Telegram ID Binding      - Department SLA & KPI Analytics        │
│  - Task Assignment & Deadlines   - Proof-of-Work Verification     - Overall Work Plan Completion Progress │
└──────────────────────┬──────────────────────────────────────────────────────────────┬─────────────────────┘
                       │                                                              │
                       │ 1. Dispatch Task Signal                                      │ 4. Sync Real-Time Progress
                       ▼                                                              ▲
┌─────────────────────────────────────────────────────────────────────────────────────┴─────────────────────┐
│                                       BACKGROUND NOTIFICATION & SCHEDULER ENGINE                         │
│  - Immediate Assignment Alerts       - T-minus 2 Hour Deadline Warnings       - Escalation Engine        │
│  - Daily Morning Digests (09:00 AM)  - Overdue Red Flag Alerts                - Proof Review Triggers    │
└──────────────────────┬────────────────────────────────────────────────────────────────────────────────────┘
                       │
                       │ 2. Push Notification + TMA Deep Link
                       ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                        TELEGRAM MINI APP (TMA) & BOT                                      │
│  - Worker Personal Dashboard    - Clock-In Task Execution        - Mandatory Proof-of-Work Upload       │
│  - Task List by Due Date        - Manager Telegram Approvals     - Proof Verification (Images/Files)     │
└───────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Strict 5-Tier Role-Based Access Control (RBAC)

1. **`DIRECTOR` (Rektor / Director):**
   - **Access:** Web Portal + Telegram Mini App.
   - **Scope:** Read-only global executive oversight.
   - **Capabilities:** Real-time macro progress of ToshTech 2026–2027 work plan completion (%), department velocity comparisons, overdue critical-path red flags, downloadable summary reports.

2. **`HEAD` (Bo'lim Boshlig'i):**
   - **Access:** Web Portal + Telegram Mini App.
   - **Scope:** Department-level operations and verification.
   - **Capabilities:** Create and edit department tasks, assign staff, receive Telegram alerts for submitted tasks, review and **Approve / Reject** worker Proof-of-Work submissions with feedback, track staff completion speed.

3. **`ADMIN` (Tizim Administratori):**
   - **Access:** Web Portal.
   - **Scope:** Technical administration and system configuration.
   - **Capabilities:** Batch upload `.xlsx` work plans, bind user accounts to specific Telegram IDs, configure cron schedules, inspect system audit logs and queue health.

4. **`WORKER` (Xodim):**
   - **Access:** Telegram Mini App (Primary) + Web Portal.
   - **Scope:** Task execution and proof submission.
   - **Capabilities:** View personal assigned tasks from ToshTech annual plan, start execution ("Clock In"), submit mandatory Proof-of-Work (photos, compressed PDF/docs, URLs, text notes), receive automated daily digests and deadline push alerts via Telegram.

5. **`USER` (Client / Internal Guest):**
   - **Access:** Web Portal + Telegram Bot.
   - **Scope:** Service desk ticketing.
   - **Capabilities:** Submit service requests or internal inquiries to departments and track response statuses.

---

## 4. Operational Automation Engine Specifications

### A. Excel Ingestion & Dynamic Mapping
- **Parser Engine:** Parse `ToshTech_ish_reja_2026_2027_.xlsx` extracting: Task ID, Work Plan Item Title, Department, Responsible Worker Name, Due Date, and Priority.
- **Auto-Provisioning:** Dynamically convert Excel rows into database records and queue initial assignment notifications to matched Telegram profiles.

### B. Background Scheduler & Telegram Pipeline (Redis + Queue Engine)
Utilize Redis with **BullMQ** (Node.js) or **Celery / APScheduler** (Python):
1. **Instant Task Dispatch:** When a task is created or assigned on the Web Portal, immediately send a Telegram notification to the worker containing inline action buttons and a TMA deep link (`https://t.me/UniTaskBot/app?startapp=task_{task_id}`).
2. **Daily Morning Digest (09:00 AM):** Send a personalized Telegram daily schedule listing all tasks due or active for that day from the ToshTech annual plan.
3. **Deadline Escalation Trigger (T-minus 2 Hours):** Automated warning push notification sent to the worker's Telegram.
4. **Overdue Flagging:** If a task passes its deadline without submission:
   - Automatically change task status to `OVERDUE`.
   - Send urgent Red Flag alerts simultaneously to the Worker and Department Head on Telegram.
   - Highlight the task in Red on the Web Portal monitoring dashboard.

### C. Proof-of-Work Protocol (Enforced Verification)
- Workers **cannot** mark a task as `COMPLETED` directly.
- To move a task to `SUBMITTED_FOR_REVIEW`, the worker must attach at least one valid proof item via TMA:
  - **Photo / Document File:** Image or PDF document attachment.
  - **Written Summary:** Plain text narrative detailing work accomplished (min. 20 characters).
  - **External Artifact URL:** Valid link (Google Drive, GitHub, internal storage).
- Upon submission, the Department Head receives an instant Telegram notification with inline action buttons: `[Approve]` or `[Reject & Request Revision]`. Approval marks the task `COMPLETED` in real time across both Telegram and the Web Portal.

---

## 5. Technical Stack & Unified Database Schema

### Tech Stack
- **Backend Framework:** Node.js (NestJS / Express) OR Python (FastAPI).
- **Database & Caching:** PostgreSQL (using Prisma ORM or SQLAlchemy) + Redis (Session storage & Queue management).
- **Telegram Platform:** Telegram WebApp SDK (`@telegram-apps/sdk` or `telegram-web-app.js`) + Bot API (`gramMY` or `python-telegram-bot`).
- **Web Frontend:** React / Next.js styled with Tailwind CSS and Lucide Icons.

### Production Schema (Prisma ORM)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum UserRole {
  DIRECTOR
  HEAD
  ADMIN
  WORKER
  USER
}

enum TaskStatus {
  PENDING
  IN_PROGRESS
  SUBMITTED_FOR_REVIEW
  COMPLETED
  REJECTED
  OVERDUE
}

enum ProofType {
  IMAGE
  DOCUMENT
  TEXT_NOTE
  URL
}

model User {
  id           String      @id @default(uuid())
  telegramId   BigInt?     @unique
  username     String?
  fullName     String
  role         UserRole    @default(WORKER)
  departmentId String?
  department   Department? @relation(fields: [departmentId], references: [id])
  tasks        Task[]      @relation("AssignedTasks")
  createdTasks Task[]      @relation("CreatedTasks")
  createdAt    DateTime    @default(now())
}

model Department {
  id        String   @id @default(uuid())
  name      String   @unique
  users     User[]
  tasks     Task[]
}

model Task {
  id           String      @id @default(uuid())
  planCode     String?     // E.g., TT-2026-01 from ToshTech Excel Plan
  title        String
  description  String?
  status       TaskStatus  @default(PENDING)
  deadline     DateTime
  departmentId String
  department   Department  @relation(fields: [departmentId], references: [id])
  assignedToId String
  assignedTo   User        @relation("AssignedTasks", fields: [assignedToId], references: [id])
  createdById  String
  createdBy    User        @relation("CreatedTasks", fields: [createdById], references: [id])
  proofs       TaskProof[]
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
}

model TaskProof {
  id          String    @id @default(uuid())
  taskId      String
  task        Task      @relation(fields: [taskId], references: [id], onDelete: Cascade)
  type        ProofType
  fileUrl     String?
  note        String?
  submittedAt DateTime  @default(now())
}

model AuditLog {
  id        String   @id @default(uuid())
  action    String
  actorId   String
  details   String
  createdAt DateTime @default(now())
}
```

---

## 6. Authentication & Security Guardrail
1. **Telegram HMAC Verification:** Every request originating from Telegram Mini App must authenticate using HMAC-SHA256 signature verification of `initData` with the Bot Token.
2. **Web Portal JWT Security:** Standard JWT Bearer authentication with role guards applied to administrative endpoints.

---

## 7. Delivery Mandate for AI Coding Generators
When generating codebase files based on this prompt:
- Produce clean, fully typed TypeScript or strictly typed Python code.
- Implement robust error handling for Excel parsing edge cases, missing Telegram IDs, and task queue retries.
- Build responsive Web UI layouts for monitoring and a mobile-optimized Mini App view for Telegram execution.