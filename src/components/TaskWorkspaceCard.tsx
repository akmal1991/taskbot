import React from 'react';
import { ListTodo } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const TaskWorkspaceCard = () => {
  const { openTma } = useApp();
  return <section className="rounded-xl border border-slate-700/60 bg-gradient-to-br from-slate-900 to-slate-800 p-3 text-white shadow-xs">
    <h2 className="mb-2 flex items-center gap-2 text-xs font-semibold text-sky-400"><ListTodo className="h-4 w-4 shrink-0" />Topshiriq ish maydoni</h2>
    <p className="mb-3 text-[11px] leading-relaxed text-slate-300">Topshiriqlarni bajaring, ijro foizini yangilang va bajarilgan ish dalillarini yuklang.</p>
    <button type="button" onClick={() => openTma()} className="min-h-10 w-full rounded-lg bg-sky-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-400">Ish maydonini ochish</button>
  </section>;
};
