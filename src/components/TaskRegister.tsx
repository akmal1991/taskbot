import React, { useEffect, useState } from 'react';
import { localizeText } from '../utils/i18n';
import { TaskTeamSummary } from './TaskTeamSummary';
import { useApp } from '../context/AppContext';
import { Task, Priority, TaskStatus, TaskComment } from '../types';
import { exportTasksToExcel, exportTasksToCsv } from '../utils/excel';
import { 
  Plus, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  FileDown,
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  X,
  Smartphone,
  FileCheck,
  Calendar,
  UserCheck,
  Send,
  Building,
  FileText,
  Layers,
  LayoutGrid,
  List,
  GripVertical,
  Check,
  SlidersHorizontal,
  ArrowRight,
  Sparkles,
  RotateCcw,
  Tag,
  BellRing,
  Flame,
  Timer,
  MessageSquare,
  Reply,
  CornerDownRight,
  Smile,
  User
} from 'lucide-react';

const PRIORITY_CONFIG: Record<Priority, {
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  columnBg: string;
  columnBorder: string;
  columnActiveBorder: string;
  headerAccent: string;
  description: string;
  emoji: string;
}> = {
  CRITICAL: {
    label: 'CRITICAL',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/60',
    badgeText: 'text-rose-700 dark:text-rose-300',
    badgeBorder: 'border-rose-200 dark:border-rose-900/60',
    columnBg: 'bg-rose-50/20 dark:bg-rose-950/20',
    columnBorder: 'border-rose-200 dark:border-rose-900/40',
    columnActiveBorder: 'border-rose-500 ring-2 ring-rose-200 dark:ring-rose-900/60 bg-rose-50/40 dark:bg-rose-950/40',
    headerAccent: 'bg-rose-600',
    description: 'Кечиктириб бўлмайдиган стратегик вазифалар',
    emoji: '🔴',
  },
  HIGH: {
    label: 'HIGH',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/60',
    badgeText: 'text-amber-700 dark:text-amber-300',
    badgeBorder: 'border-amber-200 dark:border-amber-900/60',
    columnBg: 'bg-amber-50/20 dark:bg-amber-950/20',
    columnBorder: 'border-amber-200 dark:border-amber-900/40',
    columnActiveBorder: 'border-amber-500 ring-2 ring-amber-200 dark:ring-amber-900/60 bg-amber-50/40 dark:bg-amber-950/40',
    headerAccent: 'bg-amber-500',
    description: 'Муҳим академик ва инфратузилмавий ишлар',
    emoji: '🟠',
  },
  MEDIUM: {
    label: 'MEDIUM',
    badgeBg: 'bg-sky-50 dark:bg-sky-950/60',
    badgeText: 'text-sky-700 dark:text-sky-300',
    badgeBorder: 'border-sky-200 dark:border-sky-900/60',
    columnBg: 'bg-sky-50/20 dark:bg-sky-950/20',
    columnBorder: 'border-sky-200 dark:border-sky-900/40',
    columnActiveBorder: 'border-sky-500 ring-2 ring-sky-200 dark:ring-sky-900/60 bg-sky-50/40 dark:bg-sky-950/40',
    headerAccent: 'bg-sky-500',
    description: 'Режали ривожланиш ва ўқув жараёни',
    emoji: '🔵',
  },
  LOW: {
    label: 'LOW',
    badgeBg: 'bg-slate-100 dark:bg-slate-800',
    badgeText: 'text-slate-600 dark:text-slate-300',
    badgeBorder: 'border-slate-200 dark:border-slate-700',
    columnBg: 'bg-slate-50/40 dark:bg-slate-900/40',
    columnBorder: 'border-slate-200 dark:border-slate-800',
    columnActiveBorder: 'border-slate-400 ring-2 ring-slate-200 dark:ring-slate-700 bg-slate-100/50 dark:bg-slate-800/50',
    headerAccent: 'bg-slate-400 dark:bg-slate-600',
    description: 'Кундалик маъмурий ва техник топшириқлар',
    emoji: '⚪',
  },
};

const CATEGORY_SHORT_NAMES: Record<string, string> = {
  'SEC-1': 'I. Янги Ташаббуслар',
  'SEC-2': 'II. Ўқув Жараёни & Сифат',
  'SEC-3': 'III. Илм-Фан & Инновация',
  'SEC-4': 'IV. Маънавият & Ёшлар',
  'SEC-5': 'V. Халқаро Ҳамкорлик',
  'SEC-6': 'VI. IT & Рақамлаштириш',
  'SEC-7': 'VII. Бошқарув & KPI',
  'SEC-8': 'VIII. Моддий-Техника',
};

const POPULAR_SEARCH_TAGS = [
  'Constructor Bremen',
  'Siemens Questa',
  'Akkreditatsiya',
  'QS reyting',
  'Robototexnika',
  'Sun\'iy intellekt',
  'Pre-foundation',
  'Smart Campus'
];

/**
 * Calculates deadline proximity and urgency level
 * Local reference date: 2026-10-22
 */
export function calculateDeadlineInfo(deadlineStr: string, status: TaskStatus) {
  if (status === 'COMPLETED') {
    return {
      daysLeft: 999,
      urgency: 'NORMAL' as const,
      label: 'Бажарилди',
      badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      rowHighlight: '',
    };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const parts = deadlineStr.split('-').map(Number);
  const target = new Date(parts[0], parts[1] - 1, parts[2]);

  const diffMs = target.getTime() - today.getTime();
  const daysLeft = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return {
      daysLeft,
      urgency: 'OVERDUE' as const,
      label: daysLeft < 0 ? `${Math.abs(daysLeft)} кун кечиккан` : 'Муддати ўтган',
      badgeClass: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800/50 font-bold',
      rowHighlight: 'border-l-4 border-l-rose-600 bg-rose-50/20 dark:bg-rose-950/25',
    };
  }

  if (daysLeft === 0) {
    return {
      daysLeft: 0,
      urgency: 'CRITICAL_URGENT' as const,
      label: 'Бугун сўнгги муддат!',
      badgeClass: 'text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/80 border-rose-300 dark:border-rose-800/60 font-bold animate-pulse',
      rowHighlight: 'border-l-4 border-l-rose-600 bg-rose-50/25 dark:bg-rose-950/30',
    };
  }

  if (daysLeft <= 4) {
    return {
      daysLeft,
      urgency: 'CRITICAL_URGENT' as const,
      label: `${daysLeft} кун қолди`,
      badgeClass: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800/50 font-bold',
      rowHighlight: 'border-l-4 border-l-rose-500 bg-rose-50/15 dark:bg-rose-950/20',
    };
  }

  if (daysLeft <= 7) {
    return {
      daysLeft,
      urgency: 'APPROACHING' as const,
      label: `${daysLeft} кун қолди`,
      badgeClass: 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800/50 font-semibold',
      rowHighlight: 'border-l-4 border-l-amber-500 bg-amber-50/15 dark:bg-amber-950/20',
    };
  }

  if (daysLeft <= 14) {
    return {
      daysLeft,
      urgency: 'UPCOMING' as const,
      label: `${daysLeft} кун қолди`,
      badgeClass: 'text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800/50 font-medium',
      rowHighlight: 'border-l-4 border-l-sky-400 bg-sky-50/10 dark:bg-sky-950/15',
    };
  }

  return {
    daysLeft,
    urgency: 'NORMAL' as const,
    label: `${daysLeft} кун`,
    badgeClass: 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
    rowHighlight: '',
  };
}

const getRoleBadgeStyle = (role: string) => {
  switch (role) {
    case 'DIRECTOR':
      return 'bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/40';
    case 'ADMIN':
      return 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/40';
    case 'WORKER':
      return 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40';
    default:
      return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  }
};

const getRoleInitialColor = (role: string) => {
  switch (role) {
    case 'DIRECTOR':
      return 'bg-purple-600 text-white';
    case 'ADMIN':
      return 'bg-amber-600 text-white';
    case 'WORKER':
      return 'bg-emerald-600 text-white';
    default:
      return 'bg-slate-600 text-white';
  }
};

const countTotalComments = (task: Task): number => {
  if (!task.comments) return 0;
  return task.comments.reduce((total, c) => total + 1 + (c.replies ? c.replies.length : 0), 0);
};

export const TaskRegister: React.FC = () => {
  const { 
    tasks: allTasks,
    sections: OFFICIAL_SECTIONS,
    permissions,
    departments, 
    users, 
    currentUser, 
    createTask, 
    updateTask,
    clockInTask, 
    openTma,
    addTaskComment,
    toggleCommentReaction
  } = useApp();
  const tasks = allTasks.filter(t => !t.archivedAt && !t.draft);

  // View switch: table or drag-and-drop priority board
  const [viewMode, setViewMode] = useState<'table' | 'board'>('table');

  // Drag and Drop State
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverPriority, setDragOverPriority] = useState<Priority | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Deadline Notification Alert dismiss state
  const [isDeadlineAlertDismissed, setIsDeadlineAlertDismissed] = useState(false);
  const [filterApproachingOnly, setFilterApproachingOnly] = useState(false);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all'); // Category filter
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'details' | 'comments' | 'proofs'>('details');

  // Thread commenting state
  const [newCommentText, setNewCommentText] = useState('');
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Form State for creating task
  const [newTitle, setNewTitle] = useState('');
  const [newPlanCode, setNewPlanCode] = useState(`TT-2026-${String(tasks.length + 1).padStart(2, '0')}`);
  const [newDesc, setNewDesc] = useState('');
  const [newExpectedOutcome, setNewExpectedOutcome] = useState('');
  const [newFundingSource, setNewFundingSource] = useState('Университет маблағлари');
  const [newDeptId, setNewDeptId] = useState(departments.find(d => d.active !== false)?.id || '');
  const [newSectionId, setNewSectionId] = useState(OFFICIAL_SECTIONS[0]?.id || '');
  const [newApproverId, setNewApproverId] = useState('');
  const [newAssigneeId, setNewAssigneeId] = useState(users.find(u => u.active && u.role === 'WORKER')?.id || users.find(u => u.active)?.id || '');
  const [additionalAssignees, setAdditionalAssignees] = useState<{ userId: string; departmentId: string }[]>([]);
  const [newPriority, setNewPriority] = useState<Priority>('HIGH');
  const [newDeadline, setNewDeadline] = useState('2027-06-30');

  useEffect(() => {
    if (!users.some(u => u.id === newAssigneeId && u.active)) {
      setNewAssigneeId(users.find(u => u.active && u.role === 'WORKER')?.id || users.find(u => u.active)?.id || '');
    }
    if (!departments.some(d => d.id === newDeptId && d.active !== false)) {
      setNewDeptId(departments.find(d => d.active !== false)?.id || '');
    }
    if (newApproverId && (newApproverId === newAssigneeId || !users.some(u => u.id === newApproverId && u.active && ['ADMIN', 'DIRECTOR'].includes(u.role)))) setNewApproverId('');
  }, [users, departments, newAssigneeId, newDeptId, newApproverId]);

  // Always get fresh task state from tasks
  const selectedTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) || null : null;

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Approaching deadline tasks list (due in <= 14 days or overdue, not completed)
  const approachingDeadlineTasks = tasks.filter(t => {
    if (t.status === 'COMPLETED') return false;
    const info = calculateDeadlineInfo(t.deadline, t.status);
    return info.urgency !== 'NORMAL';
  });

  const criticalDeadlineTasks = approachingDeadlineTasks.filter(t => {
    const info = calculateDeadlineInfo(t.deadline, t.status);
    return info.urgency === 'OVERDUE' || info.urgency === 'CRITICAL_URGENT';
  });

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverPriority(null);
  };

  const handleDragOver = (e: React.DragEvent, priority: Priority) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverPriority !== priority) {
      setDragOverPriority(priority);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetPriority: Priority) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      const task = tasks.find(t => t.id === taskId);
      if (task && task.priority !== targetPriority) {
        try { await updateTask(taskId, { priority: targetPriority }); } catch { handleDragEnd(); return; }
        showNotification(`«${task.planCode}» топшириғи муҳимлиги ${targetPriority} га ўзгартирилди`);
      }
    }
    setDraggedTaskId(null);
    setDragOverPriority(null);
  };

  // Manual priority reassignment
  const handlePriorityChange = async (taskId: string, newPriority: Priority) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.priority !== newPriority) {
      try { await updateTask(taskId, { priority: newPriority }); } catch { return; }
      showNotification(`«${task.planCode}» топшириғи муҳимлиги ${newPriority} га ўзгартирилди`);
    }
  };

  // Comment Handlers
  const handleAddComment = async (e: React.FormEvent, taskId: string, parentId?: string) => {
    e.preventDefault();
    const text = parentId ? replyText : newCommentText;
    if (!text.trim()) return;

    try { await addTaskComment(taskId, text.trim(), parentId); } catch { return; }
    if (parentId) {
      setReplyText('');
      setReplyingToCommentId(null);
    } else {
      setNewCommentText('');
    }
    showNotification('Изоҳ муҳокама оқимига қўшилди');
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedSection('all');
    setSelectedDept('all');
    setSelectedStatus('all');
    setSelectedPriority('all');
    setFilterApproachingOnly(false);
  };

  const isAnyFilterActive = 
    searchQuery.trim() !== '' || 
    selectedSection !== 'all' || 
    selectedDept !== 'all' || 
    selectedStatus !== 'all' || 
    selectedPriority !== 'all' ||
    filterApproachingOnly;

  // Comprehensive Filtering
  const filteredTasks = tasks.filter(task => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      task.title.toLowerCase().includes(q) ||
      task.planCode.toLowerCase().includes(q) ||
      (task.itemNumber && String(task.itemNumber) === q) ||
      (task.itemNumber && `№${task.itemNumber}`.toLowerCase().includes(q)) ||
      task.assignedToName.toLowerCase().includes(q) ||
      task.departmentName.toLowerCase().includes(q) ||
      (task.sectionTitle && task.sectionTitle.toLowerCase().includes(q)) ||
      (task.description && task.description.toLowerCase().includes(q)) ||
      (task.expectedOutcome && task.expectedOutcome.toLowerCase().includes(q)) ||
      (task.fundingSource && task.fundingSource.toLowerCase().includes(q)) ||
      (task.approverName && task.approverName.toLowerCase().includes(q))
    );

    const matchesDept = selectedDept === 'all' || task.departmentId === selectedDept || task.departmentIds?.includes(selectedDept);
    const matchesSection = selectedSection === 'all' || task.sectionId === selectedSection;
    const matchesStatus = selectedStatus === 'all' || (selectedStatus === 'OVERDUE' ? task.isOverdue : task.status === selectedStatus);
    const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority;
    const matchesApproaching = !filterApproachingOnly || (
      task.status !== 'COMPLETED' && calculateDeadlineInfo(task.deadline, task.status).urgency !== 'NORMAL'
    );

    return matchesSearch && matchesDept && matchesSection && matchesStatus && matchesPriority && matchesApproaching;
  });

  // Export tasks to CSV
  const handleExportCsv = (filteredOnly: boolean = false) => {
    const listToExport = filteredOnly ? filteredTasks : tasks;
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = filteredOnly && isAnyFilterActive
      ? `ToshTech_ish_reja_filterlangan_${dateStr}.csv`
      : `ToshTech_ish_reja_hisoboti_${dateStr}.csv`;
    
    exportTasksToCsv(listToExport, fileName);
    showNotification(`${listToExport.length} та топшириқ CSV ҳисобот файли сифатида юклаб олинди`);
  };

  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const dept = departments.find(d => d.id === newDeptId);
    const assignee = users.find(u => u.id === newAssigneeId);
    const sec = OFFICIAL_SECTIONS.find(s => s.id === newSectionId);
    if (!dept || !assignee?.active) { showNotification(localizeText('Choose an active assignee.')); return; }

    try { await createTask({
      itemNumber: tasks.length + 1,
      planCode: newPlanCode.trim(),
      title: newTitle.trim(),
      description: newDesc.trim(),
      expectedOutcome: newExpectedOutcome.trim(),
      sourceReference: "2027 йил сентябрь ойига қадар ToshTech техника университети ишлар РЕЖАСИ",
      fundingSource: newFundingSource.trim(),
      workPlanId: sec?.workPlanId,
      sectionId: sec?.id,
      sectionTitle: sec?.title,
      status: 'ASSIGNED',
      priority: newPriority,
      departmentId: dept.id,
      departmentName: dept.name,
      assignedToId: assignee.id,
      additionalAssignees,
      assignedToName: assignee.fullName,
      assignedToTelegramId: assignee.telegramId,
      assignedToTelegramUsername: assignee.telegramUsername,
      createdById: currentUser.id,
      createdByName: currentUser.fullName,
      approverId: newApproverId,
      approverName: users.find(u => u.id === newApproverId)?.fullName || '',
      assignedDate: new Date().toISOString().split('T')[0],
      deadline: newDeadline,
      progressPercent: 0,
    }); } catch { return; }

    setIsCreateModalOpen(false);
    setNewTitle('');
    setAdditionalAssignees([]);
    setNewDesc('');
    setNewExpectedOutcome('');
    setNewPlanCode(`TT-2026-${String(tasks.length + 2).padStart(2, '0')}`);
    showNotification('Янги топшириқ муваффақиятли рўйхатга олинди');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="font-mono text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 px-2 py-0.5 rounded">БАЖАРИЛДИ</span>;
      case 'SUBMITTED_FOR_REVIEW':
        return <span className="font-mono text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/40 px-2 py-0.5 rounded">КЎРИКДА</span>;
      case 'IN_PROGRESS':
        return <span className="font-mono text-[10px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/40 px-2 py-0.5 rounded">ЖАРАЁНДА</span>;
      case 'OVERDUE':
        return <span className="font-mono text-[10px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/40 px-2 py-0.5 rounded animate-pulse">МУДДАТИ ЎТГАН</span>;
      case 'REJECTED':
        return <span className="font-mono text-[10px] font-semibold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/40 px-2 py-0.5 rounded">ҚАЙТАРИЛГАН</span>;
      case 'ASSIGNED':
      case 'PENDING':
      default:
        return <span className="font-mono text-[10px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded">БИРИКТИРИЛГАН</span>;
    }
  };

  const getPriorityBadge = (priority: Priority) => {
    const config = PRIORITY_CONFIG[priority];
    return (
      <span className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${config.badgeBg} ${config.badgeText} ${config.badgeBorder}`}>
        <span>{config.emoji}</span>
        <span>{config.label}</span>
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification for actions */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2 text-xs animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
          <button 
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* DISMISSIBLE DEADLINE ALERT TOAST / BANNER */}
      {!isDeadlineAlertDismissed && approachingDeadlineTasks.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 dark:from-amber-950/30 dark:via-rose-950/30 dark:to-amber-950/30 border border-amber-300 dark:border-amber-800/60 rounded-2xl shadow-xs relative overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 w-full" />
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-amber-100/90 dark:bg-amber-950/80 rounded-xl text-amber-700 dark:text-amber-400 shrink-0 mt-0.5 border border-transparent dark:border-amber-800/40">
                <BellRing className="w-5 h-5 animate-pulse text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Муддати яқинлашаётган топшириқлар огоҳлантириши</span>
                  </h3>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40">
                    {approachingDeadlineTasks.length} та топшириқ
                  </span>
                  {criticalDeadlineTasks.length > 0 && (
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white animate-pulse">
                      {criticalDeadlineTasks.length} та шошилинч
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                  Яқин 14 кун ичида муддати тугайдиган ёки кечиктирилган топшириқлар аниқланди. Ҳисоботларни қабул қилиш ва ижрони тезлаштиринг.
                </p>

                {/* Quick interactive task chips */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                  {approachingDeadlineTasks.slice(0, 5).map((t) => {
                    const dInfo = calculateDeadlineInfo(t.deadline, t.status);
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTaskId(t.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          dInfo.urgency === 'OVERDUE'
                            ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800/60 hover:bg-rose-200 dark:hover:bg-rose-900/60'
                            : dInfo.urgency === 'CRITICAL_URGENT'
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/50 hover:bg-rose-100'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/50 hover:bg-amber-100'
                        }`}
                        title={`${t.planCode}: ${t.title} (Муддат: ${t.deadline})`}
                      >
                        {dInfo.urgency === 'OVERDUE' ? (
                          <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />
                        ) : (
                          <Flame className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                        )}
                        <span className="font-mono font-bold">{t.planCode}</span>
                        <span className="font-medium text-[11px]">({dInfo.label})</span>
                      </button>
                    );
                  })}
                  {approachingDeadlineTasks.length > 5 && (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium self-center">
                      +{approachingDeadlineTasks.length - 5} та яна
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                onClick={() => setFilterApproachingOnly(!filterApproachingOnly)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 border cursor-pointer ${
                  filterApproachingOnly
                    ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 border-slate-900 dark:border-amber-500'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
                title="Фақат муддати яқинлашган ёки ўтган топшириқларни кўрсатиш"
              >
                <Filter className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{filterApproachingOnly ? "Барчасини кўрсатиш" : "Хавфдагиларни филтрлаш"}</span>
              </button>

              <button
                onClick={() => setIsDeadlineAlertDismissed(true)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Огоҳлантиришни ёпиш (dismiss)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>ToshTech Ишлар Режаси Реэстри</span>
            <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-normal border border-transparent dark:border-slate-700">
              {tasks.length} та расмий топшириқ
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            2027 йил сентябрь ойига қадар “ToshTech” техника университети томонидан амалга ошириладиган ишлар
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Жадвал кўриниши"
            >
              <List className="w-3.5 h-3.5" />
              <span>Жадвал</span>
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'board'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-sky-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Муҳимлик тахтаси (Drag & Drop)"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-indigo-600 dark:text-sky-400" />
              <span>Муҳимлик Тахтаси</span>
            </button>
          </div>

          {/* Re-open Deadline Alert button if dismissed */}
          {approachingDeadlineTasks.length > 0 && isDeadlineAlertDismissed && (
            <button
              onClick={() => setIsDeadlineAlertDismissed(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-800/60 text-amber-900 dark:text-amber-300 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              title="Муддат огоҳлантиришларини қайта очиш"
            >
              <BellRing className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-bounce" />
              <span>Муддат Хавфи ({approachingDeadlineTasks.length})</span>
            </button>
          )}

          <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 dark:border-slate-700">Source PDF not available</span>

          <button
            onClick={() => exportTasksToExcel(tasks)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            title="Export tasks"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => handleExportCsv(isAnyFilterActive)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            title={isAnyFilterActive ? `Филтрланган ${filteredTasks.length} та топшириқни CSV ҳисобот файли сифатида юклаб олиш` : "Барча топшириқларни CSV файл сифатида юклаб олиш"}
          >
            <FileDown className="w-3.5 h-3.5 text-indigo-600 dark:text-sky-400" />
            <span>CSV Экспорт {isAnyFilterActive ? `(${filteredTasks.length})` : '(.csv)'}</span>
          </button>

          {permissions.includes('tasks.create') && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Янги Топшириқ</span>
            </button>
          )}
        </div>
      </div>

      {/* SEARCH BAR & CATEGORY FILTER CONTROL CENTER */}
      <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3 transition-colors">
        {/* Main Search & Category Inputs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
          {/* 1. Enhanced Search Bar (6 cols) */}
          <div className="lg:col-span-6">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Топшириқ номи, Т/р рақами (№1, TT-2026-01), масъул, бўлим ёки калит сўзлар..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-10 pr-24 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-sky-500 transition-all font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white"
              />
              <div className="absolute right-2.5 flex items-center gap-1.5">
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
                    title="Қидирувни тозалаш"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md">
                  {filteredTasks.length} / {tasks.length}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Category (Йўналиш / Бўлим) Filter Dropdown (3 cols) */}
          <div className="lg:col-span-3">
            <div className="relative flex items-center">
              <Layers className="w-4 h-4 text-indigo-600 dark:text-sky-400 absolute left-3 pointer-events-none" />
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full text-xs pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-slate-100 font-semibold cursor-pointer truncate"
              >
                <option value="all">📂 Барча Категориялар ({tasks.length})</option>
                {OFFICIAL_SECTIONS.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.number}. {sec.title} ({tasks.filter(t => t.sectionId === sec.id).length})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Department Filter Dropdown (3 cols) */}
          <div className="lg:col-span-3">
            <div className="relative flex items-center">
              <Building className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 pointer-events-none" />
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full text-xs pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-slate-100 font-semibold cursor-pointer truncate"
              >
                <option value="all">🏢 Барча бўлинмалар ({departments.length})</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>
                    {`${d.name} (${tasks.filter(t => t.departmentId === d.id || t.departmentIds?.includes(d.id)).length})`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Category Horizontal Filter Pills Scroller */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0 mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-indigo-500 dark:text-sky-400" />
            Категориялар:
          </span>

          <button
            onClick={() => setSelectedSection('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              selectedSection === 'all'
                ? 'bg-slate-900 dark:bg-sky-600 text-white shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
            }`}
          >
            <span>Барчаси</span>
            <span className={`text-[10px] font-mono px-1 py-0.2 rounded ${
              selectedSection === 'all' ? 'bg-slate-800 dark:bg-sky-700 text-slate-200' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {tasks.length}
            </span>
          </button>

          {OFFICIAL_SECTIONS.map((sec) => {
            const isSelected = selectedSection === sec.id;
            const count = tasks.filter(t => t.sectionId === sec.id).length;
            return (
              <button
                key={sec.id}
                onClick={() => setSelectedSection(sec.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 border cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 dark:bg-sky-600 text-white border-indigo-600 dark:border-sky-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={sec.title}
              >
                <span>{sec.number}. {CATEGORY_SHORT_NAMES[sec.id] || sec.title.slice(0, 24)}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Search Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="text-slate-400 dark:text-slate-500 shrink-0 flex items-center gap-1 font-medium">
            <Sparkles className="w-3 h-3 text-amber-500" /> Тезкор қидирув:
          </span>
          {POPULAR_SEARCH_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setSearchQuery(tag)}
              className={`px-2 py-0.5 rounded-full border transition-colors whitespace-nowrap cursor-pointer ${
                searchQuery.toLowerCase() === tag.toLowerCase()
                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-800/60 font-semibold'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Dedicated Priority Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0 mr-1 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            Муҳимлик:
          </span>

          <button
            onClick={() => setSelectedPriority('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              selectedPriority === 'all'
                ? 'bg-slate-900 dark:bg-sky-600 text-white shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
            }`}
          >
            <span>Барчаси</span>
            <span className={`text-[10px] font-mono px-1 py-0.2 rounded ${
              selectedPriority === 'all' ? 'bg-slate-800 dark:bg-sky-700 text-slate-200' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {tasks.length}
            </span>
          </button>

          {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as Priority[]).map(p => {
            const count = tasks.filter(t => t.priority === p).length;
            const cfg = PRIORITY_CONFIG[p];
            const isSelected = selectedPriority === p;
            return (
              <button
                key={p}
                onClick={() => setSelectedPriority(p)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 border cursor-pointer ${
                  isSelected
                    ? p === 'CRITICAL'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : p === 'HIGH'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : p === 'MEDIUM'
                      ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                      : 'bg-slate-800 dark:bg-slate-700 text-white border-slate-800 dark:border-slate-600 shadow-xs'
                    : `${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeBorder} hover:opacity-80`
                }`}
              >
                <span>{cfg.emoji}</span>
                <span>{cfg.label}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-white/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Status Filter Tabs (with Deadline Risk Filter) */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            Ҳолат:
          </span>
          {[
            { id: 'all', label: 'Барчаси', count: tasks.length },
            { id: 'IN_PROGRESS', label: 'Жараёнда', count: tasks.filter(t => t.status === 'IN_PROGRESS').length },
            { id: 'SUBMITTED_FOR_REVIEW', label: "Кўрикда", count: tasks.filter(t => t.status === 'SUBMITTED_FOR_REVIEW').length },
            { id: 'COMPLETED', label: 'Бажарилди', count: tasks.filter(t => t.status === 'COMPLETED').length },
            { id: 'OVERDUE', label: "Муддати ўтган", count: tasks.filter(t => t.isOverdue).length },
            { id: 'ASSIGNED', label: 'Бириктирилган', count: tasks.filter(t => t.status === 'ASSIGNED').length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedStatus(tab.id);
                setFilterApproachingOnly(false);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                selectedStatus === tab.id && !filterApproachingOnly
                  ? 'bg-slate-900 dark:bg-sky-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] font-mono px-1 py-0.2 rounded ${
                selectedStatus === tab.id && !filterApproachingOnly ? 'bg-slate-800 dark:bg-sky-700 text-slate-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}

          {/* Dedicated Approaching Deadline Filter Tab */}
          <button
            onClick={() => setFilterApproachingOnly(!filterApproachingOnly)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 border ml-auto cursor-pointer ${
              filterApproachingOnly
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-900/60'
            }`}
            title="Муддати яқинлашган ва ўтган топшириқлар фильтри"
          >
            <BellRing className="w-3 h-3 text-amber-500 shrink-0" />
            <span>Муддат Хавфи</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
              filterApproachingOnly ? 'bg-white/20 text-white' : 'bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200'
            }`}>
              {approachingDeadlineTasks.length}
            </span>
          </button>
        </div>

        {/* Active Filters Ribbon & Reset Button (visible when any filter is active) */}
        {isAnyFilterActive && (
          <div className="flex items-center justify-between gap-2 p-2 bg-indigo-50/70 dark:bg-slate-800/80 border border-indigo-100 dark:border-slate-700 rounded-lg text-xs text-indigo-900 dark:text-slate-200 pt-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Filter className="w-3.5 h-3.5 text-indigo-600 dark:text-sky-400" />
              <span className="font-semibold">Фаол фильтрлар:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-indigo-200 dark:border-slate-700 text-[11px] font-medium text-slate-800 dark:text-slate-200">
                  Қидирув: «{searchQuery}»
                  <button onClick={() => setSearchQuery('')} className="hover:text-rose-600 cursor-pointer"><X className="w-3 h-3" /></button>
                </span>
              )}
              {selectedSection !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-indigo-200 dark:border-slate-700 text-[11px] font-medium text-slate-800 dark:text-slate-200">
                  Категория: {CATEGORY_SHORT_NAMES[selectedSection] || OFFICIAL_SECTIONS.find(s => s.id === selectedSection)?.number}
                  <button onClick={() => setSelectedSection('all')} className="hover:text-rose-600 cursor-pointer"><X className="w-3 h-3" /></button>
                </span>
              )}
              {selectedDept !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-indigo-200 dark:border-slate-700 text-[11px] font-medium text-slate-800 dark:text-slate-200">
                  Бўлинма: {departments.find(d => d.id === selectedDept)?.name}
                  <button onClick={() => setSelectedDept('all')} className="hover:text-rose-600 cursor-pointer"><X className="w-3 h-3" /></button>
                </span>
              )}
              {selectedPriority !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-indigo-200 dark:border-slate-700 text-[11px] font-medium text-slate-800 dark:text-slate-200">
                  Муҳимлик: {selectedPriority}
                  <button onClick={() => setSelectedPriority('all')} className="hover:text-rose-600 cursor-pointer"><X className="w-3 h-3" /></button>
                </span>
              )}
              {selectedStatus !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-indigo-200 dark:border-slate-700 text-[11px] font-medium text-slate-800 dark:text-slate-200">
                  Ҳолат: {selectedStatus}
                  <button onClick={() => setSelectedStatus('all')} className="hover:text-rose-600 cursor-pointer"><X className="w-3 h-3" /></button>
                </span>
              )}
              {filterApproachingOnly && (
                <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800/60 text-[11px] font-semibold">
                  ⚠️ Муддат хавфи фильтри
                  <button onClick={() => setFilterApproachingOnly(false)} className="hover:text-rose-600 cursor-pointer"><X className="w-3 h-3" /></button>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleExportCsv(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-slate-800 text-indigo-700 dark:text-sky-400 hover:text-indigo-900 dark:hover:text-sky-300 border border-indigo-200 dark:border-slate-700 rounded-md text-[11px] font-semibold transition-colors shadow-xs cursor-pointer"
                title="Айни дамда сараланган топшириқларни CSV файл сифатида юклаб олиш"
              >
                <FileDown className="w-3.5 h-3.5 text-indigo-600 dark:text-sky-400" />
                <span>CSV Ҳисобот ({filteredTasks.length})</span>
              </button>

              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
                title="Барча фильтрларни дастлабки ҳолатга қайтариш"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Тозалаш</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* VIEW MODE 1: DRAG & DROP PRIORITY BOARD */}
      {viewMode === 'board' ? (
        <div className="space-y-2">
          <div className="p-2.5 bg-indigo-50/70 dark:bg-slate-800/60 border border-indigo-200/80 dark:border-slate-700 rounded-xl flex items-center justify-between text-xs text-indigo-900 dark:text-slate-200">
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-indigo-600 dark:text-sky-400 shrink-0" />
              <span>
                <strong>Муҳимлик бўйича Drag &amp; Drop:</strong> Карточкаларни керакли устунга судраб ўтказинг ёки карточкадаги тугмача орқали ўзгартиринг.
              </span>
            </div>
            <span className="font-mono text-[11px] bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-indigo-200 dark:border-slate-700 text-indigo-800 dark:text-sky-400">
              Кўрсатилмоқда: {filteredTasks.length} / {tasks.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as Priority[]).map((colPriority) => {
              const cfg = PRIORITY_CONFIG[colPriority];
              const colTasks = filteredTasks.filter(t => t.priority === colPriority);
              const isOver = dragOverPriority === colPriority;

              return (
                <div
                  key={colPriority}
                  onDragOver={(e) => handleDragOver(e, colPriority)}
                  onDragLeave={() => {
                    if (dragOverPriority === colPriority) {
                      setDragOverPriority(null);
                    }
                  }}
                  onDrop={(e) => handleDrop(e, colPriority)}
                  className={`flex flex-col rounded-xl border transition-all duration-200 ${
                    isOver ? cfg.columnActiveBorder : `${cfg.columnBorder} ${cfg.columnBg}`
                  }`}
                >
                  {/* Column Header */}
                  <div className="p-3 border-b border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/80 backdrop-blur-xs rounded-t-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${cfg.headerAccent}`} />
                        <h3 className="font-mono font-bold text-xs text-slate-900 dark:text-white tracking-tight">
                          {cfg.label}
                        </h3>
                      </div>
                      <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badgeBg} ${cfg.badgeText} border ${cfg.badgeBorder}`}>
                        {colTasks.length}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      {cfg.description}
                    </p>
                  </div>

                  {/* Drop Zone Task List */}
                  <div className="p-2 space-y-2.5 min-h-[480px] max-h-[75vh] overflow-y-auto">
                    {colTasks.length === 0 ? (
                      <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-slate-300/80 dark:border-slate-700 rounded-lg p-4 text-center">
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                          Топшириқлар мавжуд эмас
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                          Судраб бу ерга ташланг
                        </p>
                      </div>
                    ) : (
                      colTasks.map((task) => {
                        const isDragging = draggedTaskId === task.id;
                        const dInfo = calculateDeadlineInfo(task.deadline, task.status);
                        const commentsCount = countTotalComments(task);

                        return (
                          <div
                            key={task.id}
                            draggable={permissions.includes('tasks.edit') && task.status !== 'COMPLETED'}
                            onDragStart={(e) => handleDragStart(e, task.id)}
                            onDragEnd={handleDragEnd}
                            onClick={() => setSelectedTaskId(task.id)}
                            className={`p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing group ${
                              isDragging ? 'opacity-40 scale-95 border-indigo-400 ring-2 ring-indigo-200' : 'hover:border-slate-300 dark:hover:border-slate-700'
                            } ${dInfo.rowHighlight}`}
                          >
                            {/* Card Top: Code, Grip, Status */}
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <div className="flex items-center gap-1.5">
                                <GripVertical className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors shrink-0" />
                                <span className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-transparent dark:border-slate-700">
                                  {task.itemNumber ? `№${task.itemNumber}` : task.planCode}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {commentsCount > 0 && (
                                  <span className="flex items-center gap-0.5 font-mono text-[10px] text-indigo-600 dark:text-sky-300 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800/50 px-1.5 py-0.2 rounded font-semibold">
                                    <MessageSquare className="w-2.5 h-2.5" />
                                    <span>{commentsCount}</span>
                                  </span>
                                )}
                                <div>{getStatusBadge(task.status)}</div>
                              </div>
                            </div>

                            {/* Category Badge on Card */}
                            {task.sectionId && (
                              <div className="mb-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedSection(task.sectionId || 'all');
                                  }}
                                  className="inline-flex items-center gap-1 text-[9.5px] font-medium bg-indigo-50 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-slate-700 text-indigo-700 dark:text-sky-300 border border-indigo-200/70 dark:border-slate-700 px-1.5 py-0.5 rounded transition-colors truncate max-w-full cursor-pointer"
                                  title="Ушбу категория бўйича фильтрлаш"
                                >
                                  <Layers className="w-2.5 h-2.5 shrink-0" />
                                  <span className="truncate">{CATEGORY_SHORT_NAMES[task.sectionId] || task.sectionTitle}</span>
                                </button>
                              </div>
                            )}

                            {/* Card Title */}
                            <h4 className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-sky-400 line-clamp-2 leading-snug mb-2">
                              {task.title}
                            </h4>

                            {/* Department & Assignee */}
                            <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5 mb-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                              <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                                {task.assignedToName}
                              </div>
                              <div className="text-slate-400 dark:text-slate-500 text-[10px] truncate">
                                {task.departmentName}
                              </div>
                            </div>

                            {/* Progress Bar & Deadline with visual indicator */}
                            <div className="space-y-1.5 mb-2.5">
                              <div className="flex items-center justify-between text-[10px] font-mono">
                                <span className="text-slate-400 dark:text-slate-500">Ижро %</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{task.progressPercent}%</span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all ${
                                    task.status === 'COMPLETED' ? 'bg-emerald-500' :
                                    task.isOverdue ? 'bg-rose-500' : 'bg-sky-500'
                                  }`}
                                  style={{ width: `${task.progressPercent}%` }}
                                />
                              </div>

                              <div className="flex items-center justify-between text-[10px] pt-0.5">
                                <span className="text-slate-400 dark:text-slate-500">Муддат:</span>
                                <div className="flex items-center gap-1 font-mono">
                                  <span className={`font-medium ${
                                    dInfo.urgency === 'OVERDUE' ? 'text-rose-600 dark:text-rose-400 font-bold' :
                                    dInfo.urgency === 'CRITICAL_URGENT' ? 'text-rose-600 dark:text-rose-400 font-bold' :
                                    dInfo.urgency === 'APPROACHING' ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-slate-600 dark:text-slate-400'
                                  }`}>
                                    {task.deadline}
                                  </span>
                                  {dInfo.urgency !== 'NORMAL' && (
                                    <span className={`text-[9px] px-1 py-0.2 rounded font-semibold border ${dInfo.badgeClass}`}>
                                      {dInfo.label}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Card Footer: Quick Move & TMA Action */}
                            <div 
                              className="flex items-center justify-between pt-1 text-[11px]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">Кўчириш:</span>
                                <select
                                  disabled={!permissions.includes('tasks.edit') || task.status === 'COMPLETED'}
                                  value={task.priority}
                                  onChange={(e) => handlePriorityChange(task.id, e.target.value as Priority)}
                                  className="text-[10px] font-mono font-semibold py-0.5 px-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none cursor-pointer"
                                >
                                  <option value="CRITICAL">🔴 CRIT</option>
                                  <option value="HIGH">🟠 HIGH</option>
                                  <option value="MEDIUM">🔵 MED</option>
                                  <option value="LOW">⚪ LOW</option>
                                </select>
                              </div>

                              <button
                                onClick={() => openTma(task.id)}
                                className="p-1 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                                title="Telegram Mini Appда очиш"
                              >
                                <Smartphone className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* VIEW MODE 2: HIGH-DENSITY DATA GRID TABLE WITH DEADLINE VISUAL INDICATOR */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-16 text-center">Т/р</th>
                  <th className="py-2.5 px-3 min-w-[280px]">Иш Режа Номи &amp; Категория</th>
                  <th className="py-2.5 px-3">Масъул Бўлим &amp; Ходим</th>
                  <th className="py-2.5 px-3 text-center min-w-[140px]">Муҳимлик</th>
                  <th className="py-2.5 px-3 text-center">Ҳолат</th>
                  <th className="py-2.5 px-3 text-right min-w-[140px]">Муддат &amp; Огоҳлантириш</th>
                  <th className="py-2.5 px-3 text-right">Ижро %</th>
                  <th className="py-2.5 px-3 text-center w-24">Муҳокама / TMA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Search className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                        <p className="font-medium text-slate-600 dark:text-slate-300">Танланган мезонларга мос топшириқлар топилмади.</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">Қидирув сўзини ўзгартириб кўринг ёки фильтрларни тозаланг.</p>
                        {isAnyFilterActive && (
                          <button
                            onClick={handleResetFilters}
                            className="mt-2 px-3 py-1.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 dark:hover:bg-indigo-500 transition-colors"
                          >
                            Фильтрларни тозалаш
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => {
                    const dInfo = calculateDeadlineInfo(task.deadline, task.status);
                    const commentsCount = countTotalComments(task);

                    return (
                      <tr 
                        key={task.id} 
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group ${dInfo.rowHighlight}`}
                        onClick={() => setSelectedTaskId(task.id)}
                      >
                        <td className="py-3 px-3 font-mono font-bold text-slate-500 dark:text-slate-400 text-center">
                          {task.itemNumber || task.planCode.replace('TT-2026-', '')}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900 group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-400 line-clamp-1">
                            {task.title}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {task.sectionId && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSection(task.sectionId || 'all');
                                }}
                                className="inline-flex items-center gap-1 text-[10px] font-medium bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 dark:text-indigo-300 dark:border-indigo-800/60 px-1.5 py-0.2 rounded transition-colors"
                                title="Ушбу категория бўйича фильтрлаш"
                              >
                                <Layers className="w-2.5 h-2.5" />
                                <span>{CATEGORY_SHORT_NAMES[task.sectionId] || task.sectionTitle?.slice(0, 20)}</span>
                              </button>
                            )}
                            {task.fundingSource && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                                {task.fundingSource}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="font-medium text-slate-800 dark:text-slate-200">{task.assignedToName}</div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500">{task.departmentName}</div>
                        </td>
                        <td 
                          className="py-3 px-3 text-center whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Interactive Inline Priority Selector */}
                          <div className="inline-block relative">
                            <select
                              disabled={!permissions.includes('tasks.edit') || task.status === 'COMPLETED'}
                              value={task.priority}
                              onChange={(e) => handlePriorityChange(task.id, e.target.value as Priority)}
                              aria-label="Муҳимликни танлаш"
                              className={`text-[11px] font-mono font-bold px-2 py-1 rounded-md border cursor-pointer focus:outline-none transition-colors ${
                                task.priority === 'CRITICAL'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900/60 dark:hover:bg-rose-900/80'
                                  : task.priority === 'HIGH'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900/60 dark:hover:bg-amber-900/80'
                                  : task.priority === 'MEDIUM'
                                  ? 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-900/60 dark:hover:bg-sky-900/80'
                                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
                              }`}
                            >
                              <option value="CRITICAL" className="dark:bg-slate-900 dark:text-rose-400">🔴 CRITICAL</option>
                              <option value="HIGH" className="dark:bg-slate-900 dark:text-amber-400">🟠 HIGH</option>
                              <option value="MEDIUM" className="dark:bg-slate-900 dark:text-sky-400">🔵 MEDIUM</option>
                              <option value="LOW" className="dark:bg-slate-900 dark:text-slate-300">⚪ LOW</option>
                            </select>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {getStatusBadge(task.status)}
                        </td>
                        {/* DEADLINE COLUMN WITH RICH VISUAL INDICATOR */}
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
                            {task.deadline}
                          </div>

                          {/* Visual Indicator Pill for Approaching / Overdue Deadlines */}
                          {dInfo.urgency !== 'NORMAL' ? (
                            <div className="mt-1 flex items-center justify-end">
                              <span className={`inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-full border shadow-2xs ${dInfo.badgeClass}`}>
                                {dInfo.urgency === 'OVERDUE' ? (
                                  <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />
                                ) : dInfo.urgency === 'CRITICAL_URGENT' ? (
                                  <Flame className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0 animate-pulse" />
                                ) : (
                                  <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                                )}
                                <span>{dInfo.label}</span>
                              </span>
                            </div>
                          ) : (
                            <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                              {task.status === 'COMPLETED' ? 'Якунланган' : `${dInfo.daysLeft} кун қолди`}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums whitespace-nowrap font-semibold text-slate-800 dark:text-slate-200">
                          {task.progressPercent}%
                        </td>
                        <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            {/* Thread Comments Button */}
                            <button
                              onClick={() => {
                                setSelectedTaskId(task.id);
                                setActiveModalTab('comments');
                              }}
                              className={`p-1.5 rounded transition-colors flex items-center gap-1 ${
                                commentsCount > 0 
                                  ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 font-semibold text-[11px]' 
                                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-500 dark:hover:text-slate-200 dark:hover:bg-slate-800'
                              }`}
                              title={commentsCount > 0 ? `${commentsCount} та жамоа фикри` : "Муҳокама оқимини очиш"}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              {commentsCount > 0 && <span className="font-mono text-[10px]">{commentsCount}</span>}
                            </button>

                            {/* TMA Button */}
                            <button
                              onClick={() => openTma(task.id)}
                              className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Telegram Mini Appда очиш"
                            >
                              <Smartphone className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TASK DETAIL & THREAD-BASED COLLABORATION MODAL */}
      {selectedTask && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div className="space-y-1 pr-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded shadow-2xs">
                    Т/р: {selectedTask.itemNumber || selectedTask.planCode}
                  </span>
                  {getStatusBadge(selectedTask.status)}
                  {getPriorityBadge(selectedTask.priority)}

                  {/* Deadline status in modal */}
                  {(() => {
                    const info = calculateDeadlineInfo(selectedTask.deadline, selectedTask.status);
                    if (info.urgency !== 'NORMAL') {
                      return (
                        <span className={`inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-full border ${info.badgeClass}`}>
                          {info.urgency === 'OVERDUE' ? <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" /> : <Flame className="w-3 h-3 text-amber-600 dark:text-amber-400" />}
                          <span>{info.label}</span>
                        </span>
                      );
                    }
                    return null;
                  })()}

                  <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-full">
                    <MessageSquare className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    <span>{countTotalComments(selectedTask)} та фикр</span>
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {selectedTask.title}
                </h3>

                {selectedTask.sectionTitle && (
                  <div className="text-[11px] text-indigo-700 dark:text-indigo-400 font-medium flex items-center gap-1.5">
                    <Layers className="w-3 h-3 text-indigo-500" />
                    <span>Категория: {selectedTask.sectionTitle}</span>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setSelectedTaskId(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs: Details vs Comments vs Proofs */}
            <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-5 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <button
                onClick={() => setActiveModalTab('details')}
                className={`py-3 px-3 border-b-2 font-medium flex items-center gap-1.5 transition-colors ${
                  activeModalTab === 'details'
                    ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 font-bold'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Асосий Тавсиф</span>
              </button>

              <button
                onClick={() => setActiveModalTab('comments')}
                className={`py-3 px-3 border-b-2 font-medium flex items-center gap-1.5 transition-colors relative ${
                  activeModalTab === 'comments'
                    ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 font-bold'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Жамоа Муҳокамаси (Thread)</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  activeModalTab === 'comments' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  {countTotalComments(selectedTask)}
                </span>
              </button>

              <button
                onClick={() => setActiveModalTab('proofs')}
                className={`py-3 px-3 border-b-2 font-medium flex items-center gap-1.5 transition-colors ${
                  activeModalTab === 'proofs'
                    ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 font-bold'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Proof-of-Work Исботлари</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {selectedTask.proofs.length}
                </span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              <TaskTeamSummary task={selectedTask} />
              {/* TAB 1: DETAILS */}
              {activeModalTab === 'details' && (
                <div className="space-y-4">
                  {/* Quick Priority Reassignment Panel */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                        Муҳимлик Даражасини Танлаш:
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        Ҳозирги: <strong className="text-slate-900 dark:text-white">{selectedTask.priority}</strong>
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as Priority[]).map((p) => {
                        const isActive = selectedTask.priority === p;
                        const cfg = PRIORITY_CONFIG[p];
                        return (
                          <button
                            key={p}
                            disabled={!permissions.includes('tasks.edit') || selectedTask.status === 'COMPLETED'}
                            type="button"
                            onClick={() => handlePriorityChange(selectedTask.id, p)}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                              isActive
                                ? p === 'CRITICAL'
                                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                : p === 'HIGH'
                                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                : p === 'MEDIUM'
                                ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                                : 'bg-slate-800 dark:bg-slate-700 text-white border-slate-800 shadow-xs'
                                : `${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeBorder} hover:opacity-80`
                            }`}
                          >
                            {isActive ? <Check className="w-3.5 h-3.5 shrink-0" /> : <span>{cfg.emoji}</span>}
                            <span>{p}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                      Амалга Ошириш Механизми (Батафсил)
                    </h4>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-100 dark:border-slate-800 whitespace-pre-line">
                      {selectedTask.description || "Тавсиф берилмаган."}
                    </p>
                  </div>

                  {selectedTask.expectedOutcome && (
                    <div>
                      <h4 className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                        Кутилаётган Натижа
                      </h4>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                        {selectedTask.expectedOutcome}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">Масъул Бўлим:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedTask.departmentName}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">Ижро учун Масъул:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedTask.assignedToName}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">Бажариш Муддати:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <span>{selectedTask.deadline}</span>
                        {(() => {
                          const info = calculateDeadlineInfo(selectedTask.deadline, selectedTask.status);
                          if (info.urgency !== 'NORMAL') {
                            return (
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold border ${info.badgeClass}`}>
                                {info.label}
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">Назорат (Проректор):</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedTask.approverName}</span>
                    </div>
                    {selectedTask.fundingSource && (
                      <div className="col-span-2">
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 block mb-0.5">Молиялаштириш Манбаи:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{selectedTask.fundingSource}</span>
                      </div>
                    )}
                  </div>

                  {/* Teaser for comments */}
                  <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span className="text-slate-700 dark:text-slate-300">
                        Ушбу топшириқда <strong>{countTotalComments(selectedTask)} та</strong> жамоа муҳокамаси мавжуд.
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveModalTab('comments')}
                      className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs transition-colors"
                    >
                      Муҳокамага ўтиш &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: THREAD-BASED TEAM COMMENTING SYSTEM */}
              {activeModalTab === 'comments' && (
                <div className="space-y-4">
                  {/* Top Header Information */}
                  <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-lg">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                          Ишчи Гуруҳ ва Раҳбарият Муҳокамаси (Threaded Comments)
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Топшириқ ижроси, тўсиқлар ва оралиқ натижалар бўйича тўғридан-тўғри жамоавий мулоқот
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 rounded-full">
                      {countTotalComments(selectedTask)} та фикр
                    </span>
                  </div>

                  {/* Top-Level New Comment Composer */}
                  <form 
                    onSubmit={(e) => handleAddComment(e, selectedTask.id)} 
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${getRoleInitialColor(currentUser.role)}`}>
                          {currentUser.fullName.charAt(0)}
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{currentUser.fullName}</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${getRoleBadgeStyle(currentUser.role)}`}>
                          {currentUser.roleLabel.split(' ')[0]}
                        </span>
                      </div>
                      <span className="text-slate-400 dark:text-slate-500">Янги фикр қолдириш</span>
                    </div>

                    <textarea
                      rows={2}
                      placeholder="Топшириқ бўйича фикр, кўрсатма ёки савол ёзинг (жамоа аъзолари кўради)..."
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 leading-relaxed"
                    />

                    <div className="flex items-center justify-between pt-1">
                      {/* Fast Tag Suggestions */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {['@Ректор', '@Проректор', '@Масъул', 'Муддат бўйича', 'Ҳисобот тайёр'].map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setNewCommentText((prev) => (prev ? `${prev} ${tag}` : tag))}
                            className="text-[10px] px-2 py-0.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 transition-colors"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>

                      <button
                        type="submit"
                        disabled={!newCommentText.trim()}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Юбориш</span>
                      </button>
                    </div>
                  </form>

                  {/* Thread Comments List */}
                  <div className="space-y-3 pt-2">
                    {(!selectedTask.comments || selectedTask.comments.length === 0) ? (
                      <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                        <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                        <p className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                          Ҳозирча жамоавий муҳокама бошланмаган.
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
                          Биринчи бўлиб фикр ёзинг, масъул ходимларга кўрсатма беринг ёки савол қолдиринг!
                        </p>
                      </div>
                    ) : (
                      selectedTask.comments.map((comment) => (
                        <div 
                          key={comment.id} 
                          className="p-3.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 rounded-xl shadow-2xs space-y-2.5 transition-all"
                        >
                          {/* Parent Comment Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${getRoleInitialColor(comment.authorRole)}`}>
                                {comment.authorName.charAt(0)}
                              </span>
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-slate-900 dark:text-white text-xs">{comment.authorName}</span>
                                  <span className={`text-[9.5px] font-mono px-1.5 py-0.2 rounded border ${getRoleBadgeStyle(comment.authorRole)}`}>
                                    {comment.authorRoleLabel || comment.authorRole}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                  {comment.authorDepartment} &bull; {comment.createdAt}
                                </span>
                              </div>
                            </div>

                            {/* Reply Button Trigger */}
                            <button
                              onClick={() => {
                                if (replyingToCommentId === comment.id) {
                                  setReplyingToCommentId(null);
                                  setReplyText('');
                                } else {
                                  setReplyingToCommentId(comment.id);
                                  setReplyText('');
                                }
                              }}
                              className="flex items-center gap-1 px-2 py-1 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-600 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-300 rounded-md border border-slate-200 dark:border-slate-700 text-[11px] font-medium transition-colors"
                            >
                              <Reply className="w-3 h-3" />
                              <span>Жавоб бериш</span>
                            </button>
                          </div>

                          {/* Comment Body */}
                          <p className="text-slate-800 dark:text-slate-200 text-xs leading-relaxed whitespace-pre-line pl-8">
                            {comment.content}
                          </p>

                          {/* Reactions Row & Actions */}
                          <div className="flex items-center justify-between pl-8 pt-1 text-[11px]">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {/* Existing Reactions */}
                              {(comment.reactions || []).map((rx) => {
                                const hasUserReacted = rx.users.includes(currentUser.id);
                                return (
                                  <button
                                    key={rx.emoji}
                                    onClick={() => { void toggleCommentReaction(selectedTask.id, comment.id, rx.emoji).catch(() => {}); }}
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] transition-all ${
                                      hasUserReacted
                                        ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800 font-bold'
                                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                                    title={`Муносабат билдириш: ${rx.emoji}`}
                                  >
                                    <span>{rx.emoji}</span>
                                    <span className="font-mono text-[10px]">{rx.count}</span>
                                  </button>
                                );
                              })}

                              {/* Quick React Buttons */}
                              {['👍', '🎯', '👏', '🔥'].map((emoji) => {
                                const isAlready = comment.reactions?.some(r => r.emoji === emoji);
                                if (isAlready) return null;
                                return (
                                  <button
                                    key={emoji}
                                    onClick={() => { void toggleCommentReaction(selectedTask.id, comment.id, emoji).catch(() => {}); }}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-xs opacity-60 hover:opacity-100 transition-opacity"
                                    title={`${emoji} қўшиш`}
                                  >
                                    {emoji}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* INLINE THREAD REPLY COMPOSER */}
                          {replyingToCommentId === comment.id && (
                            <form 
                              onSubmit={(e) => handleAddComment(e, selectedTask.id, comment.id)}
                              className="ml-6 pl-3 border-l-2 border-indigo-400 dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 p-3 rounded-r-xl space-y-2 mt-2"
                            >
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-semibold text-indigo-900 dark:text-indigo-300 flex items-center gap-1">
                                  <CornerDownRight className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                  <span>{comment.authorName} фикрига жавоб ёзиш:</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setReplyingToCommentId(null)}
                                  className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-[10px]"
                                >
                                  Бекор қилиш
                                </button>
                              </div>

                              <textarea
                                rows={2}
                                autoFocus
                                placeholder={`@${comment.authorName} га жавоб ёзинг...`}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                              />

                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setReplyingToCommentId(null)}
                                  className="px-2.5 py-1 text-slate-600 dark:text-slate-400 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
                                >
                                  Ёпиш
                                </button>
                                <button
                                  type="submit"
                                  disabled={!replyText.trim()}
                                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-md flex items-center gap-1 shadow-2xs"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>Жавоб юбориш</span>
                                </button>
                              </div>
                            </form>
                          )}

                          {/* NESTED THREADED REPLIES */}
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="ml-6 pl-3 border-l-2 border-indigo-100 dark:border-indigo-900/60 space-y-2.5 pt-2">
                              {comment.replies.map((reply) => (
                                <div 
                                  key={reply.id} 
                                  className="p-3 bg-slate-50/80 dark:bg-slate-850/80 border border-slate-200/80 dark:border-slate-700/60 rounded-xl space-y-1.5"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${getRoleInitialColor(reply.authorRole)}`}>
                                        {reply.authorName.charAt(0)}
                                      </span>
                                      <span className="font-bold text-slate-900 dark:text-white text-xs">{reply.authorName}</span>
                                      <span className={`text-[9px] font-mono px-1 py-0.2 rounded border ${getRoleBadgeStyle(reply.authorRole)}`}>
                                        {reply.authorRoleLabel || reply.authorRole}
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{reply.createdAt}</span>
                                  </div>

                                  <p className="text-slate-800 dark:text-slate-200 text-xs leading-relaxed whitespace-pre-line pl-6">
                                    {reply.content}
                                  </p>

                                  {/* Reply Reactions */}
                                  <div className="flex items-center gap-1.5 pl-6 pt-0.5">
                                    {(reply.reactions || []).map((rx) => {
                                      const hasUserReacted = rx.users.includes(currentUser.id);
                                      return (
                                        <button
                                          key={rx.emoji}
                                          onClick={() => { void toggleCommentReaction(selectedTask.id, reply.id, rx.emoji).catch(() => {}); }}
                                          className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full border text-[10px] ${
                                            hasUserReacted
                                              ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800 font-bold'
                                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                          }`}
                                        >
                                          <span>{rx.emoji}</span>
                                          <span className="font-mono">{rx.count}</span>
                                        </button>
                                      );
                                    })}

                                    {/* Quick Emoji Reaction buttons for replies */}
                                    {['👍', '🎯', '❤️'].map((emoji) => {
                                      const isAlready = reply.reactions?.some(r => r.emoji === emoji);
                                      if (isAlready) return null;
                                      return (
                                        <button
                                          key={emoji}
                                          onClick={() => { void toggleCommentReaction(selectedTask.id, reply.id, emoji).catch(() => {}); }}
                                          className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-[11px] opacity-50 hover:opacity-100"
                                          title={`${emoji} қўшиш`}
                                        >
                                          {emoji}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: SUBMITTED PROOFS */}
              {activeModalTab === 'proofs' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Proof-of-Work Ҳужжатли Далиллар ({selectedTask.proofs.length})</span>
                    </h4>
                    {selectedTask.proofs.length === 0 && (
                      <span className="text-slate-400 dark:text-slate-500 text-xs">Ҳали исбот юкланмаган</span>
                    )}
                  </div>

                  {selectedTask.proofs.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                      <FileCheck className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                      <p className="text-slate-600 dark:text-slate-300 font-medium text-xs">Ижро исботлари юкланмаган</p>
                      <p className="text-slate-400 dark:text-slate-500 text-[11px]">
                        Ходим топшириқни Telegram Mini App орқали ёки порталда бажаргач, ҳужжатли исботлар шу ерда кўринади.
                      </p>
                    </div>
                  ) : (
                    selectedTask.proofs.map((proof) => (
                      <div key={proof.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg space-y-2">
                        <p className="text-xs font-semibold">{`${proof.submittedBy} — ${selectedTask.assignments?.find(a => a.userId === proof.submittedById)?.departmentName || ''}`}</p>
                        {proof.fileUrl && <a href={proof.fileUrl} className="block text-xs text-sky-600 underline">{proof.fileName}</a>}
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <FileCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            {proof.fileName || proof.artifactUrl || 'Ҳисобот ҳужжати'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                            {proof.submittedAt}
                          </span>
                        </div>
                        {proof.note && (
                          <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed italic bg-white dark:bg-slate-800/80 p-2 rounded border border-slate-100 dark:border-slate-700">
                            "{proof.note}"
                          </p>
                        )}
                        {proof.artifactUrl && (
                          <a 
                            href={proof.artifactUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 text-[11px] font-medium"
                          >
                            <span>Ҳаволани очиш</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Modal Bottom Action Bar */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  openTma(selectedTask.id);
                  setSelectedTaskId(null);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                <Smartphone className="w-4 h-4" />
                <span>Ish maydonini ochish</span>
              </button>

              <div className="flex items-center gap-2">
                {selectedTask.assignedToId === currentUser.id && selectedTask.status === 'IN_PROGRESS' && <form key={`${selectedTask.id}-${selectedTask.version}`} className="flex items-center gap-2" onSubmit={async e => {
                  e.preventDefault(); const form = e.currentTarget;
                  const value = Number(new FormData(form).get('progress'));
                  try { await updateTask(selectedTask.id, { progressPercent: value }); } catch { return; }
                }}>
                  <input aria-label="Progress" name="progress" type="number" min={0} max={99} step={1} required defaultValue={selectedTask.progressPercent} className="w-20 rounded-lg border p-2 text-xs dark:bg-slate-800" />
                  <button className="rounded-lg border px-3 py-2 text-xs font-semibold">Save progress</button>
                </form>}
                {!selectedTask.isClockedIn && selectedTask.assignedToId === currentUser.id && (
                  <button
                    type="button"
                    onClick={async () => {
                      try { await clockInTask(selectedTask.id); } catch { return; }
                      showNotification('Иш жараёни (Clock In) қайд этилди');
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Ишни Бошлаш (Clock In)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedTaskId(null)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors"
                >
                  Ёпиш
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                ToshTech Иш Режасига Янги Топшириқ Қўшиш
              </h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTaskSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Режа Коди</label>
                  <input
                    type="text"
                    required
                    value={newPlanCode}
                    onChange={(e) => setNewPlanCode(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg font-mono font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Муҳимлик Даражаси</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as Priority)}
                    className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg font-medium"
                  >
                    <option value="CRITICAL" className="dark:bg-slate-900">🔴 CRITICAL (Жуда юқори)</option>
                    <option value="HIGH" className="dark:bg-slate-900">🟠 HIGH (Юқори)</option>
                    <option value="MEDIUM" className="dark:bg-slate-900">🔵 MEDIUM (Ўртача)</option>
                    <option value="LOW" className="dark:bg-slate-900">⚪ LOW (Паст)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Иш Режа Категорияси (Бўлим) *</label>
                <select
                  value={newSectionId}
                  onChange={(e) => setNewSectionId(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg font-medium"
                >
                  <option value="">No section</option>
                  {OFFICIAL_SECTIONS.map(s => (
                    <option key={s.id} value={s.id} className="dark:bg-slate-900">
                      {s.number}. {s.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Reviewer</label>
                <select value={newApproverId} onChange={e => setNewApproverId(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800">
                  <option value="">Any authorized reviewer</option>
                  {users.filter(u => u.active && ['ADMIN','DIRECTOR'].includes(u.role) && u.id !== newAssigneeId && !additionalAssignees.some(a => a.userId === u.id)).map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Топшириқ Сарлавҳаси *</label>
                <input
                  type="text"
                  required
                  placeholder="Масалан: Siemens Questa лабораториясида чипларни синовдан ўтказиш"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Амалга Ошириш Механизми (Тавсиф)</label>
                <textarea
                  rows={3}
                  placeholder="Топшириқни бажариш босқичлари ва аниқ вазифалар..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Масъул Бўлинма *</label>
                  <select
                    value={newDeptId}
                    onChange={(e) => setNewDeptId(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg"
                  >
                    {departments.filter(d => d.active !== false).map(d => (
                      <option key={d.id} value={d.id} className="dark:bg-slate-900">{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ижро учун Масъул *</label>
                  <select
                    required
                    value={newAssigneeId}
                    onChange={(e) => { setNewAssigneeId(e.target.value); setAdditionalAssignees(previous => previous.filter(a => a.userId !== e.target.value)); }}
                    className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg font-medium"
                  >
                    <option value="">Choose an active assignee.</option>
                    {users.filter(u => u.active).map(u => (
                      <option key={u.id} value={u.id} className="dark:bg-slate-900">
                        {`${u.fullName} — ${localizeText(u.role)}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <fieldset className="space-y-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <legend className="px-1 font-semibold">Additional assignees and departments</legend>
                <p className="text-xs text-slate-500">Each assignee submits their own evidence. Task members can view all submitted evidence.</p>
                {additionalAssignees.map((member, index) => <div key={member.userId} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <span className="self-center text-xs">{users.find(u => u.id === member.userId)?.fullName}</span>
                  <select aria-label="Department" required value={member.departmentId} onChange={e => setAdditionalAssignees(previous => previous.map((a, i) => i === index ? { ...a, departmentId: e.target.value } : a))} className="rounded-lg border bg-slate-50 p-2 text-xs dark:bg-slate-800">
                    <option value="">Choose an active department.</option>
                    {departments.filter(d => d.active !== false).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <button type="button" onClick={() => setAdditionalAssignees(previous => previous.filter(a => a.userId !== member.userId))} className="rounded-lg border px-3 py-2 text-xs">Remove</button>
                </div>)}
                <select aria-label="Add assignee" value="" disabled={additionalAssignees.length >= 49} onChange={e => { const u = users.find(u => u.id === e.target.value); if (u) { setAdditionalAssignees(previous => [...previous, { userId: u.id, departmentId: u.departmentId || '' }]); if (newApproverId === u.id) setNewApproverId(''); } }} className="w-full rounded-lg border bg-slate-50 p-2 text-xs dark:bg-slate-800">
                  <option value="">Add assignee</option>
                  {users.filter(u => u.active && u.id !== newAssigneeId && !additionalAssignees.some(a => a.userId === u.id)).map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                </select>
              </fieldset>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Бажариш Муддати *</label>
                  <input
                    type="date"
                    required
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Молиялаштириш Манбаи</label>
                  <input
                    type="text"
                    value={newFundingSource}
                    onChange={(e) => setNewFundingSource(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Бекор Қилиш
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Юклатиш ва Telegram Хабар Юбориш</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
