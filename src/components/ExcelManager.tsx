import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { canApplyExcelImport, commitExcelImportIfValid, exportTasksToExcel, parseExcelWorkPlan, ImportReport, OFFICIAL_WORK_PLAN_COLUMNS } from '../utils/excel';
import { ExcelImportErrors } from './ExcelImportErrors';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  ArrowRight,
  RefreshCw,
  Info
} from 'lucide-react';
import { Task } from '../types';

export const ExcelManager: React.FC = () => {
  const { tasks, departments, users, importTasks } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [importReport, setImportReport] = useState<ImportReport | null>(null);
  const [previewTasks, setPreviewTasks] = useState<Partial<Task>[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isSuccessImported, setIsSuccessImported] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsLoading(true);
    setIsSuccessImported(false);
    setImportReport(null);
    setPreviewTasks([]);

    try {
      const buffer = await file.arrayBuffer();
      const report = await parseExcelWorkPlan(buffer, departments, users);
      setImportReport(report);
      setPreviewTasks(report.tasksPreview);
    } catch (err: any) {
      setImportReport({
        created: 0,
        updated: 0,
        skipped: 0,
        warnings: [],
        errors: [`Faylni o'qishda xatolik: ${err.message || String(err)}`],
        tasksPreview: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyImport = () => {
    if (!commitExcelImportIfValid(importReport, previewTasks, importTasks)) return;
    setIsSuccessImported(true);
    setPreviewTasks([]);
  };

  const handleLoadSampleBatch = () => {
    const sampleBatch: Partial<Task>[] = [
      {
        planCode: 'TT-2026-15',
        title: "ToshTech ilmiy jurnali (ToshTech Bulletin) uchun Scopus indeksatsiyasiga ariza berish",
        description: "Universitet xabarnomasini xalqaro Scopus CSAB komissiyasiga topshirish va xalqaro tahririyat hay'atini kengaytirish.",
        expectedOutcome: "CSAB komissiyasining ijobiy dastlabki xulosasi va 2027-yilda to'liq indeksatsiyaga erishish.",
        sourceReference: "Ilmiy kengash 2-sonli bayonnomasi",
        departmentId: 'dept-01',
        departmentName: "Ilmiy tadqiqotlar va innovatsiyalar bo'limi",
        assignedToId: 'user-05',
        assignedToName: 'Dilshod Karimov',
        priority: 'CRITICAL',
        deadline: '2026-11-28',
        progressPercent: 15,
        status: 'ASSIGNED',
      },
      {
        planCode: 'TT-2026-16',
        title: "ToshTech sun'iy intellekt va robototexnika o'quv laboratoriyasini jihozlash",
        description: "Yangi laboratoriya uchun 24 ta yuqori quvvatli GPU ishchi stansiyalari va 6 ta robotik manipulyatorlarni yetkazib berish.",
        expectedOutcome: "Laboratoriyaning to'liq tantanali ochilishi va 120 nafar talabaga amaliy mashg'ulotlar boshlanishi.",
        sourceReference: "Rektorat rejalashtirish qarori",
        departmentId: 'dept-03',
        departmentName: "Raqamli ta'lim texnologiyalari markazi (IT)",
        assignedToId: 'user-04',
        assignedToName: 'Jasur Rahimov',
        priority: 'HIGH',
        deadline: '2026-12-10',
        progressPercent: 20,
        status: 'ASSIGNED',
      },
      {
        planCode: 'TT-2026-17',
        title: "Kutubxonada elektron kitob ijarasi va QR-kod orqali kitob olish kiosklarini o'rnatish",
        description: "Avtomatlashtirilgan 2 ta RFID kiosk va talaba ID kartasi orqali kitoblarni berish modulini integratsiya qilish.",
        expectedOutcome: "Kitob berish navbatini 80% ga qisqartirish va to'liq raqamli monitoring.",
        sourceReference: "Kutubxona modernizatsiya dasturi",
        departmentId: 'dept-02',
        departmentName: "O'quv-uslubiy boshqarma",
        assignedToId: 'user-06',
        assignedToName: 'Malika Alimova',
        priority: 'MEDIUM',
        deadline: '2026-11-18',
        progressPercent: 10,
        status: 'ASSIGNED',
      }
    ];

    setPreviewTasks(sampleBatch);
    setFileName('ToshTech_ish_reja_2026_2027_qoshimcha.xlsx (Namunaviy)');
    setImportReport({
      created: 3,
      updated: 0,
      skipped: 0,
      warnings: ["Namunaviy paket yuklandi: 3 ta yangi yillik reja topshirig'i aniqlandi."],
      errors: [],
      tasksPreview: sampleBatch
    });
    setIsSuccessImported(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Admin Konsoli</span>
            <span aria-hidden="true">·</span>
            <span>Excel Ingestion Engine</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            ToshTech Yillik Ish Rejasini Excel (.xlsx) Bilan Boshqarish
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => exportTasksToExcel(tasks)}
            className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Hozirgi Rejani Yuklab Olish</span>
          </button>
        </div>
      </div>

      {/* Upload & Actions Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload Card */}
        <div className="md:col-span-2 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Excel Faylni Yuklash (Ingestion)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                `ToshTech_ish_reja_2026_2027_.xlsx` formatidagi fayllarni avtomatik o'qish va ma'lumotlar bazasiga kiritish.
              </p>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              accept=".xlsx,.xls" 
              onChange={handleFileUpload} 
              className="hidden" 
            />
          </div>

          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/70 rounded-xl p-8 text-center cursor-pointer transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-600 dark:text-slate-300">
              <Upload className="w-6 h-6 text-slate-600 dark:text-slate-300" />
            </div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {fileName ? fileName : "Faylni tanlash yoki shu yerga tashlash"}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Faqat .xlsx va .xls formatlar qo'llab-quvvatlanadi
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>Ustunlar: ID, Public Code, Title, Department, Responsible, Deadline, Priority</span>
            </span>

            <button
              onClick={handleLoadSampleBatch}
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 underline"
            >
              Namunaviy Paketni Sinash
            </button>
          </div>
        </div>

        {/* Structure Info Card */}
        <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Standart Ustunlar Sxemasi</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              ToshTech 2026–2027 расмий иш режа формати қуйидаги 13 та устундан иборат:
            </p>
            <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300 font-mono bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700 max-h-48 overflow-y-auto">
              {OFFICIAL_WORK_PLAN_COLUMNS.map((col, idx) => (
                <div key={col} className="truncate">
                  <span className="text-slate-400 dark:text-slate-500">{idx + 1}.</span> {col}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 mt-4">
            <button
              onClick={() => exportTasksToExcel(tasks.slice(0, 3), 'ToshTech_Shablon_Reja_2026.xlsx')}
              className="w-full py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg shadow-xs transition-colors text-center flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Bo'sh Shablonni Ko'chirib Olish</span>
            </button>
          </div>
        </div>
      </div>

      {/* Import Report & Preview */}
      {importReport && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {importReport.errors.length > 0
                ? <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                : <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {importReport.errors.length > 0
                  ? `Excel tahlilida ${importReport.errors.length} ta xato aniqlandi`
                  : `Excel Tahlil Xulosasi: ${importReport.created} ta yangi topshiriq aniqlandi`}
              </h3>
            </div>

            {canApplyExcelImport(importReport, previewTasks) && !isSuccessImported && (
              <button
                onClick={handleApplyImport}
                className="px-4 py-2 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-2"
              >
                <span>Bazaga Saqlash va Telegramga Yuborish</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <ExcelImportErrors errors={importReport.errors} />

          {isSuccessImported && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-900 dark:text-emerald-200 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Topshiriqlar muvaffaqiyatli import qilindi va mas'ul xodimlarning Telegramiga jo'natildi!</span>
            </div>
          )}

          {importReport.warnings.length > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Bildirishnomalar:</span>
              </div>
              {importReport.warnings.map((w, i) => (
                <div key={i} className="text-[11px] font-mono">{w}</div>
              ))}
            </div>
          )}

          {/* Preview Table */}
          {previewTasks.length > 0 && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-2 px-3">Kod</th>
                    <th className="py-2 px-3">Topshiriq Nomi</th>
                    <th className="py-2 px-3">Bo'lim</th>
                    <th className="py-2 px-3">Mas'ul Xodim</th>
                    <th className="py-2 px-3">Muhimlik</th>
                    <th className="py-2 px-3 text-right">Muddat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {previewTasks.map((t, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">{t.planCode}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">{t.title}</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{t.departmentName}</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{t.assignedToName}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-700 dark:text-slate-300">{t.priority}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">{t.deadline}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
