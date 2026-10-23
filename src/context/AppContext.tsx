import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  UserRole, 
  Department, 
  Task, 
  TaskProof, 
  AuditLog, 
  QueueJob, 
  TelegramNotification, 
  ServiceDeskTicket, 
  Language, 
  Priority,
  TaskComment 
} from '../types';
import { 
  INITIAL_USERS, 
} from '../data/mockData';
import { AppStorageStatus, loadAppData, saveAppData } from '../utils/appStorage';
import { syncDocumentLanguage } from '../utils/i18n';

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  switchRole: (role: UserRole) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  departments: Department[];
  users: User[];
  tasks: Task[];
  auditLogs: AuditLog[];
  queueJobs: QueueJob[];
  notifications: TelegramNotification[];
  tickets: ServiceDeskTicket[];
  storageStatus: AppStorageStatus;
  isTmaOpen: boolean;
  activeTmaTaskId: string | null;
  openTma: (taskId?: string) => void;
  closeTma: () => void;
  
  // Task Operations
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'proofs'>) => Task;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  clockInTask: (taskId: string) => void;
  submitProof: (taskId: string, proof: Omit<TaskProof, 'id' | 'submittedAt' | 'status'>) => boolean;
  approveProof: (taskId: string, proofId: string, remarks: string) => void;
  rejectProof: (taskId: string, proofId: string, remarks: string) => void;
  addTaskComment: (taskId: string, content: string, parentId?: string) => void;
  toggleCommentReaction: (taskId: string, commentId: string, emoji: string) => void;
  
  // User & Telegram Operations
  bindTelegramUser: (userId: string, telegramId: string, username?: string) => void;
  
  // Ingestion & Scheduler Operations
  importTasks: (newTasks: Partial<Task>[]) => void;
  triggerJobRun: (jobId: string) => void;
  markNotificationAsRead: (notifId: string) => void;
  
  // Service Desk Operations
  createTicket: (ticket: Omit<ServiceDeskTicket, 'id' | 'ticketNumber' | 'status' | 'createdAt'>) => void;
  resolveTicket: (ticketId: string, responseNote: string) => void;

  // Stats
  workPlanProgressPercent: number;
  overdueTasksCount: number;
  pendingProofsCount: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [initialData] = useState(loadAppData);
  const [users, setUsers] = useState<User[]>(initialData.users);
  const [currentUser, setCurrentUser] = useState<User>(() =>
    initialData.users.find(user => user.id === initialData.currentUserId) || initialData.users[0] || INITIAL_USERS[0]
  );
  const [language, setLanguageState] = useState<Language>(() =>
    syncDocumentLanguage(initialData.language)
  );
  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(syncDocumentLanguage(nextLanguage));
  };
  const [storageStatus, setStorageStatus] = useState<AppStorageStatus>(initialData.storageStatus);
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedTheme = localStorage.getItem('unitask_theme') as 'light' | 'dark' | null;
        if (savedTheme === 'light' || savedTheme === 'dark') {
          return savedTheme;
        }
      } catch {
        // Continue with the system preference if browser storage is disabled.
      }
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('unitask_theme', newTheme);
      } catch {
        // Theme changes should still work when browser storage is disabled.
      }
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      }
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      }
    }
  }, [theme]);

  const [departments, setDepartments] = useState<Department[]>(initialData.departments);
  const [tasks, setTasks] = useState<Task[]>(initialData.tasks);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialData.auditLogs);
  const [queueJobs, setQueueJobs] = useState<QueueJob[]>(initialData.queueJobs);
  const [notifications, setNotifications] = useState<TelegramNotification[]>(initialData.notifications);
  const [tickets, setTickets] = useState<ServiceDeskTicket[]>(initialData.tickets);

  useEffect(() => {
    if (!initialData.canPersist) return;

    try {
      saveAppData({
        users,
        departments,
        tasks,
        auditLogs,
        queueJobs,
        notifications,
        tickets,
        currentUserId: currentUser.id,
        language,
      });
      if (storageStatus !== 'recovered') {
        setStorageStatus('saved');
      }
    } catch {
      setStorageStatus('unavailable');
    }
  }, [
    initialData.canPersist,
    users,
    departments,
    tasks,
    auditLogs,
    queueJobs,
    notifications,
    tickets,
    currentUser.id,
    language,
    storageStatus,
  ]);
  
  // TMA Simulator State
  const [isTmaOpen, setIsTmaOpen] = useState<boolean>(false);
  const [activeTmaTaskId, setActiveTmaTaskId] = useState<string | null>(null);

  const openTma = (taskId?: string) => {
    if (taskId) setActiveTmaTaskId(taskId);
    setIsTmaOpen(true);
  };

  const closeTma = () => {
    setIsTmaOpen(false);
  };

  const switchRole = (role: UserRole) => {
    const targetUser = users.find(u => u.role === role);
    if (targetUser) {
      setCurrentUser(targetUser);
    }
  };

  // Add an audit log entry
  const logAction = (action: string, targetId: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      action,
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
      targetId,
      details,
      ipAddress: '195.158.30.12 (Session Client)',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Clock In
  const clockInTask = (taskId: string) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          status: t.status === 'ASSIGNED' || t.status === 'PENDING' ? 'IN_PROGRESS' : t.status,
          isClockedIn: true,
          clockedInAt: now,
          updatedAt: now
        };
      }
      return t;
    }));

    const task = tasks.find(t => t.id === taskId);
    logAction('TASK_CLOCKED_IN', task?.planCode || taskId, `Xodim ish boshlaganini qayd etdi: ${task?.title}`);
  };

  // Create Task
  const createTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'proofs'>): Task => {
    const id = `task-${Date.now()}`;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const newTask: Task = {
      ...taskData,
      id,
      proofs: [],
      createdAt: now,
      updatedAt: now,
    };

    setTasks(prev => [newTask, ...prev]);
    logAction('TASK_CREATED', newTask.planCode, `Yangi topshiriq biriktirildi: "${newTask.title}" -> ${newTask.assignedToName}`);

    // Dispatch Telegram signal immediately
    if (newTask.assignedToTelegramId) {
      const newNotif: TelegramNotification = {
        id: `notif-${Date.now()}`,
        telegramId: newTask.assignedToTelegramId,
        recipientName: newTask.assignedToName,
        type: 'NEW_ASSIGNMENT',
        title: `📌 Yangi topshiriq: ${newTask.planCode}`,
        messageText: `Hurmatli ${newTask.assignedToName}, sizga yangi vazifa yuklatildi:\n"${newTask.title}"\nMuddat: ${newTask.deadline}\nBo'lim: ${newTask.departmentName}`,
        taskPublicCode: newTask.planCode,
        taskId: newTask.id,
        sentAt: 'Hozir',
        isRead: false,
        inlineButtons: [
          { text: "📱 Mini Appda ochish", action: "OPEN_TMA" },
          { text: "🚀 Qabul qildim", action: "ACKNOWLEDGE" },
        ]
      };
      setNotifications(prev => [newNotif, ...prev]);
    }

    return newTask;
  };

  // Update Task
  const updateTask = (taskId: string, updates: Partial<Task>) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          ...updates,
          updatedAt: now
        };
      }
      return t;
    }));
    logAction('TASK_UPDATED', taskId, `Topshiriq ma'lumotlari yangilandi: ${Object.keys(updates).join(', ')}`);
  };

  // Submit Proof-of-Work
  const submitProof = (taskId: string, proofData: Omit<TaskProof, 'id' | 'submittedAt' | 'status'>): boolean => {
    // Validate min 20 chars if note provided
    if (proofData.note && proofData.note.trim().length < 20) {
      return false;
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const proofId = `proof-${Date.now()}`;
    const newProof: TaskProof = {
      ...proofData,
      id: proofId,
      submittedAt: now,
      status: 'PENDING'
    };

    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          status: 'SUBMITTED_FOR_REVIEW',
          progressPercent: Math.max(t.progressPercent, 90),
          proofs: [newProof, ...t.proofs],
          updatedAt: now
        };
      }
      return t;
    }));

    const task = tasks.find(t => t.id === taskId);
    logAction('PROOF_SUBMITTED', task?.planCode || taskId, `Proof-of-Work yuklandi: ${proofData.fileName || proofData.artifactUrl || 'Matnli xulosa'}`);

    // Notify Department Head on Telegram
    const dept = departments.find(d => d.id === task?.departmentId);
    if (dept && dept.headTelegramId) {
      const headNotif: TelegramNotification = {
        id: `notif-${Date.now()}`,
        telegramId: dept.headTelegramId,
        recipientName: dept.headName,
        type: 'PROOF_REVIEW_REQUEST',
        title: `📥 Yangi isbot: ${task?.planCode}`,
        messageText: `${task?.assignedToName} topshiriqni yakunladi va tasdiqlash uchun isbot taqdim etdi:\n"${task?.title}"\nIzoh: "${proofData.note || 'Fayl biriktirildi'}"`,
        taskPublicCode: task?.planCode,
        taskId: task?.id,
        sentAt: 'Hozir',
        isRead: false,
        inlineButtons: [
          { text: "✅ Tasdiqlash", action: "APPROVE_PROOF" },
          { text: "↩️ Qaytarish", action: "REJECT_PROOF" },
        ]
      };
      setNotifications(prev => [headNotif, ...prev]);
    }

    return true;
  };

  // Approve Proof
  const approveProof = (taskId: string, proofId: string, remarks: string) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const updatedProofs = t.proofs.map(p => {
          if (p.id === proofId) {
            return {
              ...p,
              status: 'APPROVED' as const,
              reviewerRemarks: remarks,
              reviewedAt: now,
              reviewedBy: currentUser.fullName
            };
          }
          return p;
        });

        return {
          ...t,
          status: 'COMPLETED' as const,
          progressPercent: 100,
          actualCompletionDate: now.split(' ')[0],
          proofs: updatedProofs,
          updatedAt: now
        };
      }
      return t;
    }));

    const task = tasks.find(t => t.id === taskId);
    logAction('PROOF_APPROVED', task?.planCode || taskId, `Topshiriq isboti tasdiqlandi. Holat: COMPLETED. Izoh: ${remarks}`);

    // Notify worker
    if (task?.assignedToTelegramId) {
      const workerNotif: TelegramNotification = {
        id: `notif-${Date.now()}`,
        telegramId: task.assignedToTelegramId,
        recipientName: task.assignedToName,
        type: 'PROOF_APPROVED',
        title: `✅ Topshiriq tasdiqlandi: ${task.planCode}`,
        messageText: `Tabriklaymiz! Sizning "${task.title}" bo'yicha topshirgan isbotingiz rahbariyat tomonidan tasdiqlandi.\nIzoh: "${remarks || 'A\'lo darajada bajarildi'}"`,
        taskPublicCode: task.planCode,
        taskId: task.id,
        sentAt: 'Hozir',
        isRead: false,
      };
      setNotifications(prev => [workerNotif, ...prev]);
    }
  };

  // Reject Proof
  const rejectProof = (taskId: string, proofId: string, remarks: string) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const updatedProofs = t.proofs.map(p => {
          if (p.id === proofId) {
            return {
              ...p,
              status: 'REJECTED' as const,
              reviewerRemarks: remarks,
              reviewedAt: now,
              reviewedBy: currentUser.fullName
            };
          }
          return p;
        });

        return {
          ...t,
          status: 'REJECTED' as const,
          proofs: updatedProofs,
          updatedAt: now
        };
      }
      return t;
    }));

    const task = tasks.find(t => t.id === taskId);
    logAction('PROOF_REJECTED', task?.planCode || taskId, `Topshiriq isboti qaytarildi. Sabab: ${remarks}`);

    // Notify worker
    if (task?.assignedToTelegramId) {
      const workerNotif: TelegramNotification = {
        id: `notif-${Date.now()}`,
        telegramId: task.assignedToTelegramId,
        recipientName: task.assignedToName,
        type: 'PROOF_REJECTED',
        title: `↩️ Qaytarildi: ${task.planCode}`,
        messageText: `Diqqat! "${task.title}" topshirig'i bo'yicha isbotingiz qaytarildi.\nSabab: "${remarks}"\nIltimos kamchiliklarni bartaraf etib qayta yuboring!`,
        taskPublicCode: task.planCode,
        taskId: task.id,
        sentAt: 'Hozir',
        isRead: false,
        inlineButtons: [
          { text: "📤 Qayta topshirish", action: "UPLOAD_PROOF" }
        ]
      };
      setNotifications(prev => [workerNotif, ...prev]);
    }
  };

  // Add Comment (Thread-based collaboration)
  const addTaskComment = (taskId: string, content: string, parentId?: string) => {
    if (!content.trim()) return;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const newCommentId = `comment-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const newComment: TaskComment = {
      id: newCommentId,
      taskId,
      parentId,
      authorId: currentUser.id,
      authorName: currentUser.fullName,
      authorRole: currentUser.role,
      authorRoleLabel: currentUser.roleLabel,
      authorDepartment: currentUser.departmentName || 'ToshTech',
      content: content.trim(),
      createdAt: now,
      reactions: [
        { emoji: '👍', count: 1, users: [currentUser.id] }
      ],
      replies: []
    };

    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const existingComments = t.comments || [];
        if (parentId) {
          // Add as threaded reply to parent comment
          const updated = existingComments.map(c => {
            if (c.id === parentId) {
              return {
                ...c,
                replies: [...(c.replies || []), newComment]
              };
            }
            return c;
          });
          return { ...t, comments: updated, updatedAt: now };
        } else {
          // Top-level comment
          return { ...t, comments: [...existingComments, newComment], updatedAt: now };
        }
      }
      return t;
    }));

    const task = tasks.find(t => t.id === taskId);
    logAction('COMMENT_ADDED', task?.planCode || taskId, `${currentUser.fullName} топшириқ муҳокамасига фикр билдирди: "${content.slice(0, 50)}..."`);
  };

  // Toggle Reaction on a Comment
  const toggleCommentReaction = (taskId: string, commentId: string, emoji: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const updateReactionsInComment = (comment: TaskComment): TaskComment => {
          if (comment.id === commentId) {
            const reactions = comment.reactions ? [...comment.reactions] : [];
            const rIdx = reactions.findIndex(r => r.emoji === emoji);
            if (rIdx >= 0) {
              const r = { ...reactions[rIdx] };
              const userIdx = r.users.indexOf(currentUser.id);
              if (userIdx >= 0) {
                // remove user reaction
                r.users = r.users.filter(u => u !== currentUser.id);
                r.count = Math.max(0, r.count - 1);
                if (r.count === 0) {
                  reactions.splice(rIdx, 1);
                } else {
                  reactions[rIdx] = r;
                }
              } else {
                r.users = [...r.users, currentUser.id];
                r.count += 1;
                reactions[rIdx] = r;
              }
            } else {
              reactions.push({ emoji, count: 1, users: [currentUser.id] });
            }
            return { ...comment, reactions };
          }
          if (comment.replies && comment.replies.length > 0) {
            return {
              ...comment,
              replies: comment.replies.map(updateReactionsInComment)
            };
          }
          return comment;
        };

        const updatedComments = (t.comments || []).map(updateReactionsInComment);
        return { ...t, comments: updatedComments };
      }
      return t;
    }));
  };

  // Bind Telegram
  const bindTelegramUser = (userId: string, telegramId: string, username?: string) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          telegramId,
          telegramUsername: username || u.telegramUsername,
          isTelegramBound: true,
          boundAt: now
        };
      }
      return u;
    }));
    logAction('TELEGRAM_ID_BOUND', userId, `Telegram hisobi ulandi: ID ${telegramId} (@${username || 'nomalum'})`);
  };

  // Import Tasks
  const importTasks = (newTasks: Partial<Task>[]) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const validatedTasks: Task[] = newTasks.map((t, idx) => ({
      id: t.id || `task-imp-${Date.now()}-${idx}`,
      planCode: t.planCode || `TT-2026-${String(tasks.length + idx + 1).padStart(2, '0')}`,
      title: t.title || "Yangi import topshiriq",
      description: t.description || "",
      expectedOutcome: t.expectedOutcome || "",
      acceptanceCriteria: t.acceptanceCriteria || "",
      sourceReference: t.sourceReference || "ToshTech yillik ish reja",
      status: t.status || 'ASSIGNED',
      priority: t.priority || 'MEDIUM',
      departmentId: t.departmentId || departments[0].id,
      departmentName: t.departmentName || departments[0].name,
      assignedToId: t.assignedToId || users[3].id,
      assignedToName: t.assignedToName || users[3].fullName,
      assignedToTelegramId: t.assignedToTelegramId,
      assignedToTelegramUsername: t.assignedToTelegramUsername,
      createdById: currentUser.id,
      createdByName: currentUser.fullName,
      approverId: currentUser.id,
      approverName: currentUser.fullName,
      assignedDate: t.assignedDate || now.split(' ')[0],
      deadline: t.deadline || '2026-11-30',
      progressPercent: t.progressPercent || 0,
      proofs: [],
      createdAt: now,
      updatedAt: now,
    }));

    setTasks(prev => [...validatedTasks, ...prev]);
    logAction('TASKS_BATCH_IMPORTED', `${validatedTasks.length} ta topshiriq`, `Excel orqali ${validatedTasks.length} ta vazifa tizimga qo'shildi.`);
  };

  // Trigger manual Queue Job execution
  const triggerJobRun = (jobId: string) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    setQueueJobs(prev => prev.map(j => {
      if (j.id === jobId) {
        return {
          ...j,
          status: 'ACTIVE',
          lastRun: now
        };
      }
      return j;
    }));

    // Perform simulated job effect
    if (jobId === 'job-01') {
      // Daily digest simulation
      const newNotif: TelegramNotification = {
        id: `notif-${Date.now()}`,
        telegramId: currentUser.telegramId || '554198302',
        recipientName: currentUser.fullName,
        type: 'DAILY_DIGEST',
        title: "📋 Standup Digest: Kunlik ish rejasi",
        messageText: `Xayrli kun, ${currentUser.fullName}! 09:00 avtomatik xulosasiga binoan bugun bo'limingizda ${tasks.filter(t => t.status === 'IN_PROGRESS').length} ta faol topshiriq bajarilmoqda.`,
        sentAt: 'Hozir',
        isRead: false,
      };
      setNotifications(prev => [newNotif, ...prev]);
      logAction('QUEUE_JOB_EXECUTED', 'daily_digest', 'Ertalabki 09:00 xabarnomalari navbat orqali tarqatildi.');
    } else if (jobId === 'job-03') {
      // Overdue scanner simulation
      logAction('QUEUE_JOB_EXECUTED', 'overdue_monitor', 'Qizil bayroq skaneri ishga tushirildi: Muddati o\'tgan topshiriqlar qayta tekshirildi.');
    }

    setTimeout(() => {
      setQueueJobs(prev => prev.map(j => {
        if (j.id === jobId) {
          return {
            ...j,
            status: 'COMPLETED'
          };
        }
        return j;
      }));
    }, 1500);
  };

  const markNotificationAsRead = (notifId: string) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, isRead: true } : n));
  };

  // Service Desk Ticket
  const createTicket = (ticketData: Omit<ServiceDeskTicket, 'id' | 'ticketNumber' | 'status' | 'createdAt'>) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const newTicket: ServiceDeskTicket = {
      ...ticketData,
      id: `ticket-${Date.now()}`,
      ticketNumber: `SD-2026-${Math.floor(100 + Math.random() * 900)}`,
      status: 'NEW',
      createdAt: now,
    };
    setTickets(prev => [newTicket, ...prev]);
    logAction('SERVICE_TICKET_CREATED', newTicket.ticketNumber, `Yangi murojaat qabul qilindi: "${newTicket.title}" -> ${newTicket.departmentName}`);
  };

  const resolveTicket = (ticketId: string, responseNote: string) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'RESOLVED',
          responseNote,
          resolvedAt: now
        };
      }
      return t;
    }));
    logAction('SERVICE_TICKET_RESOLVED', ticketId, `Murojaatga javob berildi va holat 'RESOLVED' ga o'tkazildi.`);
  };

  // Macro progress calculation
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
  const workPlanProgressPercent = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const overdueTasksCount = tasks.filter(t => t.status === 'OVERDUE').length;
  const pendingProofsCount = tasks.filter(t => t.status === 'SUBMITTED_FOR_REVIEW').length;

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchRole,
        language,
        setLanguage,
        theme,
        toggleTheme,
        setTheme,
        departments,
        users,
        tasks,
        auditLogs,
        queueJobs,
        notifications,
        tickets,
        storageStatus,
        isTmaOpen,
        activeTmaTaskId,
        openTma,
        closeTma,
        createTask,
        updateTask,
        clockInTask,
        submitProof,
        approveProof,
        rejectProof,
        addTaskComment,
        toggleCommentReaction,
        bindTelegramUser,
        importTasks,
        triggerJobRun,
        markNotificationAsRead,
        createTicket,
        resolveTicket,
        workPlanProgressPercent,
        overdueTasksCount,
        pendingProofsCount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
