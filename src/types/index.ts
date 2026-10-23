export type UserRole = 'DIRECTOR' | 'HEAD' | 'ADMIN' | 'WORKER' | 'USER';

export type TaskStatus = 
  | 'PENDING' 
  | 'ASSIGNED'
  | 'IN_PROGRESS' 
  | 'SUBMITTED_FOR_REVIEW' 
  | 'COMPLETED' 
  | 'REJECTED' 
  | 'OVERDUE';

export type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type ProofType = 'IMAGE' | 'DOCUMENT' | 'TEXT_NOTE' | 'URL';

export type Language = 'uz_latn' | 'uz_cyrl' | 'ru' | 'en';

export interface Department {
  id: string;
  code: string;
  name: string;
  headName: string;
  headTelegramId?: string;
  staffCount: number;
  completedTasksCount: number;
  totalTasksCount: number;
  targetKpiPercent: number;
}

export interface User {
  id: string;
  telegramId?: string;
  telegramUsername?: string;
  fullName: string;
  role: UserRole;
  roleLabel: string;
  departmentId?: string;
  departmentName?: string;
  avatarUrl?: string;
  email: string;
  phone: string;
  isTelegramBound: boolean;
  boundAt?: string;
}

export interface TaskProof {
  id: string;
  taskId: string;
  type: ProofType;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  note?: string; // min 20 chars narrative
  artifactUrl?: string;
  submittedAt: string;
  submittedBy: string;
  submittedById: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewerRemarks?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface WorkPlanSection {
  id: string;
  number: string;
  title: string;
  taskCount: number;
}

export interface TaskComment {
  id: string;
  taskId: string;
  parentId?: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorRoleLabel?: string;
  authorDepartment?: string;
  content: string;
  createdAt: string;
  reactions?: { emoji: string; count: number; users: string[] }[];
  replies?: TaskComment[];
}

export interface Task {
  id: string;
  itemNumber?: number; // 1 to 92
  planCode: string; // e.g., TT-2026-01 from ToshTech Excel Plan
  title: string;
  description: string;
  expectedOutcome?: string;
  acceptanceCriteria?: string;
  sourceReference?: string; // Rector decree, ministry order, etc.
  fundingSource?: string; // e.g. Университет маблағлари, Давлат бюджети, etc.
  sectionId?: string; // e.g. SEC-1 to SEC-8
  sectionTitle?: string;
  status: TaskStatus;
  priority: Priority;
  departmentId: string;
  departmentName: string;
  assignedToId: string;
  assignedToName: string;
  assignedToTelegramId?: string;
  assignedToTelegramUsername?: string;
  createdById: string;
  createdByName: string;
  approverId: string;
  approverName: string;
  assignedDate: string;
  deadline: string;
  actualCompletionDate?: string;
  progressPercent: number;
  proofs: TaskProof[];
  comments?: TaskComment[];
  createdAt: string;
  updatedAt: string;
  isClockedIn?: boolean;
  clockedInAt?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  targetId?: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

export interface QueueJob {
  id: string;
  name: string;
  queue: 'task_dispatch' | 'daily_digest' | 'deadline_escalation' | 'proof_review' | 'overdue_monitor';
  status: 'WAITING' | 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'DELAYED';
  scheduledTime: string;
  lastRun?: string;
  payloadSummary: string;
  retries: number;
}

export interface TelegramNotification {
  id: string;
  telegramId: string;
  recipientName: string;
  type: 'NEW_ASSIGNMENT' | 'DAILY_DIGEST' | 'DEADLINE_WARNING_2H' | 'OVERDUE_ALERT' | 'PROOF_REVIEW_REQUEST' | 'PROOF_APPROVED' | 'PROOF_REJECTED';
  title: string;
  messageText: string;
  taskPublicCode?: string;
  taskId?: string;
  sentAt: string;
  isRead: boolean;
  inlineButtons?: { text: string; action: string; url?: string }[];
}

export interface ServiceDeskTicket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  departmentId: string;
  departmentName: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  status: 'NEW' | 'PROCESSING' | 'RESOLVED' | 'CLOSED';
  priority: Priority;
  createdAt: string;
  responseNote?: string;
  resolvedAt?: string;
}
