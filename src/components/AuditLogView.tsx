import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { History, Search, ShieldCheck, Download } from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const { auditLogs } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.targetId && log.targetId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesAction = selectedAction === 'all' || log.action === selectedAction;
    return matchesSearch && matchesAction;
  });

  const uniqueActions = Array.from(new Set(auditLogs.map(l => l.action)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Tizim Xavfsizligi</span>
            <span aria-hidden="true">·</span>
            <span>Prisma AuditLog Storage</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Tizim Audit va Xavfsizlik Jurnali
          </h1>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>O'zgartirib bo'lmas yozuvlar (Immutable Log)</span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Amal, mas'ul shaxs yoki topshiriq kodi bo'yicha qidiruv..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>

        <div className="w-full sm:w-56 shrink-0">
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="all" className="dark:bg-slate-900">Barcha amallar</option>
            {uniqueActions.map(action => (
              <option key={action} value={action} className="dark:bg-slate-900">{action}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-4 w-44">Vaqt &amp; IP</th>
                <th className="py-2.5 px-4 w-48">Amal (Action)</th>
                <th className="py-2.5 px-4 w-44">Ijrochi (Actor)</th>
                <th className="py-2.5 px-4 w-32">Obyekt</th>
                <th className="py-2.5 px-4">Tafsilotlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">
                    <div>{log.createdAt}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">{log.ipAddress}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-[10px] font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900 dark:text-white">{log.actorName}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{log.actorRole}</div>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {log.targetId || "—"}
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300 leading-relaxed">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
