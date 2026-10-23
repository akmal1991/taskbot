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

export function commitExcelImportIfValid(
  report: ImportReport | null,
  previewTasks: Partial<Task>[],
  commitTasks: (tasks: Partial<Task>[]) => void
): boolean {
  if (!canApplyExcelImport(report, previewTasks)) return false;
  commitTasks(previewTasks);
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

  let rowIndex = 2;
  for (const row of rawRows) {
    const title = row["Иш режа номи"] || row["Title"] || row["title"] || row["Sarlavha"] || row["Topshiriq nomi"] || row["Nomi"];
    if (!title || String(title).trim() === '') {
      report.skipped++;
      report.errors.push(`Qator ${rowIndex}: Topshiriq nomi bo'sh. Ushbu faylni tuzatib qayta yuklang.`);
      rowIndex++;
      continue;
    }

    const itemNum = Number(row["Т/р"]) || rowIndex - 1;
    const publicCode = `TT-2026-${String(itemNum).padStart(2, '0')}`;
    const description = row["Амалга ошириш механизми"] || row["Description"] || row["Tavsif"] || "";
    const funding = row["Молиялаштириш манбалари"] || row["Funding"] || "Университет маблағлари";
    const approver = row["Назорат (Проректор)"] || row["Назорат"] || "Ўқув ишлари бўйича проректор (А.Рустамов)";
    const sectionTitle = row["Бўлим (Йўналиш)"] || row["Бўлим"] || "Умумий йўналиш";

    const deptNameRaw = row["Масъул бўлим"] || row["Department"] || row["Bo'lim"] || "";
    const normalizedDepartmentName = String(deptNameRaw).toLowerCase().trim();
    const dept = normalizedDepartmentName
      ? departments.find(d =>
        d.name.toLowerCase().includes(normalizedDepartmentName) ||
        normalizedDepartmentName.includes(d.name.toLowerCase().trim())
      )
      : departments[0];

    const workerNameRaw = row["Ижро учун масъул"] || row["Primary Responsible (full name)"] || row["Xodim"] || "";
    const normalizedWorkerName = String(workerNameRaw).toLowerCase().trim();
    const worker = normalizedWorkerName
      ? users.find(u =>
        u.fullName.toLowerCase().includes(normalizedWorkerName) ||
        normalizedWorkerName.includes(u.fullName.toLowerCase().trim())
      )
      : users.find(u => u.role === 'WORKER') || users[0];

    const priorityRaw = String(row["Муҳимлик даражаси"] || row["Priority"] || "HIGH").toUpperCase().trim();
    let priority: Task['priority'] = 'HIGH';
    if (['CRITICAL', 'JUDAYUQORI'].includes(priorityRaw)) priority = 'CRITICAL';
    else if (['MEDIUM', 'O\'RTACHA'].includes(priorityRaw)) priority = 'MEDIUM';
    else if (['LOW', 'PAST'].includes(priorityRaw)) priority = 'LOW';

    let deadlineStr = '2027-06-30';
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

    if (!dept || !worker) {
      if (!dept) report.errors.push(`Qator ${rowIndex}: Bo'lim "${deptNameRaw}" topilmadi.`);
      if (!worker) report.errors.push(`Qator ${rowIndex}: Mas'ul xodim "${workerNameRaw}" topilmadi.`);
      report.skipped++;
      rowIndex++;
      continue;
    }

    const parsedTask: Partial<Task> = {
      id: `imported-${Date.now()}-${rowIndex}`,
      itemNumber: itemNum,
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
      createdById: users[0]?.id || 'user-director',
      createdByName: users[0]?.fullName || 'Prof. Rustam O. Xoliqov',
      approverId: 'user-rustamov',
      approverName: approver,
      assignedDate: new Date().toISOString().split('T')[0],
      deadline: deadlineStr,
      progressPercent: Number(row["Ижро фоизи %"]) || 0,
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
export function exportTasksToExcel(tasks: Task[], fileName: string = 'ToshTech_ish_reja_2026_2027_.xlsx') {
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

  const worksheet = XLSX.utils.json_to_sheet(data);
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
    const str = String(val).replace(/"/g, '""');
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
