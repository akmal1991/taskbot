import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Timer, 
  Play, 
  CheckCircle2, 
  Clock, 
  Send, 
  AlertTriangle, 
  RefreshCw, 
  Cpu, 
  Database,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

export const SchedulerQueueConsole: React.FC = () => {
  const { queueJobs, triggerJobRun, notifications, tasks } = useApp();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Orkestratsiya Dvigateli</span>
            <span aria-hidden="true">·</span>
            <span>Redis + Queue Worker Engine</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Avtomatlashtirilgan Telegram Bildirishnoma va Scheduler Navbati
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold rounded-lg font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>REDIS / QUEUE: ONLINE</span>
          </div>
        </div>
      </div>

      {/* Engine Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Faol Dvigatel</span>
            <Cpu className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">
            UniTask Scheduler v2.6
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Node.js / Express Workers
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Rejalashtirilgan Jarayonlar</span>
            <Timer className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {queueJobs.length} ta vazifa
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Cron + Event Triggered
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Yuborilgan Telegram Xabarlari</span>
            <Send className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {notifications.length} ta signal
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
            Yetkazish darajasi: 100%
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Redis Kesh Holati</span>
            <Database className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">
            Memory: 4.8 MB
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            0 ta muvaffaqiyatsiz navbat
          </div>
        </div>
      </div>

      {/* Queue Jobs Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Avtomatik Fon Jarayonlari (Background Cron Jobs)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Har bir jarayon ToshTech yillik ish rejasidagi vazifalar muddatini tekshiradi va Telegramga avtomatik signal yuboradi.
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {queueJobs.map((job) => (
            <div key={job.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">{job.name}</span>
                  <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    Queue: {job.queue}
                  </span>
                  <span className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded ${
                    job.status === 'ACTIVE' 
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>
                    {job.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {job.payloadSummary}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 font-mono pt-0.5">
                  <span>Jadval: {job.scheduledTime}</span>
                  <span aria-hidden="true">·</span>
                  <span>Oxirgi ishga tushishi: {job.lastRun || 'Bajarilmoqda'}</span>
                </div>
              </div>

              <div className="shrink-0">
                <button
                  onClick={() => triggerJobRun(job.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Qo'lda Ishga Tushirish</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Telegram Outbox Pipeline Feed */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Telegram Xabarlar Trassasi (Outbox Stream)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ToshTech xodimlariga Telegram orqali yuborilgan jonli ogohlantirishlar va inline tugmali signallar
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
            Jami: {notifications.length} ta
          </span>
        </div>

        <div className="space-y-3">
          {notifications.map((notif) => (
            <div 
              key={notif.id}
              className={`p-4 rounded-xl border text-xs space-y-2 ${
                notif.type === 'OVERDUE_ALERT'
                  ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-950 dark:text-rose-200'
                  : notif.type === 'PROOF_REVIEW_REQUEST'
                    ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-950 dark:text-amber-200'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5">
                  <span>{notif.title}</span>
                </span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  {notif.sentAt} · ID: {notif.telegramId} ({notif.recipientName})
                </span>
              </div>

              <p className="leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-slate-900/80 p-3 rounded-lg border border-slate-200/60 dark:border-slate-700 font-sans">
                {notif.messageText}
              </p>

              {notif.inlineButtons && notif.inlineButtons.length > 0 && (
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Inline Action Buttons:
                  </span>
                  {notif.inlineButtons.map((btn, idx) => (
                    <span 
                      key={idx}
                      className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-semibold text-slate-700 dark:text-slate-300 shadow-2xs"
                    >
                      {btn.text}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
