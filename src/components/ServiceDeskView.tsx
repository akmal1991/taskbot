import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ServiceDeskTicket, Priority } from '../types';
import { 
  HelpCircle, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Send, 
  Building2, 
  X,
  MessageSquare,
  Search
} from 'lucide-react';

export const ServiceDeskView: React.FC = () => {
  const { tickets, departments, createTicket, resolveTicket, currentUser } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<ServiceDeskTicket | null>(null);
  const [responseNote, setResponseNote] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || '');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [applicantName, setApplicantName] = useState(currentUser.fullName);
  const [applicantEmail, setApplicantEmail] = useState(currentUser.email);
  const [applicantPhone, setApplicantPhone] = useState(currentUser.phone);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const dept = departments.find(d => d.id === departmentId) || departments[0];

    createTicket({
      title: title.trim(),
      description: description.trim(),
      departmentId: dept.id,
      departmentName: dept.name,
      applicantName,
      applicantEmail,
      applicantPhone,
      priority,
    });

    setIsModalOpen(false);
    setTitle('');
    setDescription('');
  };

  const handleResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !responseNote.trim()) return;
    resolveTicket(selectedTicket.id, responseNote.trim());
    setSelectedTicket(null);
    setResponseNote('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Yagona Darcha</span>
            <span aria-hidden="true">·</span>
            <span>ToshTech Service Desk</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Ichki Murojaatlar va Texnik So'rovlar (HelpDesk)
          </h1>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi Murojaat Yuborish</span>
        </button>
      </div>

      {/* Tickets List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tickets.map((ticket) => (
          <div 
            key={ticket.id} 
            className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  {ticket.ticketNumber}
                </span>
                <span className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded ${
                  ticket.status === 'RESOLVED' 
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60' 
                    : ticket.status === 'PROCESSING' 
                      ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60' 
                      : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                }`}>
                  {ticket.status}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                {ticket.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {ticket.description}
              </p>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <span>{ticket.departmentName}</span>
                </span>
                <span className="font-mono">{ticket.createdAt}</span>
              </div>

              {ticket.responseNote && (
                <div className="p-2.5 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/80 rounded-lg text-emerald-950 dark:text-emerald-200 text-xs">
                  <span className="font-bold text-[10px] uppercase tracking-wider block mb-0.5 text-emerald-800 dark:text-emerald-300">
                    Bo'lim Javobi:
                  </span>
                  {ticket.responseNote}
                </div>
              )}

              {ticket.status !== 'RESOLVED' && ['DIRECTOR', 'HEAD', 'ADMIN'].includes(currentUser.role) && (
                <button
                  onClick={() => setSelectedTicket(ticket)}
                  className="w-full mt-2 py-1.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors text-center"
                >
                  Javob Qaytarish / Hal Qilish
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* New Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Universitet Bo'limiga Murojaat Yuborish
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Qaysi bo'limga? *</label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id} className="dark:bg-slate-900">{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Murojaat Mavzusi *</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Auditoriyadagi proyektorni ta'mirlash so'rovi"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Batafsil Tafsilot *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Muammo yoki so'rov haqida to'liq ma'lumot..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Murojaatchi Ismi</label>
                  <input
                    type="text"
                    required
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Telefon Raqami</label>
                  <input
                    type="text"
                    required
                    value={applicantPhone}
                    onChange={(e) => setApplicantPhone(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Bekor Qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  Yuborish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Ticket Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Murojaatga Javob Berish: {selectedTicket.ticketNumber}
              </h3>
              <button 
                onClick={() => setSelectedTicket(null)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs bg-slate-50 dark:bg-slate-850 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="font-bold text-slate-900 dark:text-white mb-0.5">{selectedTicket.title}</div>
              <p className="text-slate-600 dark:text-slate-300">{selectedTicket.description}</p>
            </div>

            <form onSubmit={handleResolve} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ijro Xulosasi / Javob Matni *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Masalan: So'rov ko'rib chiqildi, mutaxassis borib uskunani tuzatdi..."
                  value={responseNote}
                  onChange={(e) => setResponseNote(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Bekor Qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  Hal Qilindi Deb Belgilash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
