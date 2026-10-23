import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { exportTasksToExcel } from '../utils/excel';
import { localizeText } from '../utils/i18n';
import { canAccessView } from '../utils/permissions';
import { OFFICIAL_SECTIONS } from '../data/mockData';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileSpreadsheet, 
  TrendingUp, 
  Building2, 
  ArrowUpRight, 
  Users, 
  Smartphone, 
  ExternalLink,
  ShieldAlert,
  Calendar,
  FileText,
  Layers,
  BookOpen,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell
} from 'recharts';

interface DashboardProps {
  setActiveView: (view: string) => void;
  setSelectedTaskId?: (taskId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActiveView }) => {
  const { 
    tasks, 
    departments, 
    workPlanProgressPercent, 
    overdueTasksCount, 
    pendingProofsCount, 
    currentUser,
    openTma,
    theme 
  } = useApp();

  const isDark = theme === 'dark';
  const canViewTasks = canAccessView('tasks', currentUser.role);
  const canViewProofs = canAccessView('proofs', currentUser.role);

  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('all');

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const overdueTasks = tasks.filter(t => t.status === 'OVERDUE');

  // Priority-based statistics for Recharts progress visualization
  const priorityChartData = [
    {
      priority: 'CRITICAL',
      priorityLabel: 'CRITICAL (Жуда муҳим)',
      completed: tasks.filter(t => t.priority === 'CRITICAL' && t.status === 'COMPLETED').length,
      underReview: tasks.filter(t => t.priority === 'CRITICAL' && t.status === 'SUBMITTED_FOR_REVIEW').length,
      inProgress: tasks.filter(t => t.priority === 'CRITICAL' && t.status === 'IN_PROGRESS').length,
      overdue: tasks.filter(t => t.priority === 'CRITICAL' && t.status === 'OVERDUE').length,
      assigned: tasks.filter(t => t.priority === 'CRITICAL' && (t.status === 'ASSIGNED' || t.status === 'PENDING')).length,
      total: tasks.filter(t => t.priority === 'CRITICAL').length,
    },
    {
      priority: 'HIGH',
      priorityLabel: 'HIGH (Юқори)',
      completed: tasks.filter(t => t.priority === 'HIGH' && t.status === 'COMPLETED').length,
      underReview: tasks.filter(t => t.priority === 'HIGH' && t.status === 'SUBMITTED_FOR_REVIEW').length,
      inProgress: tasks.filter(t => t.priority === 'HIGH' && t.status === 'IN_PROGRESS').length,
      overdue: tasks.filter(t => t.priority === 'HIGH' && t.status === 'OVERDUE').length,
      assigned: tasks.filter(t => t.priority === 'HIGH' && (t.status === 'ASSIGNED' || t.status === 'PENDING')).length,
      total: tasks.filter(t => t.priority === 'HIGH').length,
    },
    {
      priority: 'MEDIUM',
      priorityLabel: 'MEDIUM (Ўртача)',
      completed: tasks.filter(t => t.priority === 'MEDIUM' && t.status === 'COMPLETED').length,
      underReview: tasks.filter(t => t.priority === 'MEDIUM' && t.status === 'SUBMITTED_FOR_REVIEW').length,
      inProgress: tasks.filter(t => t.priority === 'MEDIUM' && t.status === 'IN_PROGRESS').length,
      overdue: tasks.filter(t => t.priority === 'MEDIUM' && t.status === 'OVERDUE').length,
      assigned: tasks.filter(t => t.priority === 'MEDIUM' && (t.status === 'ASSIGNED' || t.status === 'PENDING')).length,
      total: tasks.filter(t => t.priority === 'MEDIUM').length,
    },
    {
      priority: 'LOW',
      priorityLabel: 'LOW (Паст)',
      completed: tasks.filter(t => t.priority === 'LOW' && t.status === 'COMPLETED').length,
      underReview: tasks.filter(t => t.priority === 'LOW' && t.status === 'SUBMITTED_FOR_REVIEW').length,
      inProgress: tasks.filter(t => t.priority === 'LOW' && t.status === 'IN_PROGRESS').length,
      overdue: tasks.filter(t => t.priority === 'LOW' && t.status === 'OVERDUE').length,
      assigned: tasks.filter(t => t.priority === 'LOW' && (t.status === 'ASSIGNED' || t.status === 'PENDING')).length,
      total: tasks.filter(t => t.priority === 'LOW').length,
    },
  ];

  const CustomPriorityTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const totalInCat = payload.reduce((sum: number, entry: any) => sum + (Number(entry.value) || 0), 0);
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-2xl border border-slate-700 text-xs font-sans space-y-1.5 min-w-[210px] z-50">
          <div className="font-bold text-slate-100 border-b border-slate-700/80 pb-1 flex justify-between items-center">
            <span>{label} Тоифаси</span>
            <span className="font-mono text-slate-400 font-normal">Жами: {totalInCat} та</span>
          </div>
          <div className="space-y-1 font-mono text-[11px] pt-0.5">
            {payload.map((entry: any, index: number) => (
              <div key={`item-${index}`} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: entry.color }} />
                  <span>{entry.name}:</span>
                </span>
                <span className="font-bold text-white tabular-nums">{entry.value} та</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Breadcrumb & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>ToshTech Ректорати</span>
            <span aria-hidden="true">·</span>
            <span>2027 йил сентябрь ойига қадар</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">92 та Расмий Топшириқ</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            2027 йил сентябрь ойига қадар “ToshTech” ишлар РЕЖАСИ
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ўзбекистон Республикаси олий муҳандислик таълими трансформацияси ва ToshTech техника университетининг 8 та стратегик йўналиши
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href="/public/assets/aistudio/ToshTech_ish_reja_2026_2027___2__a172d162.pdf"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg shadow-xs transition-colors border border-transparent dark:border-slate-700"
            title="Расмий тасдиқланган PDF режа ҳужжатини очиш"
          >
            <FileText className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Асл PDF Режа (92 та топшириқ)</span>
          </a>

          <button
            onClick={() => exportTasksToExcel(tasks)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Excel (.xlsx) Экспорт</span>
          </button>

          <button
            onClick={() => openTma()}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-sky-400 dark:text-sky-200" />
            <span>Ходим TMA Мобили</span>
          </button>
        </div>
      </div>

      {/* Critical Path Red Flag Alert Banner if overdue tasks exist */}
      {overdueTasksCount > 0 && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-rose-900 dark:text-rose-200">
                Диққат: ToshTech иш режасида {overdueTasksCount} та кечиктирилган топшириқ мавжуд!
              </div>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5 leading-relaxed">
                Автоматлаштирилган Telegram эскалация тизими масъул ходимлар ва бўлим бошлиқларига Қизил Байроқ билдиришномасини юборган.
              </p>
            </div>
          </div>
          <button
            disabled={!canViewTasks}
            onClick={() => setActiveView('tasks')}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shrink-0 shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Кечикканларни Кўриш
          </button>
        </div>
      )}

      {/* Primary KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Macro Completion % */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Умумий Режа Бажарилиши</span>
            <TrendingUp className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
              {workPlanProgressPercent}%
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              ({completedTasks}/{totalTasks} топшириқ)
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
            <div 
              className="bg-slate-900 dark:bg-sky-500 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${workPlanProgressPercent}%` }} 
            />
          </div>
        </div>

        {/* Metric 2: In Progress */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Ижро Жараёнида</span>
            <Clock className="w-4 h-4 text-sky-500 dark:text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
              {inProgressTasks}
            </span>
            <span className="text-xs text-sky-700 dark:text-sky-300 font-medium">
              Фаол бажарилмоқда
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-3 flex items-center justify-between">
            <span>Telegram Clock-In</span>
            <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">8 та марказ ва бўлимлар</span>
          </div>
        </div>

        {/* Metric 3: Proofs Under Review */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Кўрик Кутилмоқда</span>
            <CheckCircle2 className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
              {pendingProofsCount}
            </span>
            <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
              Proof-of-Work
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-3 flex items-center justify-between">
            <button 
              disabled={!canViewProofs}
              onClick={() => setActiveView('proofs')}
              className="text-slate-900 dark:text-white font-semibold hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Текшириш консили</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
            <span className="font-mono text-slate-400 dark:text-slate-500">Тасдиқ талаб</span>
          </div>
        </div>

        {/* Metric 4: Overdue Tasks */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Муддати Ўтган</span>
            <AlertTriangle className="w-4 h-4 text-rose-500 dark:text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 font-mono tabular-nums">
              {overdueTasksCount}
            </span>
            <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
              Қизил байроқлар
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-3 flex items-center justify-between">
            <span>Эскалация даражаси</span>
            <span className="font-mono text-rose-600 dark:text-rose-400 font-semibold">Ректорат Назорати</span>
          </div>
        </div>
      </div>

      {/* RECHARTS PROGRESS VISUALIZATION: Priority-Based Completion Status */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-slate-800 dark:text-sky-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Муҳимлик Даражаси (Priority) Бўйича Режа Бажарилиши
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              CRITICAL, HIGH, MEDIUM ва LOW тоифасидаги 92 та режа топшириғининг ижро ҳолати (Recharts визуал таҳлили)
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              disabled={!canViewTasks}
              onClick={() => setActiveView('tasks')}
              className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Тоифалар бўйича реэстр</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Chart (7 cols): Recharts Stacked Bar Chart */}
          <div className="lg:col-span-7 h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart
                data={priorityChartData}
                margin={{ top: 20, right: 25, left: -15, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#f1f5f9'} vertical={false} />
                <XAxis 
                  dataKey="priority" 
                  tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#334155', fontWeight: 700 }}
                  axisLine={{ stroke: isDark ? '#475569' : '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }}
                  axisLine={{ stroke: isDark ? '#475569' : '#cbd5e1' }}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomPriorityTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: 12, fontSize: 11, color: isDark ? '#cbd5e1' : '#475569' }} 
                  iconSize={10}
                />
                <Bar dataKey="completed" name={localizeText('Бажарилди (Completed)')} stackId="status" fill="#10B981" />
                <Bar dataKey="underReview" name={localizeText('Кўрикда (Under Review)')} stackId="status" fill="#F59E0B" />
                <Bar dataKey="inProgress" name={localizeText('Жараёнда (In Progress)')} stackId="status" fill="#0284C7" />
                <Bar dataKey="overdue" name={localizeText('Муддати ўтган (Overdue)')} stackId="status" fill="#E11D48" />
                <Bar dataKey="assigned" name={localizeText('Бириктирилган (Assigned)')} stackId="status" fill={isDark ? '#64748b' : '#94A3B8'} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Right Metrics Grid (5 cols): Priority Cards with Completion Percentages */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            {priorityChartData.map((p) => {
              const compPercent = p.total > 0 ? Math.round(((p.completed + p.underReview * 0.8) / p.total) * 100) : 0;
              return (
                <div 
                  key={p.priority}
                  className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 rounded-xl space-y-2 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-mono text-xs font-bold ${
                      p.priority === 'CRITICAL' ? 'text-rose-600 dark:text-rose-400' :
                      p.priority === 'HIGH' ? 'text-amber-600 dark:text-amber-400' :
                      p.priority === 'MEDIUM' ? 'text-sky-700 dark:text-sky-400' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {p.priority}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                      {p.total} та
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    Ижро кўрсаткичи: <span className="font-bold font-mono text-slate-900 dark:text-white">{compPercent}%</span>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-1.5 rounded-full ${
                        p.priority === 'CRITICAL' ? 'bg-rose-500' :
                        p.priority === 'HIGH' ? 'bg-amber-500' :
                        p.priority === 'MEDIUM' ? 'bg-sky-500' : 'bg-slate-400 dark:bg-slate-500'
                      }`}
                      style={{ width: `${compPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono pt-1">
                    <span>{p.completed} бажарилди</span>
                    {p.overdue > 0 ? (
                      <span className="text-rose-600 dark:text-rose-400 font-bold">{p.overdue} кечиккан</span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">{p.inProgress} жараёнда</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Strategic 8 Sections of the Work Plan Breakdown */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-600 dark:text-sky-400" />
              <span>Иш Режасининг 8 та Стратегик Бўлими (2027 Сентябргача)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ҳар бир бўлим бўйича бириктирилган мақсадли вазифалар сони ва ижро даражаси
            </p>
          </div>
          <button
            disabled={!canViewTasks}
            onClick={() => setActiveView('tasks')}
            className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Барча 92 та топшириқни кўриш</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {OFFICIAL_SECTIONS.map((sec) => {
            const secTasks = tasks.filter(t => t.sectionId === sec.id);
            const avgProgress = secTasks.length > 0 
              ? Math.round(secTasks.reduce((acc, cur) => acc + cur.progressPercent, 0) / secTasks.length)
              : 0;

            return (
              <div 
                key={sec.id}
                onClick={canViewTasks ? () => setActiveView('tasks') : undefined}
                className={`p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-700/70 rounded-xl transition-all space-y-2 flex flex-col justify-between ${canViewTasks ? 'cursor-pointer' : ''}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      {sec.number}-Бўлим
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      {sec.taskCount} та вазифа
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 mt-1.5 leading-snug">
                    {sec.title}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/60">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    <span>Ўртача ижро:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{avgProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-slate-900 dark:bg-sky-500 h-1.5 rounded-full" 
                      style={{ width: `${avgProgress}%` }} 
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two-Column Section: Department Velocity & Critical Path Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Department Velocity Comparison */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Бўлимлар Бўйича 92 та Топшириқ Ижро Интизоми
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Масъул бўлинмалар ва мутасадди проректорлар кесимида
              </p>
            </div>
            <button
              disabled={!canViewTasks}
              onClick={() => setActiveView('tasks')}
              className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Режа реэстри</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Бўлим / Департамент</th>
                  <th className="py-2.5 px-3 text-center">Мутасадди</th>
                  <th className="py-2.5 px-3 text-center">Вазифалар</th>
                  <th className="py-2.5 px-3">Ижро Фоизи</th>
                  <th className="py-2.5 px-3 text-right">KPI Мақсад</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {departments.map((dept) => {
                  const deptTasks = tasks.filter(t => t.departmentId === dept.id);
                  const deptDone = deptTasks.filter(t => t.status === 'COMPLETED').length;
                  const deptAvgProgress = deptTasks.length > 0 
                    ? Math.round(deptTasks.reduce((acc, cur) => acc + cur.progressPercent, 0) / deptTasks.length)
                    : 0;

                  return (
                    <tr key={dept.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 dark:text-white">{dept.name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                          {dept.headName}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {dept.staffCount} ходим
                      </td>
                      <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-600 dark:text-slate-400">
                        {deptDone} / {deptTasks.length}
                      </td>
                      <td className="py-3 px-3 w-40">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-1.5 rounded-full ${
                                deptAvgProgress >= 60 ? 'bg-emerald-600' : deptAvgProgress >= 30 ? 'bg-sky-500' : 'bg-slate-400 dark:bg-slate-500'
                              }`}
                              style={{ width: `${deptAvgProgress}%` }} 
                            />
                          </div>
                          <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 w-8 text-right">
                            {deptAvgProgress}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                        {dept.targetKpiPercent}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (1/3): Critical Path Overdue & Urgent Action Feed */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Тезкор Назорат
              </h2>
              <span className="text-[11px] font-mono text-rose-600 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-transparent dark:border-rose-900/40">
                Критик Топшириқлар
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              2026 йил IV чорак ва 2027 йил I чорак учун белгиланган кечиктириб бўлмас чора-тадбирлар.
            </p>

            <div className="space-y-3">
              {overdueTasks.map((task) => (
                <div 
                  key={task.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                      {task.planCode}
                    </span>
                    <span className="text-[10px] font-mono text-rose-700 dark:text-rose-300 font-semibold bg-rose-100 dark:bg-rose-950/80 px-1.5 py-0.2 rounded border border-transparent dark:border-rose-900/50">
                      МУДДАТИ ЎТГАН
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 mb-1.5">
                    {task.title}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span>Масъул: {task.assignedToName}</span>
                    <span className="font-mono text-rose-600 dark:text-rose-400 font-medium">
                      Муддат: {task.deadline}
                    </span>
                  </div>
                </div>
              ))}

              {/* Tasks in review */}
              {tasks.filter(t => t.status === 'SUBMITTED_FOR_REVIEW').map((task) => (
                <div 
                  key={task.id}
                  className="p-3 bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                      {task.planCode}
                    </span>
                    <span className="text-[10px] font-mono text-amber-800 dark:text-amber-300 font-semibold bg-amber-100 dark:bg-amber-950/80 px-1.5 py-0.2 rounded border border-transparent dark:border-amber-800/40">
                      КЎРИКДА
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 mb-1.5">
                    {task.title}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-amber-200/50 dark:border-amber-900/40">
                    <span>Масъул: {task.assignedToName}</span>
                    <button
                      disabled={!canViewProofs}
                      onClick={() => setActiveView('proofs')}
                      className="text-amber-800 dark:text-amber-300 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>Кўриш</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              disabled={!canViewTasks}
              onClick={() => setActiveView('tasks')}
              className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors text-center border border-transparent dark:border-slate-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Барча 92 та Топшириқ Реэстрини Очиш
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
