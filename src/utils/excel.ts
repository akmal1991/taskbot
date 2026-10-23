import * as XLSX from 'xlsx';
import { Task, Department, User } from '../types';

export interface ImportReport {
  created: number;
  updated: number;
  skipped: number;
  warnings: string[];
  errors: string[];
  tasksPreview: Partial<Task>[];
}

export function canApplyExcelImport(report: ImportReport | null, previewTasks: Partial<Task>[]): boolean {
  return Boolean(report && report.errors.length === 0 && previewTasks.length > 0);
}

export async function commitExcelImportIfValid(
  report: ImportReport | null,
  previewTasks: Partial<Task>[],
  commitTasks: (tasks: Partial<Task>[]) => void | Promise<void>
): Promise<boolean> {
  if (!canApplyExcelImport(report, previewTasks)) return false;
  await commitTasks(previewTasks);
  return true;
}

export function parseExcelWorkbook(
  workbook: XLSX.WorkBook,
  departments: Department[],
  users: User[]
): ImportReport {
  const report: ImportReport = {
    created: 0,
    updated: 0,
    skipped: 0,
    warnings: [],
    errors: [],
    tasksPreview: []
  };

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    report.errors.push("Excel faylda birorta ham varaq (sheet) topilmadi.");
    return report;
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
  if (rawRows.length === 0) {
    report.errors.push("Excel fayl bo'sh. Qatorlar topilmadi.");
    return report;
  }

  if (rawRows.length > 2000) {
    report.errors.push('Import files must contain no more than 2,000 rows.');
    return report;
  }
  const taskNumbers = new Set<string>();
  let rowIndex = 2;
  for (const row of rawRows) {
    const title = row["Иш режа номи"] || row["Title"] || row["title"] || row["Sarlavha"] || row["Topshiriq nomi"] || row["Nomi"];
    if (!title || String(title).trim() === '') {
      report.skipped++;
      report.errors.push(`Qator ${rowIndex}: Topshiriq nomi bo'sh. Ushbu faylni tuzatib qayta yuklang.`);
      rowIndex++;
      continue;
    }

    const itemNum = Number(row["Т/р"] || row["Number"]);
    const explicitCode = String(row["Plan Code"] || row["planCode"] || '').trim();
    if (!explicitCode && (!Number.isInteger(itemNum) || itemNum <= 0)) {
      report.errors.push(`Qator ${rowIndex}: Topshiriq raqami majburiy va musbat butun son bo'lishi kerak.`);
      report.skipped++; rowIndex++; continue;
    }
    const publicCode = explicitCode || `TT-2026-${String(itemNum).padStart(2, '0')}`;
    if (taskNumbers.has(publicCode)) {
      report.errors.push(`Qator ${rowIndex}: Takroriy topshiriq raqami: ${publicCode}.`);
      report.skipped++; rowIndex++; continue;
    }
    taskNumbers.add(publicCode);
    const description = row["Амалга ошириш механизми"] || row["Description"] || row["Tavsif"] || "";
    const funding = row["Молиялаштириш манбалари"] || row["Funding"] || "Университет маблағлари";
    const approver = String(row["Назорат (Проректор)"] || row["Назорат"] || row["Approver"] || '').trim();
    const sectionTitle = row["Бўлим (Йўналиш)"] || row["Бўлим"] || "Умумий йўналиш";

    const deptNameRaw = row["Масъул бўлим"] || row["Department"] || row["Bo'lim"] || "";
    const normalizedDepartmentName = String(deptNameRaw).toLowerCase().trim();
    const deptMatches = departments.filter(d => [d.name, d.id, d.code].some(v => v.toLowerCase().trim() === normalizedDepartmentName));
    const dept = deptMatches.length === 1 ? deptMatches[0] : undefined;

    const workerNameRaw = row["Ижро учун масъул"] || row["Primary Responsible (full name)"] || row["Xodim"] || "";
    const normalizedWorkerName = String(workerNameRaw).toLowerCase().trim();
    const workerMatches = users.filter(u => [u.fullName, u.id, u.email, u.username || ''].some(v => v && v.toLowerCase().trim() === normalizedWorkerName));
    const worker = workerMatches.length === 1 ? workerMatches[0] : undefined;

    const priorityRaw = String(row["Муҳимлик даражаси"] || row["Priority"] || '').toUpperCase().trim();
    const priorityAliases: Record<string, Task['priority']> = { CRITICAL: 'CRITICAL', JUDAYUQORI: 'CRITICAL', HIGH: 'HIGH', YUQORI: 'HIGH', MEDIUM: 'MEDIUM', "O'RTACHA": 'MEDIUM', LOW: 'LOW', PAST: 'LOW' };
    const priority = priorityAliases[priorityRaw];
    if (!priority) {
      report.errors.push(`Qator ${rowIndex}: Muhimlik darajasi noto'g'ri: ${priorityRaw || '—'}.`);
      report.skipped++; rowIndex++; continue;
    }

    let deadlineStr = '';
    const deadlineRaw = row["Бажариш муддати"] || row["Deadline"] || row["Muddat"];
    if (deadlineRaw) {
      if (typeof deadlineRaw === 'number') {
        if (!Number.isFinite(deadlineRaw) || deadlineRaw < 1) {
          report.errors.push(`Qator ${rowIndex}: Bajarish muddati noto'g'ri Excel sanasi.`);
          report.skipped++;
          rowIndex++;
          continue;
        }
        const parsed = new Date((Math.floor(deadlineRaw) - 25569) * 86400 * 1000);
        if (Number.isNaN(parsed.getTime())) {
          report.errors.push(`Qator ${rowIndex}: Bajarish muddatini sana sifatida o'qib bo'lmadi.`);
          report.skipped++;
          rowIndex++;
          continue;
        }
        deadlineStr = parsed.toISOString().split('T')[0];
      } else if (typeof deadlineRaw === 'string') {
        deadlineStr = deadlineRaw.trim();
      }
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(deadlineStr) || !Number.isFinite(Date.parse(deadlineStr)) || new Date(deadlineStr).toISOString().slice(0,10) !== deadlineStr) {
      report.errors.push(`Qator ${rowIndex}: Bajarish muddati YYYY-MM-DD formatida bo'lishi shart.`);
      report.skipped++; rowIndex++; continue;
    }
    const rawProgress = row["Ижро фоизи %"] ?? row["Progress"] ?? 0;
    const progress = Number(rawProgress);
    if (!Number.isInteger(progress) || progress < 0 || progress > 100) {
      report.errors.push(`Qator ${rowIndex}: Ijro foizi 0 dan 100 gacha butun son bo'lishi shart.`);
      report.skipped++; rowIndex++; continue;
    }
    const status = String(row["Ҳолати (Status)"] || row["Status"] || 'ASSIGNED').toUpperCase().trim();
    if (progress !== 0 || status !== 'ASSIGNED') {
      report.errors.push(`Qator ${rowIndex}: Tarixiy holat va ijro foizini saqlash uchun tekshirilgan JSON migratsiyasidan foydalaning.`);
      report.skipped++; rowIndex++; continue;
    }
    const reviewerMatches = approver ? users.filter(u => [u.fullName,u.id,u.email].some(v => v.toLowerCase() === approver.toLowerCase())) : [];
    const reviewer = reviewerMatches.length === 1 ? reviewerMatches[0] : undefined;
    if (approver && (!reviewer || !['ADMIN','DIRECTOR'].includes(reviewer.role) || reviewer.id === worker?.id)) {
      report.errors.push(`Qator ${rowIndex}: Nazoratchi topilmadi yoki tasdiqlash vakolatiga ega emas.`);
      report.skipped++; rowIndex++; continue;
    }
    if (!dept || !worker) {
      if (!dept) report.errors.push(`Qator ${rowIndex}: Bo'lim "${deptNameRaw}" topilmadi.`);
      if (!worker) report.errors.push(`Qator ${rowIndex}: Mas'ul xodim "${workerNameRaw}" topilmadi.`);
      report.skipped++;
      rowIndex++;
      continue;
    }

    const parsedTask: Partial<Task> = {
      id: `imported-${Date.now()}-${rowIndex}`,
      itemNumber: Number.isInteger(itemNum) ? itemNum : undefined,
      planCode: publicCode,
      title: String(title).trim(),
      description: String(description).trim(),
      expectedOutcome: "ToshTech 2026–2027 yillik ish rejasi talablariga to'liq erishish",
      sourceReference: "ToshTech 2027-yil sentyabr oyiga qadar amalga oshiriladigan ishlar REJASI",
      fundingSource: String(funding).trim(),
      sectionTitle: String(sectionTitle).trim(),
      status: 'ASSIGNED',
      priority,
      departmentId: dept.id,
      departmentName: dept.name,
      assignedToId: worker.id,
      assignedToName: worker.fullName,
      assignedToTelegramId: worker.telegramId,
      assignedToTelegramUsername: worker.telegramUsername,
      approverId: reviewer?.id || '',
      approverName: reviewer?.fullName || '',
      assignedDate: new Date().toISOString().split('T')[0],
      deadline: deadlineStr,
      progressPercent: progress,
      proofs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    report.tasksPreview.push(parsedTask);
    report.created++;
    rowIndex++;
  }

  return report;
}

export const OFFICIAL_WORK_PLAN_COLUMNS = [
  "Т/р",
  "Бўлим (Йўналиш)",
  "Иш режа номи",
  "Амалга ошириш механизми",
  "Бажариш муддати",
  "Молиялаштириш манбалари",
  "Назорат (Проректор)",
  "Ижро учун масъул",
  "Масъул бўлим",
  "Ҳолати (Status)",
  "Ижро фоизи %",
  "Муҳимлик даражаси",
  "Proof-of-Work Ҳужжатлари"
];

/**
 * Builds and downloads the official ToshTech 2026-2027 Excel work plan file (.xlsx) with all 92 tasks
 */
export const safeSpreadsheetValue = (value: string | number) =>
  typeof value === 'string' && /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value;
export function exportTasksToExcel(tasks: Task[], fileName: string = `UniTask_work_plan_${new Date().toISOString().slice(0,10)}.xlsx`) {
  const data = tasks.map((t, idx) => {
    return {
      "Т/р": t.itemNumber || (idx + 1),
      "Бўлим (Йўналиш)": t.sectionTitle || t.sectionId || "Умумий йўналиш",
      "Иш режа номи": t.title,
      "Амалга ошириш механизми": t.description || '',
      "Бажариш муддати": t.deadline,
      "Молиялаштириш манбалари": t.fundingSource || 'Университет маблағлари',
      "Назорат (Проректор)": t.approverName,
      "Ижро учун масъул": t.assignedToName,
      "Масъул бўлим": t.departmentName,
      "Ҳолати (Status)": t.status,
      "Ижро фоизи %": t.progressPercent,
      "Муҳимлик даражаси": t.priority,
      "Proof-of-Work Ҳужжатлари": t.proofs.length > 0 ? `${t.proofs.length} та исбот илова қилинган` : "Ҳали юкланмаган"
    };
  });

  const safeData = data.map(row => Object.fromEntries(Object.entries(row).map(([key,value]) => [key,safeSpreadsheetValue(value)])));
  const worksheet = XLSX.utils.json_to_sheet(safeData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "ToshTech_2026_2027_Ish_Rejasi");

  // Adjust column widths
  worksheet['!cols'] = [
    { wch: 8 },  // Т/р
    { wch: 35 }, // Бўлим
    { wch: 45 }, // Иш режа номи
    { wch: 55 }, // Амалга ошириш механизми
    { wch: 20 }, // Бажариш муддати
    { wch: 28 }, // Молиялаштириш манбалари
    { wch: 32 }, // Назорат
    { wch: 25 }, // Ижро учун масъул
    { wch: 32 }, // Масъул бўлим
    { wch: 18 }, // Ҳолати
    { wch: 14 }, // Ижро %
    { wch: 16 }, // Муҳимлик
    { wch: 25 }, // Proofs
  ];

  XLSX.writeFile(workbook, fileName);
}

/**
 * Builds and downloads the ToshTech Work Plan CSV report file (.csv)
 * Encoded with UTF-8 BOM (\uFEFF) so Excel, Google Sheets, LibreOffice, and text viewers properly render Cyrillic characters.
 */
export function exportTasksToCsv(tasks: Task[], fileName: string = 'ToshTech_ish_reja_hisoboti.csv') {
  const headers = [
    "Т/р",
    "Режа Коди",
    "Категория (Бўлим)",
    "Иш Режа Номи",
    "Амалга Ошириш Механизми",
    "Кутилаётган Натижа",
    "Масъул Бўлим",
    "Ижро учун Масъул",
    "Назорат (Проректор)",
    "Муҳимлик Даражаси",
    "Ҳолати",
    "Ижро Фоизи %",
    "Бажариш Муддати",
    "Молиялаштириш Манбаси",
    "Proof-of-Work Исботлари Сони",
    "Бириктирилган Сана"
  ];

  const escapeCsv = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const str = String(safeSpreadsheetValue(val)).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = tasks.map((t, idx) => {
    return [
      escapeCsv(t.itemNumber || (idx + 1)),
      escapeCsv(t.planCode),
      escapeCsv(t.sectionTitle || t.sectionId || "Умумий йўналиш"),
      escapeCsv(t.title),
      escapeCsv(t.description ? t.description.replace(/\r?\n/g, ' ') : ""),
      escapeCsv(t.expectedOutcome ? t.expectedOutcome.replace(/\r?\n/g, ' ') : ""),
      escapeCsv(t.departmentName),
      escapeCsv(t.assignedToName),
      escapeCsv(t.approverName),
      escapeCsv(t.priority),
      escapeCsv(t.status),
      escapeCsv(t.progressPercent),
      escapeCsv(t.deadline),
      escapeCsv(t.fundingSource || "Университет маблағлари"),
      escapeCsv(t.proofs ? t.proofs.length : 0),
      escapeCsv(t.assignedDate || "")
    ].join(",");
  });

  // Prepend UTF-8 BOM (\uFEFF) to guarantee correct Cyrillic rendering in Microsoft Excel & Calc
  const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(","), ...rows].join("\r\n");

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parses an uploaded .xlsx file array buffer and validates mapping
 */
export async function parseExcelWorkPlan(
  fileBuffer: ArrayBuffer,
  departments: Department[],
  users: User[]
): Promise<ImportReport> {
  try {
    const workbook = XLSX.read(fileBuffer, { type: 'array' });
    return parseExcelWorkbook(workbook, departments, users);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      created: 0,
      updated: 0,
      skipped: 0,
      warnings: [],
      errors: [`Excel faylni tahlil qilishda xatolik: ${message}`],
      tasksPreview: []
    };
  }
}
