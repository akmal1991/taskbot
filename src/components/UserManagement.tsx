import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, UserRole } from '../types';
import { generateTelegramBindingCommand } from '../utils/telegramAuth';
import { 
  Users2, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Link, 
  ShieldCheck, 
  Copy, 
  X,
  ExternalLink,
  QrCode,
  Building
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { users, bindTelegramUser, currentUser } = useApp();

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [telegramIdInput, setTelegramIdInput] = useState('');
  const [telegramUsernameInput, setTelegramUsernameInput] = useState('');
  const [copiedToken, setCopiedToken] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const handleOpenBindingModal = (user: User) => {
    setSelectedUser(user);
    setTelegramIdInput(user.telegramId || '');
    setTelegramUsernameInput(user.telegramUsername || '');
    setCopiedToken(false);
  };

  const handleSaveBinding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !telegramIdInput.trim()) return;

    bindTelegramUser(
      selectedUser.id,
      telegramIdInput.trim(),
      telegramUsernameInput.trim().replace('@', '')
    );
    setSelectedUser(null);
  };

  const handleCopyCommand = async (command: string) => {
    setCopyError(false);
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(command);
      setCopiedToken(true);
    } catch {
      setCopiedToken(false);
      setCopyError(true);
    }
    window.setTimeout(() => {
      setCopiedToken(false);
      setCopyError(false);
    }, 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Xavfsizlik &amp; RBAC</span>
            <span aria-hidden="true">·</span>
            <span>Telegram ID Binding Management</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Foydalanuvchilar va Telegram ID Bog'lanish Reestri
          </h1>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>HMAC-SHA256 Xavfsizlik Himoyasi Faol</span>
        </div>
      </div>

      {/* Overview Metric Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Jami Xodimlar</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {users.length}
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Telegram Bog'langan</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            {users.filter(u => u.isTelegramBound).length}
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Bog'lanmagan (Kutilmoqda)</div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
            {users.filter(u => !u.isTelegramBound).length}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-4">F.I.SH &amp; Kontakt</th>
                <th className="py-2.5 px-4">Bo'lim</th>
                <th className="py-2.5 px-4">RBAC Roli</th>
                <th className="py-2.5 px-4">Telegram ID</th>
                <th className="py-2.5 px-4">Holat</th>
                <th className="py-2.5 px-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900 dark:text-white">{user.fullName}</div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{user.email} · {user.phone}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                    {user.departmentName || "Umumiy xizmat"}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded ${
                      user.role === 'DIRECTOR'
                        ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60'
                        : user.role === 'HEAD'
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60'
                          : user.role === 'ADMIN'
                            ? 'bg-slate-900 dark:bg-slate-700 text-white'
                            : user.role === 'WORKER'
                              ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {user.telegramId ? (
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{user.telegramId}</span>
                        {user.telegramUsername && (
                          <div translate="no" className="text-[11px] text-sky-600 dark:text-sky-400">@{user.telegramUsername}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 italic">Mavjud emas</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {user.isTelegramBound ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded font-semibold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        ULANGAN
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded font-semibold">
                        <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        KUTILMOQDA
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleOpenBindingModal(user)}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors"
                    >
                      {user.isTelegramBound ? "Tahrirlash" : "Bog'lash"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Binding Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Telegram ID ni Bog'lash
                </h3>
              </div>
              <button 
                onClick={() => setSelectedUser(null)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300">
              Xodim: <span className="font-bold text-slate-900 dark:text-white">{selectedUser.fullName}</span> ({selectedUser.roleLabel})
            </div>

            {/* Quick pairing bot command */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2 text-xs">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                1-usul: Bir martalik buyruq orqali avtomatik bog'lash
              </span>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
                Xodim o'z telefonidagi @UniTaskBot ga quyidagi buyruqni yuborishi kifoya:
              </p>
              <div className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-800 dark:text-slate-200">
                <span>{generateTelegramBindingCommand(selectedUser.id)}</span>
                <button
                  onClick={() => handleCopyCommand(generateTelegramBindingCommand(selectedUser.id))}
                  className="text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 flex items-center gap-1 font-sans text-xs font-semibold"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span aria-live="polite">
                    {copyError
                      ? "Nusxalash muvaffaqiyatsiz. Buyruqni qo'lda tanlab nusxalang."
                      : copiedToken
                        ? "Nusxalandi!"
                        : "Nusxalash"}
                  </span>
                </button>
              </div>
            </div>

            {/* Manual ID Input form */}
            <form onSubmit={handleSaveBinding} className="space-y-3 pt-1">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                2-usul: Telegram ID ni qo'lda kiritish
              </span>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Telegram Raqamli IDsi (Chat ID) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: 554198302"
                  value={telegramIdInput}
                  onChange={(e) => setTelegramIdInput(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg font-mono"
                />
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                  Xodim @UniTaskBot da /myid buyrug'ini yuborib o'z ID sini bilishi mumkin.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Telegram Username (ixtiyoriy)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500 text-xs">@</span>
                  <input
                    type="text"
                    placeholder="jasur_toshtech"
                    value={telegramUsernameInput}
                    onChange={(e) => setTelegramUsernameInput(e.target.value)}
                    className="w-full text-xs pl-7 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Bekor Qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                >
                  Bog'lashni Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
