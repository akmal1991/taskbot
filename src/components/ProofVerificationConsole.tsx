import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Task, TaskProof } from '../types';
import { 
  FileCheck2, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Image as ImageIcon, 
  ExternalLink, 
  Clock, 
  Send, 
  MessageSquare,
  AlertCircle,
  FileCode,
  ShieldCheck
} from 'lucide-react';

export const ProofVerificationConsole: React.FC = () => {
  const { 
    tasks, 
    currentUser, 
    approveProof, 
    rejectProof, 
    pendingProofsCount 
  } = useApp();

  const [filterMode, setFilterMode] = useState<'PENDING' | 'HISTORY' | 'ALL'>('PENDING');
  const [selectedTaskId, setSelectedTaskId] = useState<string>(() => tasks.find(t => t.status === 'SUBMITTED_FOR_REVIEW')?.id || '');
  const selectedTask = tasks.find(task => task.id === selectedTaskId);
  const [reviewerRemarks, setReviewerRemarks] = useState('');
  const [feedbackError, setFeedbackError] = useState('');

  // Collect all tasks that have submitted proofs
  const tasksWithProofs = tasks.filter(t => {
    if (t.archivedAt || t.draft) return false;
    if (filterMode === 'PENDING') return t.status === 'SUBMITTED_FOR_REVIEW';
    if (filterMode === 'HISTORY') return t.proofs.some(p => p.status === 'APPROVED' || p.status === 'REJECTED');
    return t.proofs.length > 0;
  });

  const activeProof: TaskProof | undefined = selectedTask?.proofs[0];

  const handleApprove = async () => {
    if (!selectedTask || !activeProof) return;
    try { await approveProof(selectedTask.id, activeProof.id, reviewerRemarks.trim() || "Topshiriq mezonlarga muvofiq bajarildi deb qabul qilindi."); }
    catch (e) { setFeedbackError((e as Error).message); return; }
    setReviewerRemarks('');
    setFeedbackError('');
  };

  const handleReject = async () => {
    if (!selectedTask || !activeProof) return;
    if (!reviewerRemarks.trim()) {
      setFeedbackError("Qaytarish sababi va kamchiliklarni ko'rsatuvchi izoh kiritish majburiy!");
      return;
    }
    try { await rejectProof(selectedTask.id, activeProof.id, reviewerRemarks.trim()); }
    catch (e) { setFeedbackError((e as Error).message); return; }
    setReviewerRemarks('');
    setFeedbackError('');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Bo'lim Boshlig'i &amp; Rektorat</span>
            <span aria-hidden="true">·</span>
            <span>Proof-of-Work Verification Protocol</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Bajarganlik Isbotlarini Tekshirish va Qabul Qilish Konsoli
          </h1>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setFilterMode('PENDING')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              filterMode === 'PENDING' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Kutilayotganlar ({pendingProofsCount})
          </button>
          <button
            onClick={() => setFilterMode('HISTORY')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              filterMode === 'HISTORY' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tekshirilganlar Tarixi
          </button>
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              filterMode === 'ALL' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Barchasi
          </button>
        </div>
      </div>

      {/* Main Split Layout: Left Tasks Queue, Right Proof Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5/12): Queue of Submissions */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Tekshiruv Navbati</span>
            <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
              {tasksWithProofs.length} ta topshiriq
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[600px] overflow-y-auto">
            {tasksWithProofs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                Hozirda tekshirish uchun topshirilgan yangi isbotlar yo'q.
              </div>
            ) : (
              tasksWithProofs.map((task) => {
                const isSelected = selectedTask?.id === task.id;
                const latestProof = task.proofs[0];

                return (
                  <div
                    key={task.id}
                    onClick={() => {
                      setSelectedTaskId(task.id);
                      setReviewerRemarks('');
                      setFeedbackError('');
                    }}
                    className={`p-4 cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-slate-50 dark:bg-slate-800/80 border-l-3 border-slate-900 dark:border-indigo-500' 
                        : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        {task.planCode}
                      </span>
                      {task.status === 'SUBMITTED_FOR_REVIEW' ? (
                        <span className="text-[10px] font-mono text-amber-800 dark:text-amber-300 font-semibold bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 px-1.5 py-0.2 rounded">
                          KO'RIKDA
                        </span>
                      ) : task.status === 'COMPLETED' ? (
                        <span className="text-[10px] font-mono text-emerald-800 dark:text-emerald-300 font-semibold bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-1.5 py-0.2 rounded">
                          TASDIQLANGAN
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-red-800 dark:text-red-300 font-semibold bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-800/60 px-1.5 py-0.2 rounded">
                          QAYTARILGAN
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-1 mb-1">
                      {task.title}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Ijrochi: {task.assignedToName}</span>
                      <span className="font-mono text-slate-400 dark:text-slate-500">
                        {latestProof?.submittedAt.split(' ')[1] || task.deadline}
                      </span>
                    </div>

                    {latestProof && (
                      <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-2 rounded border border-slate-200/70 dark:border-slate-700 truncate flex items-center gap-1.5">
                        <FileCheck2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {latestProof.note || latestProof.fileName || latestProof.artifactUrl}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column (7/12): Detailed Proof Inspector & Decision Form */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-5">
          {selectedTask && activeProof ? (
            <>
              {/* Header Details */}
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {selectedTask.planCode}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Bo'lim: {selectedTask.departmentName}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                    Topshirildi: {activeProof.submittedAt}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {selectedTask.title}
                </h2>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Mas'ul: <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedTask.assignedToName}</span> ({selectedTask.assignedToTelegramUsername ? `@${selectedTask.assignedToTelegramUsername}` : 'Telegram ulangan'})
                </div>
              </div>

              {/* Expected vs Acceptance Criteria */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold block mb-1">
                    Kutilayotgan Natija (KPI)
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {selectedTask.expectedOutcome || "Reja talablariga mos natija"}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold block mb-1">
                    Qabul Qilish Mezonlari
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {selectedTask.acceptanceCriteria || "Hujjatli hisobot yoki dalolatnoma"}
                  </p>
                </div>
              </div>

              {/* Proof-of-Work Artifacts Box */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center justify-between">
                  <span>Taqdim Etilgan Isbot (Proof-of-Work)</span>
                  <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded">
                    ENFORCED PROTOCOL
                  </span>
                </div>

                {/* Narrative Summary with min 20 char counter display */}
                {activeProof.note && (
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                      <span className="font-medium">1. Xodimning Matnli Xulosasi:</span>
                      <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                        {activeProof.note.length} belgi (min. 20 talab)
                      </span>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans shadow-2xs">
                      {activeProof.note}
                    </div>
                  </div>
                )}

                {/* File / Document Attachment */}
                {activeProof.fileName && (
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block mb-1">
                      2. Biriktirilgan Hujjat / Fotosurat:
                    </span>
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
                        <div>
                          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            {activeProof.fileName}
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                            {activeProof.fileSize || '—'} · {activeProof.type}
                          </div>
                        </div>
                      </div>
                      {activeProof.fileUrl ? <a
                        href={activeProof.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                      >
                        Ko'rish
                      </a> : <span className="text-xs text-amber-700">Original file bytes are unavailable.</span>}
                    </div>
                  </div>
                )}

                {/* External URL */}
                {activeProof.artifactUrl && (
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block mb-1">
                      3. Tashqi Havola (GitHub / Cloud / Tizim):
                    </span>
                    <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs text-xs">
                      <span className="font-mono text-sky-600 dark:text-sky-400 truncate mr-2">
                        {activeProof.artifactUrl}
                      </span>
                      <a
                        href={activeProof.artifactUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold shrink-0"
                      >
                        <span>Ochish</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Status and Previous Decision Remarks if any */}
              {activeProof.status !== 'PENDING' && (
                <div className={`p-3.5 rounded-xl border text-xs ${
                  activeProof.status === 'APPROVED' 
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200' 
                    : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200'
                }`}>
                  <div className="font-bold mb-1 flex items-center gap-1.5">
                    {activeProof.status === 'APPROVED' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />}
                    <span>{activeProof.status === 'APPROVED' ? "Tasdiqlangan" : "Qaytarilgan"}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Izoh: "{activeProof.reviewerRemarks || 'Izohsiz'}"
                  </p>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1">
                    Tekshiruvchi: {activeProof.reviewedBy} ({activeProof.reviewedAt})
                  </div>
                </div>
              )}

              {/* Verification Action Form (only if pending or can re-review) */}
              {selectedTask.status === 'SUBMITTED_FOR_REVIEW' && selectedTask.assignedToId !== currentUser.id &&
                (currentUser.role === 'ADMIN' || !selectedTask.approverId || selectedTask.approverId === currentUser.id) && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Bo'lim Boshlig'i / Rektorat Xulosasi va Izohi:
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Masalan: Barcha talablar to'liq bajarildi. Ijroga qabul qilindi... (Qaytarishda sabab kiritish majburiydir)"
                      value={reviewerRemarks}
                      onChange={(e) => {
                        setReviewerRemarks(e.target.value);
                        if (feedbackError) setFeedbackError('');
                      }}
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                    {feedbackError && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{feedbackError}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleReject}
                      className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/50 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <span>Qaytarish va Qayta Ishlash Talab Qilish</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleApprove}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Tasdiqlash va Topshiriqni Yakunlash (COMPLETED)</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center text-xs text-slate-400 dark:text-slate-500">
              Chap tomondan tekshirish uchun topshiriqni tanlang.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
