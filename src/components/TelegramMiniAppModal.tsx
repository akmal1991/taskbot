import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Task, TaskProof, ProofType } from '../types';
import { authorizeTelegramAction, TelegramAction } from '../utils/telegramAuth';
import { 
  X, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Camera, 
  Link as LinkIcon, 
  ChevronRight, 
  Smartphone,
  ExternalLink,
  MessageCircle,
  ListTodo,
  UserCheck,
  ShieldAlert,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Bot
} from 'lucide-react';

export const TelegramMiniAppModal: React.FC = () => {
  const { 
    isTmaOpen, 
    closeTma, 
    currentUser, 
    tasks, 
    clockInTask, 
    submitProof, 
    approveProof, 
    rejectProof,
    activeTmaTaskId,
    notifications,
    triggerJobRun
  } = useApp();

  const [activeTab, setActiveTab] = useState<'TASKS' | 'PROOF' | 'APPROVALS' | 'BOT_CHAT'>('TASKS');
  const [selectedTaskId, setSelectedTaskId] = useState<string>(() => {
    return activeTmaTaskId || tasks[0]?.id || '';
  });
  const [filterPeriod, setFilterPeriod] = useState<'TODAY' | 'ACTIVE' | 'ALL'>('TODAY');
  const [telegramAuthStatus, setTelegramAuthStatus] = useState<'checking' | 'authorized' | 'unauthorized'>('checking');
  const [telegramAuthError, setTelegramAuthError] = useState('');

  // Proof form states
  const [proofType, setProofType] = useState<ProofType>('DOCUMENT');
  const [proofNote, setProofNote] = useState('');
  const [proofFileName, setProofFileName] = useState('hisobot_dalolatnoma.pdf');
  const [proofUrl, setProofUrl] = useState('');
  const [proofError, setProofError] = useState('');
  const [proofSuccess, setProofSuccess] = useState(false);

  // Bot chat simulator states
  const [botMessages, setBotMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string; time: string; buttons?: string[] }>>([
    {
      sender: 'bot',
      text: "👋 Assalomu alaykum! UniTask ToshTech avtomatlashtirilgan xizmatiga xush kelibsiz.\n\nSiz 2026–2027 yillik ish rejasidagi shaxsiy topshiriqlaringizni ko'rishingiz va isbot yuklashingiz mumkin.",
      time: '09:00',
      buttons: ['📋 Kunlik rejam', '⏱ Ishni boshlash', '🆔 Mening ID raqamim']
    },
    {
      sender: 'bot',
      text: "📋 09:00 Standup Xulosasi:\nBugun sizga 2 ta faol topshiriq biriktirilgan. Iltimos o'z vaqtida Clock-In qiling va isbotlarni topshiring.",
      time: '09:00',
      buttons: ['📱 Mini Appni ochish']
    }
  ]);
  const [botInput, setBotInput] = useState('');

  useEffect(() => {
    if (!isTmaOpen) return;

    let isCurrent = true;
    setTelegramAuthStatus('checking');
    setTelegramAuthError('');
    authorizeTelegramAction('SESSION_CHECK', '', currentUser.telegramId || '')
      .then(() => {
        if (isCurrent) setTelegramAuthStatus('authorized');
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        setTelegramAuthStatus('unauthorized');
        setTelegramAuthError(error instanceof Error ? error.message : 'Telegram sessiyasi tekshirilmadi.');
      });

    return () => {
      isCurrent = false;
    };
  }, [isTmaOpen, currentUser.telegramId]);

  const authorizeAction = async (action: TelegramAction, taskId: string): Promise<boolean> => {
    try {
      await authorizeTelegramAction(action, taskId, currentUser.telegramId || '');
      setTelegramAuthStatus('authorized');
      setTelegramAuthError('');
      return true;
    } catch (error) {
      setTelegramAuthStatus('unauthorized');
      setTelegramAuthError(error instanceof Error ? error.message : 'Telegram sessiyasi tekshirilmadi.');
      return false;
    }
  };

  useEffect(() => {
    if (activeTmaTaskId) {
      setSelectedTaskId(activeTmaTaskId);
      const target = tasks.find(t => t.id === activeTmaTaskId);
      if (target?.status === 'IN_PROGRESS' || target?.status === 'ASSIGNED') {
        setActiveTab('PROOF');
      } else {
        setActiveTab('TASKS');
      }
    }
  }, [activeTmaTaskId, tasks]);

  if (!isTmaOpen) return null;

  // Find user tasks (or all tasks for worker simulator)
  const workerTasks = tasks.filter(t => {
    if (currentUser.role === 'WORKER') {
      return t.assignedToId === currentUser.id || t.assignedToTelegramId === currentUser.telegramId;
    }
    return true; // For demonstration, Director or Head can see tasks
  });

  const activeTask = tasks.find(t => t.id === selectedTaskId) || workerTasks[0] || tasks[0];

  const handleClockIn = async (taskId: string) => {
    if (!(await authorizeAction('CLOCK_IN', taskId))) return;
    clockInTask(taskId);
    setBotMessages(prev => [
      ...prev,
      {
        sender: 'user',
        text: "⏱ Ishni boshlash (Clock In)",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      {
        sender: 'bot',
        text: `✅ Ish boshlanganligi qayd etildi! Topshiriq: ${activeTask.planCode}. Bajarib bo'lgach majburiy Proof-of-Work yuklang.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        buttons: ['📤 Isbot yuklash']
      }
    ]);
  };

  const handleProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProofError('');

    if (proofNote.trim().length < 20) {
      setProofError(`Matnli xulosa kamida 20 belgidan iborat bo'lishi shart! (Hozir: ${proofNote.trim().length} ta)`);
      return;
    }

    if (!(await authorizeAction('SUBMIT_PROOF', activeTask.id))) return;

    const success = submitProof(activeTask.id, {
      taskId: activeTask.id,
      type: proofType,
      fileName: proofFileName,
      fileSize: '2.4 MB',
      note: proofNote.trim(),
      artifactUrl: proofUrl.trim() || undefined,
      submittedBy: currentUser.fullName,
      submittedById: currentUser.id,
    });

    if (success) {
      setProofSuccess(true);
      setBotMessages(prev => [
        ...prev,
        {
          sender: 'user',
          text: `📤 Isbot yuklandi: ${activeTask.planCode} (${proofFileName})`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        {
          sender: 'bot',
          text: `📥 Topshiriq (${activeTask.planCode}) bo'yicha Proof-of-Work qabul qilindi va ko'rikka yuborildi. Rahbariyat tasdiqlashi bilan sizga xabar keladi.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setTimeout(() => {
        setProofSuccess(false);
        setActiveTab('TASKS');
      }, 1500);
    }
  };

  const handleProofReview = async (taskId: string, proofId: string, approve: boolean) => {
    const action = approve ? 'APPROVE_PROOF' : 'REJECT_PROOF';
    if (!(await authorizeAction(action, taskId))) return;
    if (approve) {
      approveProof(taskId, proofId, 'Telegram orqali tasdiqlandi.');
    } else {
      rejectProof(taskId, proofId, 'Telegram orqali qaytarildi: qayta ko‘rib chiqilsin.');
    }
  };

  const handleSendBotMessage = (textToSend?: string) => {
    const text = (textToSend || botInput).trim();
    if (!text) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setBotMessages(prev => [...prev, { sender: 'user', text, time }]);
    setBotInput('');

    // Bot response logic
    setTimeout(() => {
      let responseText = "Kechirasiz, buyruq tushunarsiz. Quyidagi menyudan foydalaning:";
      let buttons = ['📋 Kunlik rejam', '⏱ Ishni boshlash', '🆔 Mening ID raqamim'];

      if (text.includes('/start') || text.includes('boshlash')) {
        responseText = "Assalomu alaykum! UniTask Telegram boti ToshTech 2026–2027 ish rejasini avtomatlashtirish uchun xizmat qiladi.";
      } else if (text.includes('/myid') || text.includes('ID')) {
        responseText = `Sizning Telegram Chat ID raqamingiz: <code>${currentUser.telegramId || '554198302'}</code>\nUsername: @${currentUser.telegramUsername || 'jasur_toshtech'}\nF.I.SH: ${currentUser.fullName}`;
      } else if (text.includes('rejam') || text.includes('/tasks')) {
        responseText = `Sizda jami ${workerTasks.length} ta yillik ish reja topshirig'i mavjud:\n` + 
          workerTasks.slice(0, 3).map(t => `• <b>${t.planCode}</b>: ${t.title.slice(0, 35)}... (${t.status})`).join('\n');
        buttons = ['📱 Mini Appda ochish'];
      } else if (text.includes('Mini App') || text.includes('/app')) {
        responseText = "Telegram Mini App ochilmoqda...";
        setActiveTab('TASKS');
      }

      setBotMessages(prev => [...prev, { sender: 'bot', text: responseText, time, buttons }]);
    }, 600);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      {/* Smartphone Device Frame Simulator */}
      <div className="relative w-full max-w-[390px] h-[780px] bg-slate-900 rounded-[48px] p-3 shadow-2xl border-4 border-slate-700/60 flex flex-col justify-between shrink-0">
        {/* Dynamic Island / Speaker notch */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-4.5 bg-black rounded-full z-40 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-800/80 mr-3" />
          <div className="w-2 h-2 rounded-full bg-slate-900 border border-slate-700" />
        </div>

        {/* Telegram App Container */}
        <div className="w-full h-full bg-[#18222d] text-white rounded-[38px] flex flex-col overflow-hidden relative font-sans">
          {/* Top Telegram Header Bar */}
          <div className="pt-6 pb-2.5 px-4 bg-[#212d3b] border-b border-slate-700/50 flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center gap-2">
              <button 
                onClick={closeTma}
                className="text-sky-400 hover:text-sky-300 text-xs font-semibold flex items-center gap-0.5"
              >
                <span>Yopish</span>
              </button>
            </div>

            <div className="text-center">
              <div className="text-xs font-bold text-white flex items-center justify-center gap-1">
                <span>UniTask Bot</span>
                <span className="w-3 h-3 bg-sky-500 rounded-full inline-flex items-center justify-center text-[8px] font-bold text-white">✓</span>
              </div>
              <div className="text-[10px] text-slate-400">
                mini app · ToshTech
              </div>
            </div>

            <div className="w-10 flex justify-end text-slate-400 text-xs">
              •••
            </div>
          </div>

          {/* User Micro Ribbon inside TMA */}
          <div className="px-3.5 py-1.5 bg-[#17212b] border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-300 shrink-0">
            <div className="flex items-center gap-1.5 truncate">
              <div className="w-4 h-4 rounded-full bg-sky-600 text-[9px] font-bold flex items-center justify-center">
                {currentUser.fullName[0]}
              </div>
              <span className="truncate font-medium">{currentUser.fullName}</span>
            </div>
            <span className="font-mono text-[10px] text-sky-400 shrink-0">
              @{currentUser.telegramUsername || 'worker'}
            </span>
          </div>

          {/* Mini App Body Viewport */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#0e1621]">
            {telegramAuthStatus !== 'authorized' && (
              <div
                role="alert"
                className="rounded-xl border border-amber-700/70 bg-amber-950/70 px-3 py-2 text-[11px] text-amber-200"
              >
                <div className="font-bold">
                  {telegramAuthStatus === 'checking' ? 'Telegram sessiyasi tekshirilmoqda…' : 'Telegram tasdiqlashi talab qilinadi'}
                </div>
                {telegramAuthError && <div className="mt-1">{telegramAuthError}</div>}
                {telegramAuthStatus === 'unauthorized' && (
                  <div className="mt-1">Topshiriq amallari faqat haqiqiy Telegram Mini App sessiyasi bilan ishlaydi.</div>
                )}
              </div>
            )}

            {/* VIEW 1: MY TASKS */}
            {activeTab === 'TASKS' && (
              <div className="space-y-3">
                {/* Greeting & Date Header */}
                <div className="bg-[#17212b] p-3 rounded-2xl border border-slate-800">
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                    ToshTech 2026–2027 Ишлар Режаси
                  </div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    92 та Расмий Топшириқ
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-300 font-mono">
                    <span>Сизга тегишли:</span>
                    <span className="font-bold text-sky-400">{workerTasks.length} та вазифа</span>
                  </div>
                </div>

                {/* Search input in TMA */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Топшириқ қидириш (Т/р, номи)..."
                    value={botInput.startsWith('/') ? '' : botInput}
                    onChange={(e) => setBotInput(e.target.value)}
                    className="w-full bg-[#17212b] border border-slate-800 text-[11px] px-3 py-1.5 rounded-xl text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                {/* Filter segments */}
                <div className="flex items-center gap-1 bg-[#17212b] p-1 rounded-xl">
                  <button
                    onClick={() => setFilterPeriod('TODAY')}
                    className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                      filterPeriod === 'TODAY' ? 'bg-[#2b5278] text-white' : 'text-slate-400'
                    }`}
                  >
                    Биринчи 15 та
                  </button>
                  <button
                    onClick={() => setFilterPeriod('ACTIVE')}
                    className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                      filterPeriod === 'ACTIVE' ? 'bg-[#2b5278] text-white' : 'text-slate-400'
                    }`}
                  >
                    Жараёнда
                  </button>
                  <button
                    onClick={() => setFilterPeriod('ALL')}
                    className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                      filterPeriod === 'ALL' ? 'bg-[#2b5278] text-white' : 'text-slate-400'
                    }`}
                  >
                    Барча 92 та
                  </button>
                </div>

                {/* Task Cards List */}
                <div className="space-y-2.5">
                  {workerTasks.map((task) => (
                    <div 
                      key={task.id}
                      className="bg-[#17212b] border border-slate-800/80 rounded-2xl p-3.5 space-y-2.5 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-sky-400">
                          {task.planCode}
                        </span>
                        <span className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                          task.status === 'COMPLETED'
                            ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50'
                            : task.status === 'SUBMITTED_FOR_REVIEW'
                              ? 'bg-amber-900/40 text-amber-300 border border-amber-700/50'
                              : task.status === 'OVERDUE'
                                ? 'bg-rose-900/40 text-rose-300 border border-rose-700/50'
                                : 'bg-slate-800 text-slate-300'
                        }`}>
                          {task.status}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-white leading-snug">
                        {task.title}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                        <span>Muddat: {task.deadline}</span>
                        <span className="font-mono text-amber-400 font-semibold">{task.priority}</span>
                      </div>

                      {/* Action buttons inside Card */}
                      <div className="pt-1 flex items-center gap-2">
                        {task.status === 'ASSIGNED' || task.status === 'PENDING' ? (
                          <button
                            onClick={() => handleClockIn(task.id)}
                            disabled={telegramAuthStatus !== 'authorized'}
                            className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Ishni boshlash (Clock In)</span>
                          </button>
                        ) : task.status === 'IN_PROGRESS' || task.status === 'OVERDUE' ? (
                          <button
                            onClick={() => {
                              setSelectedTaskId(task.id);
                              setActiveTab('PROOF');
                            }}
                            className="w-full py-2 px-3 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Proof-of-Work topshirish</span>
                          </button>
                        ) : task.status === 'SUBMITTED_FOR_REVIEW' ? (
                          <div className="w-full py-1.5 text-center text-[11px] text-amber-300 bg-amber-950/40 rounded-lg border border-amber-800/40 font-medium">
                            Kutilmoqda: Rahbariyat ko'rigida
                          </div>
                        ) : (
                          <div className="w-full py-1.5 text-center text-[11px] text-emerald-400 bg-emerald-950/40 rounded-lg border border-emerald-800/40 font-medium">
                            ✓ Tasdiqlangan va yakunlangan
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 2: SUBMIT PROOF-OF-WORK */}
            {activeTab === 'PROOF' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <button 
                    onClick={() => setActiveTab('TASKS')}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="text-xs font-bold text-white">
                    Proof-of-Work Yuklash: {activeTask.planCode}
                  </div>
                </div>

                <div className="bg-[#17212b] p-3 rounded-2xl border border-slate-800 text-xs">
                  <div className="font-semibold text-white mb-1">{activeTask.title}</div>
                  <div className="text-[11px] text-slate-400">
                    Mas'ul: {activeTask.assignedToName} · Muddat: {activeTask.deadline}
                  </div>
                </div>

                {proofSuccess ? (
                  <div className="p-6 bg-emerald-950/40 border border-emerald-700/60 rounded-2xl text-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                    <div className="text-sm font-bold text-white">Isbot Muvaffaqiyatli Yuklandi!</div>
                    <p className="text-xs text-emerald-300">
                      Topshiriq ko'rik holatiga o'tkazildi. Bo'lim boshlig'iga Telegram orqali xabar yuborildi.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleProofSubmit} className="space-y-3 text-xs">
                    {/* Proof Type Picker */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Isbot Turi *
                      </label>
                      <div className="grid grid-cols-3 gap-1.5 bg-[#17212b] p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setProofType('DOCUMENT')}
                          className={`py-1.5 text-[10px] font-semibold rounded-lg ${
                            proofType === 'DOCUMENT' ? 'bg-[#2b5278] text-white' : 'text-slate-400'
                          }`}
                        >
                          Hujjat / PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => setProofType('IMAGE')}
                          className={`py-1.5 text-[10px] font-semibold rounded-lg ${
                            proofType === 'IMAGE' ? 'bg-[#2b5278] text-white' : 'text-slate-400'
                          }`}
                        >
                          Fotosurat
                        </button>
                        <button
                          type="button"
                          onClick={() => setProofType('URL')}
                          className={`py-1.5 text-[10px] font-semibold rounded-lg ${
                            proofType === 'URL' ? 'bg-[#2b5278] text-white' : 'text-slate-400'
                          }`}
                        >
                          Havola
                        </button>
                      </div>
                    </div>

                    {/* File Attachment simulated */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Fayl Biriktirish *
                      </label>
                      <div className="p-3 bg-[#17212b] border border-slate-800 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate">
                          <Camera className="w-4 h-4 text-sky-400 shrink-0" />
                          <span className="font-mono text-[11px] text-slate-200 truncate">
                            {proofFileName}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setProofFileName(`hisobot_${Date.now().toString().slice(-4)}.pdf`)}
                          className="text-[10px] text-sky-400 font-semibold underline"
                        >
                          Almashtirish
                        </button>
                      </div>
                    </div>

                    {/* Written Summary narrative (min 20 chars counter) */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <label className="font-semibold text-slate-400">
                          Bajarilgan Ish Xulosasi (Narrative) *
                        </label>
                        <span className={`font-mono text-[10px] ${
                          proofNote.trim().length >= 20 ? 'text-emerald-400 font-bold' : 'text-amber-400'
                        }`}>
                          {proofNote.trim().length} / 20 belgi
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        required
                        placeholder="Topshiriq yuzasidan amalga oshirilgan ishlarni qisqacha bayon qiling (kamida 20 ta belgi)..."
                        value={proofNote}
                        onChange={(e) => setProofNote(e.target.value)}
                        className="w-full text-xs p-2.5 bg-[#17212b] border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    {/* External Artifact URL */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Tashqi Havola (Google Drive / GitHub / Server)
                      </label>
                      <input
                        type="url"
                        placeholder="https://drive.google.com/... yoki https://github.com/..."
                        value={proofUrl}
                        onChange={(e) => setProofUrl(e.target.value)}
                        className="w-full text-xs p-2 bg-[#17212b] border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none font-mono"
                      />
                    </div>

                    {proofError && (
                      <div className="p-2.5 bg-rose-950/60 border border-rose-800 rounded-xl text-[11px] text-rose-300 font-medium">
                        {proofError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={telegramAuthStatus !== 'authorized'}
                      className="w-full py-2.5 px-4 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Ko'rikka Topshirish (SUBMIT)</span>
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* VIEW 3: HEAD TELEGRAM APPROVALS */}
            {activeTab === 'APPROVALS' && (
              <div className="space-y-3">
                <div className="bg-[#17212b] p-3 rounded-2xl border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase">
                    Rahbariyat Tezkor Tasdig'i
                  </div>
                  <div className="text-xs text-slate-300 mt-1">
                    Bo'lim xodimlari tomonidan taqdim etilgan isbotlarni to'g'ridan-to'g'ri Telegramdan tasdiqlang.
                  </div>
                </div>

                <div className="space-y-2.5">
                  {tasks.filter(t => t.status === 'SUBMITTED_FOR_REVIEW').length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Hozirda tasdiqlash uchun navbatda isbotlar yo'q.
                    </div>
                  ) : (
                    tasks.filter(t => t.status === 'SUBMITTED_FOR_REVIEW').map((t) => (
                      <div key={t.id} className="bg-[#17212b] p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
                        <div className="flex items-center justify-between font-mono text-[11px]">
                          <span className="font-bold text-sky-400">{t.planCode}</span>
                          <span className="text-amber-400 font-semibold">KO'RIKDA</span>
                        </div>
                        <div className="font-semibold text-white">{t.title}</div>
                        <div className="text-[11px] text-slate-400">Xodim: {t.assignedToName}</div>

                        {t.proofs[0] && (
                          <div className="p-2 bg-[#0e1621] rounded-xl text-[11px] text-slate-300 italic border border-slate-800">
                            "{t.proofs[0].note || t.proofs[0].fileName}"
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            disabled={telegramAuthStatus !== 'authorized'}
                            onClick={() => void handleProofReview(t.id, t.proofs[0]?.id || '', false)}
                            className="py-1.5 px-3 bg-rose-950/60 hover:bg-rose-900/60 disabled:opacity-50 disabled:cursor-not-allowed border border-rose-800 text-rose-300 font-bold rounded-xl text-[11px]"
                          >
                            ↩️ Qaytarish
                          </button>
                          <button
                            disabled={telegramAuthStatus !== 'authorized'}
                            onClick={() => void handleProofReview(t.id, t.proofs[0]?.id || '', true)}
                            className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-[11px]"
                          >
                            ✅ Tasdiqlash
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* VIEW 4: TELEGRAM BOT CHAT SIMULATOR */}
            {activeTab === 'BOT_CHAT' && (
              <div className="flex flex-col h-full justify-between space-y-2 text-xs">
                {/* Chat Stream */}
                <div className="space-y-2.5 overflow-y-auto max-h-[480px] pr-1">
                  {botMessages.map((msg, i) => (
                    <div 
                      key={i} 
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-[#2b5278] text-white rounded-br-xs'
                          : 'bg-[#182533] text-slate-200 rounded-bl-xs border border-slate-700/50'
                      }`}>
                        <div className="text-[11px] whitespace-pre-line" dangerouslySetInnerHTML={{ __html: msg.text }} />
                        <div className="text-[9px] text-slate-400 text-right mt-1 font-mono">
                          {msg.time}
                        </div>
                      </div>

                      {/* Bot Inline Buttons */}
                      {msg.buttons && (
                        <div className="mt-1 flex flex-wrap gap-1 max-w-[85%]">
                          {msg.buttons.map((btn, bIdx) => (
                            <button
                              key={bIdx}
                              onClick={() => handleSendBotMessage(btn)}
                              className="px-2.5 py-1 bg-[#243447] hover:bg-[#2b5278] text-[10px] text-sky-300 font-semibold rounded-lg border border-slate-700/60 transition-colors"
                            >
                              {btn}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Chat Input Bar */}
                <div className="pt-2 border-t border-slate-800 flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Buyruq yoki xabar yozing..."
                    value={botInput}
                    onChange={(e) => setBotInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendBotMessage()}
                    className="flex-1 bg-[#17212b] border border-slate-800 text-xs px-3 py-2 rounded-xl text-white placeholder-slate-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleSendBotMessage()}
                    className="p-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Fixed Navigation Bar (conforming to references/10_mobile_touch_apps.md) */}
          <div className="h-14 bg-[#212d3b] border-t border-slate-800 px-2 grid grid-cols-4 items-center shrink-0">
            <button
              onClick={() => setActiveTab('TASKS')}
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                activeTab === 'TASKS' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListTodo className="w-4 h-4" />
              <span className="text-[10px] tracking-tight mt-0.5">Topshiriq</span>
            </button>

            <button
              onClick={() => setActiveTab('PROOF')}
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                activeTab === 'PROOF' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="text-[10px] tracking-tight mt-0.5">Isbot (PoW)</span>
            </button>

            <button
              onClick={() => setActiveTab('APPROVALS')}
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                activeTab === 'APPROVALS' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span className="text-[10px] tracking-tight mt-0.5">Tasdiq</span>
            </button>

            <button
              onClick={() => setActiveTab('BOT_CHAT')}
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                activeTab === 'BOT_CHAT' ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span className="text-[10px] tracking-tight mt-0.5">Bot Chat</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
