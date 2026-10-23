import {
  INITIAL_AUDIT_LOGS,
  INITIAL_DEPARTMENTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_QUEUE_JOBS,
  INITIAL_TASKS,
  INITIAL_TICKETS,
  INITIAL_USERS,
} from '../data/mockData';
import {
  AuditLog,
  Department,
  Language,
  QueueJob,
  ServiceDeskTicket,
  Task,
  TelegramNotification,
  User,
} from '../types';
import { DEFAULT_LANGUAGE, normalizeLanguage } from './i18n';

const STORAGE_KEY = 'unitask_app_data_v1';
const BACKUP_KEY = 'unitask_app_data_corrupt_backup';
const STORAGE_VERSION = 1;

export type AppStorageStatus = 'saved' | 'demo' | 'recovered' | 'unavailable';

export interface AppData {
  users: User[];
  departments: Department[];
  tasks: Task[];
  auditLogs: AuditLog[];
  queueJobs: QueueJob[];
  notifications: TelegramNotification[];
  tickets: ServiceDeskTicket[];
  currentUserId: string | null;
  language: Language;
}

interface StoredAppData extends AppData {
  version: number;
}

export interface AppDataLoadResult extends AppData {
  storageStatus: AppStorageStatus;
  canPersist: boolean;
}

const getDemoData = (): AppData => ({
  users: INITIAL_USERS,
  departments: INITIAL_DEPARTMENTS,
  tasks: INITIAL_TASKS,
  auditLogs: INITIAL_AUDIT_LOGS,
  queueJobs: INITIAL_QUEUE_JOBS,
  notifications: INITIAL_NOTIFICATIONS,
  tickets: INITIAL_TICKETS,
  currentUserId: INITIAL_USERS[0]?.id ?? null,
  language: DEFAULT_LANGUAGE,
});

const isRecordArray = <T>(value: unknown): value is T[] =>
  Array.isArray(value) &&
  value.every(
    (record) =>
      typeof record === 'object' &&
      record !== null &&
      typeof (record as { id?: unknown }).id === 'string',
  );

const hasValidStoredCollections = (value: unknown): value is StoredAppData => {
  if (typeof value !== 'object' || value === null) return false;

  const data = value as Partial<StoredAppData>;
  return (
    data.version === STORAGE_VERSION &&
    isRecordArray<User>(data.users) &&
    isRecordArray<Department>(data.departments) &&
    isRecordArray<Task>(data.tasks) &&
    isRecordArray<AuditLog>(data.auditLogs) &&
    isRecordArray<QueueJob>(data.queueJobs) &&
    isRecordArray<TelegramNotification>(data.notifications) &&
    isRecordArray<ServiceDeskTicket>(data.tickets) &&
    (data.currentUserId === null || typeof data.currentUserId === 'string')
  );
};

export const loadAppData = (): AppDataLoadResult => {
  const demoData = getDemoData();
  if (typeof window === 'undefined') {
    return { ...demoData, storageStatus: 'unavailable', canPersist: false };
  }

  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return { ...demoData, storageStatus: 'unavailable', canPersist: false };
  }

  if (raw === null) {
    return { ...demoData, storageStatus: 'demo', canPersist: true };
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (hasValidStoredCollections(parsed)) {
      const { version: _version, ...data } = parsed;
      return {
        ...data,
        language: normalizeLanguage(data.language),
        storageStatus: 'saved',
        canPersist: true,
      };
    }
  } catch {
    // Preserve unreadable content below and start safely from demo data.
  }

  try {
    window.localStorage.setItem(BACKUP_KEY, raw);
    return { ...demoData, storageStatus: 'recovered', canPersist: true };
  } catch {
    return { ...demoData, storageStatus: 'unavailable', canPersist: false };
  }
};

export const saveAppData = (data: AppData): void => {
  if (typeof window === 'undefined') {
    throw new Error('Browser storage is unavailable.');
  }

  const snapshot: StoredAppData = { ...data, version: STORAGE_VERSION };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
};
