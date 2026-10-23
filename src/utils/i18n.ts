import React, { cloneElement, isValidElement, type ReactNode } from 'react';
import type { Language } from '../types';
import { interfaceTranslations } from './interfaceTranslations';

export const DEFAULT_LANGUAGE: Language = 'uz-Latn';

const languageAliases: Record<string, Language> = {
  'uz-latn': 'uz-Latn',
  uz_latn: 'uz-Latn',
  'uz-cyrl': 'uz-Cyrl',
  uz_cyrl: 'uz-Cyrl',
  ru: 'ru',
  en: 'en',
};

export const normalizeLanguage = (value: unknown): Language => {
  if (typeof value !== 'string') return DEFAULT_LANGUAGE;
  return languageAliases[value.toLowerCase()] ?? DEFAULT_LANGUAGE;
};

export const syncDocumentLanguage = (value: unknown): Language => {
  const language = normalizeLanguage(value);
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.lang = language;
    document.documentElement.dir = 'ltr';
    document.title = `UniTask | ${localizeText('University work plans', language)}`;
  }
  return language;
};

const normalizeKey = (value: string) =>
  value.replace(/\s+/g, ' ').trim();

const latinToCyrillicMap: Record<string, string> = {
  a: 'а', b: 'б', c: 'с', d: 'д', e: 'е', f: 'ф', g: 'г', h: 'ҳ',
  i: 'и', j: 'ж', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п',
  q: 'қ', r: 'р', s: 'с', t: 'т', u: 'у', v: 'в', w: 'в', x: 'х',
  y: 'й', z: 'з',
};

const cyrillicToLatinMap: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j',
  з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'x', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'shch', ъ: 'ʼ', ы: 'i', ь: '', э: 'e',
  ю: 'yu', я: 'ya', қ: 'q', ғ: 'gʻ', ў: 'oʻ', ҳ: 'h',
};

const preserveCase = (replacement: string, original: string) => {
  if (original === original.toUpperCase()) return replacement.toUpperCase();
  if (original[0] === original[0]?.toUpperCase()) {
    return replacement[0]?.toUpperCase() + replacement.slice(1);
  }
  return replacement;
};

export const toUzbekCyrillic = (value: string): string => {
  const normalized = value.replace(/[ʻʼ’‘`]/g, "'");
  return normalized.replace(
    /shch|o'|g'|ch|sh|yo|yu|ya|ye|ng|ts|[a-z]|'/gi,
    (match) => {
      const lower = match.toLowerCase();
      const digraphs: Record<string, string> = {
        "o'": 'ў',
        "g'": 'ғ',
        ch: 'ч',
        sh: 'ш',
        shch: 'щ',
        yo: 'ё',
        yu: 'ю',
        ya: 'я',
        ye: 'е',
        ng: 'нг',
        ts: 'ц',
      };
      if (lower === "o'" || lower === "g'") {
        return preserveCase(digraphs[lower], match);
      }
      if (digraphs[lower]) return preserveCase(digraphs[lower], match);
      if (lower === "'") return '';
      return preserveCase(latinToCyrillicMap[lower] ?? match, match);
    },
  );
};

export const toUzbekLatin = (value: string): string => {
  return value.replace(
    /[а-яёқғўҳцчшщъыьэюя]/gi,
    (match, offset: number, whole: string) => {
      const lower = match.toLowerCase();
      let replacement = cyrillicToLatinMap[lower] ?? match;
      if (lower === 'е' && (offset === 0 || !/[а-яёқғўҳ]/i.test(whole[offset - 1] ?? ''))) {
        replacement = 'ye';
      }
      return preserveCase(replacement, match);
    },
  );
};

const dataLabelTranslations: Record<string, Partial<Record<Language, string>>> = {
  PENDING: { 'uz-Latn': 'Kutilmoqda', 'uz-Cyrl': 'Кутилмоқда', en: 'Pending', ru: 'Ожидает' },
  ASSIGNED: { 'uz-Latn': 'Biriktirilgan', 'uz-Cyrl': 'Бириктирилган', en: 'Assigned', ru: 'Назначено' },
  IN_PROGRESS: { 'uz-Latn': 'Jarayonda', 'uz-Cyrl': 'Жараёнда', en: 'In progress', ru: 'В работе' },
  SUBMITTED_FOR_REVIEW: { 'uz-Latn': "Ko'rikda", 'uz-Cyrl': 'Кўрикда', en: 'Under review', ru: 'На проверке' },
  COMPLETED: { 'uz-Latn': 'Bajarildi', 'uz-Cyrl': 'Бажарилди', en: 'Completed', ru: 'Выполнено' },
  APPROVED: { 'uz-Latn': 'Tasdiqlandi', 'uz-Cyrl': 'Тасдиқланди', en: 'Approved', ru: 'Одобрено' },
  REJECTED: { 'uz-Latn': 'Qaytarildi', 'uz-Cyrl': 'Қайтарилди', en: 'Returned', ru: 'Возвращено' },
  OVERDUE: { 'uz-Latn': "Muddati o'tgan", 'uz-Cyrl': 'Муддати ўтган', en: 'Overdue', ru: 'Просрочено' },
  NEW: { 'uz-Latn': 'Yangi', 'uz-Cyrl': 'Янги', en: 'New', ru: 'Новое' },
  PROCESSING: { 'uz-Latn': 'Ko‘rib chiqilmoqda', 'uz-Cyrl': 'Кўриб чиқилмоқда', en: 'Processing', ru: 'В обработке' },
  RESOLVED: { 'uz-Latn': 'Hal qilindi', 'uz-Cyrl': 'Ҳал қилинди', en: 'Resolved', ru: 'Решено' },
  CLOSED: { 'uz-Latn': 'Yopildi', 'uz-Cyrl': 'Ёпилди', en: 'Closed', ru: 'Закрыто' },
  ACTIVE: { 'uz-Latn': 'Faol', 'uz-Cyrl': 'Фаол', en: 'Active', ru: 'Активно' },
  WAITING: { 'uz-Latn': 'Kutilmoqda', 'uz-Cyrl': 'Кутилмоқда', en: 'Waiting', ru: 'Ожидание' },
  FAILED: { 'uz-Latn': 'Muvaffaqiyatsiz', 'uz-Cyrl': 'Муваффақиятсиз', en: 'Failed', ru: 'Ошибка' },
  DELAYED: { 'uz-Latn': 'Kechikkan', 'uz-Cyrl': 'Кечиккан', en: 'Delayed', ru: 'Задержано' },
  CRITICAL: { 'uz-Latn': 'Juda muhim', 'uz-Cyrl': 'Жуда муҳим', en: 'Critical', ru: 'Критический' },
  HIGH: { 'uz-Latn': 'Yuqori', 'uz-Cyrl': 'Юқори', en: 'High', ru: 'Высокий' },
  MEDIUM: { 'uz-Latn': "O'rtacha", 'uz-Cyrl': 'Ўртача', en: 'Medium', ru: 'Средний' },
  LOW: { 'uz-Latn': 'Past', 'uz-Cyrl': 'Паст', en: 'Low', ru: 'Низкий' },
  DIRECTOR: { 'uz-Latn': 'Rektor', 'uz-Cyrl': 'Ректор', en: 'Director', ru: 'Ректор' },
  ADMIN: { 'uz-Latn': 'Tizim administratori', 'uz-Cyrl': 'Тизим администратори', en: 'Administrator', ru: 'Администратор' },
  WORKER: { 'uz-Latn': 'Xodim', 'uz-Cyrl': 'Ходим', en: 'Staff member', ru: 'Сотрудник' },
  'Tizim Xavfsizligi': { 'uz-Latn': 'Tizim xavfsizligi', 'uz-Cyrl': 'Тизим хавфсизлиги', en: 'System security', ru: 'Безопасность системы' },
  'Admin Konsoli': { 'uz-Latn': 'Admin konsoli', 'uz-Cyrl': 'Админ консоли', en: 'Admin console', ru: 'Консоль администратора' },
  'Boshqaruv Paneli': { 'uz-Latn': 'Boshqaruv paneli', 'uz-Cyrl': 'Бошқарув панели', en: 'Dashboard', ru: 'Панель управления' },
  'Ish Reja Vazifalari': { 'uz-Latn': 'Ish reja vazifalari', 'uz-Cyrl': 'Иш режа вазифалари', en: 'Work plan tasks', ru: 'Задачи рабочего плана' },
  "Ko'rik Nazorati": { 'uz-Latn': "Ko'rik nazorati", 'uz-Cyrl': 'Кўрик назорати', en: 'Proof review', ru: 'Проверка подтверждений' },
  'Excel Import/Eksport': { 'uz-Latn': 'Excel import/eksport', 'uz-Cyrl': 'Excel импорт/экспорт', en: 'Excel import/export', ru: 'Импорт/экспорт Excel' },
  'Telegram Navbati': { 'uz-Latn': 'Telegram navbati', 'uz-Cyrl': 'Telegram навбати', en: 'Telegram queue', ru: 'Очередь Telegram' },
  'Proof-of-Work Tekshiruvi': { 'uz-Latn': "Bajarilgan ishni tekshirish", 'uz-Cyrl': 'Бажарилган ишни текшириш', en: 'Proof-of-work review', ru: 'Проверка подтверждения выполнения' },
  'Excel Ingestion & Reja': { 'uz-Latn': 'Excel importi va reja', 'uz-Cyrl': 'Excel импорти ва режа', en: 'Excel import & work plan', ru: 'Импорт Excel и рабочий план' },
  'Xodimlar & Telegram ID': { 'uz-Latn': 'Xodimlar va Telegram ID', 'uz-Cyrl': 'Ходимлар ва Telegram ID', en: 'Staff & Telegram IDs', ru: 'Сотрудники и Telegram ID' },
  'Redis & Queue Navbati': { 'uz-Latn': 'Redis va navbat', 'uz-Cyrl': 'Redis ва навбат', en: 'Redis & queue', ru: 'Redis и очередь' },
  'Audit Jurnali': { 'uz-Latn': 'Audit jurnali', 'uz-Cyrl': 'Аудит журнали', en: 'Audit log', ru: 'Журнал аудита' },
  'Murojaatlar (HelpDesk)': { 'uz-Latn': 'Murojaatlar (yordam xizmati)', 'uz-Cyrl': 'Мурожаатлар (ёрдам хизмати)', en: 'Service desk', ru: 'Служба поддержки' },
  'Tahrirlash': { 'uz-Latn': 'Tahrirlash', 'uz-Cyrl': 'Таҳрирлаш', en: 'Edit', ru: 'Изменить' },
  "Bog'lash": { 'uz-Latn': "Bog'lash", 'uz-Cyrl': 'Боғлаш', en: 'Link', ru: 'Связать' },
  'Nusxalandi!': { 'uz-Latn': 'Nusxalandi!', 'uz-Cyrl': 'Нусхаланди!', en: 'Copied!', ru: 'Скопировано!' },
  'Nusxalash': { 'uz-Latn': 'Nusxalash', 'uz-Cyrl': 'Нусхалаш', en: 'Copy', ru: 'Копировать' },
  'Murojaat yuborish uchun bo‘lim mavjud emas.': {
    'uz-Latn': "Murojaat yuborish uchun bo'lim mavjud emas.",
    'uz-Cyrl': 'Мурожаат юбориш учун бўлим мавжуд эмас.',
    en: 'No department is available for this request.',
    ru: 'Для обращения нет доступного отдела.',
  },
  'CRITICAL (Жуда муҳим)': { 'uz-Latn': 'CRITICAL (juda muhim)', 'uz-Cyrl': 'CRITICAL (жуда муҳим)', en: 'CRITICAL (Critical)', ru: 'CRITICAL (критический)' },
  'HIGH (Юқори)': { 'uz-Latn': 'HIGH (yuqori)', 'uz-Cyrl': 'HIGH (юқори)', en: 'HIGH (High)', ru: 'HIGH (высокий)' },
  'MEDIUM (Ўртача)': { 'uz-Latn': "MEDIUM (o'rtacha)", 'uz-Cyrl': 'MEDIUM (ўртача)', en: 'MEDIUM (Medium)', ru: 'MEDIUM (средний)' },
  'LOW (Паст)': { 'uz-Latn': 'LOW (past)', 'uz-Cyrl': 'LOW (паст)', en: 'LOW (Low)', ru: 'LOW (низкий)' },
  'Бажарилди (Completed)': { 'uz-Latn': 'Bajarildi', 'uz-Cyrl': 'Бажарилди', en: 'Completed', ru: 'Завершено' },
  'Кўрикда (Under Review)': { 'uz-Latn': "Ko'rikda", 'uz-Cyrl': 'Кўрикда', en: 'Under review', ru: 'На проверке' },
  'Жараёнда (In Progress)': { 'uz-Latn': 'Jarayonda', 'uz-Cyrl': 'Жараёнда', en: 'In progress', ru: 'В работе' },
  'Муддати ўтган (Overdue)': { 'uz-Latn': "Muddati o'tgan", 'uz-Cyrl': 'Муддати ўтган', en: 'Overdue', ru: 'Просрочено' },
  'Бириктирилган (Assigned)': { 'uz-Latn': 'Biriktirilgan', 'uz-Cyrl': 'Бириктирилган', en: 'Assigned', ru: 'Назначено' },
  "Nusxalash muvaffaqiyatsiz. Buyruqni qo'lda tanlab nusxalang.": {
    'uz-Latn': "Nusxalash muvaffaqiyatsiz. Buyruqni qo'lda tanlab nusxalang.",
    'uz-Cyrl': 'Нусхалаш муваффақиятсиз. Буйруқни қўлда танлаб нусхаланг.',
    en: 'Copy failed. Select and copy the command manually.',
    ru: 'Не удалось скопировать. Выделите и скопируйте команду вручную.',
  },
  "Qaytarish sababi va kamchiliklarni ko'rsatuvchi izoh kiritish majburiy!": {
    'uz-Latn': "Qaytarish sababi va kamchiliklarni ko'rsatuvchi izoh kiritish shart.",
    'uz-Cyrl': 'Қайтариш сабаби ва камчиликларни кўрсатувчи изоҳ киритиш шарт.',
    en: 'A return reason and a note describing the issues are required.',
    ru: 'Укажите причину возврата и опишите обнаруженные недостатки.',
  },
  'Telegram sessiyasi tekshirilmadi.': {
    'uz-Latn': 'Telegram sessiyasini tekshirib bo‘lmadi.',
    'uz-Cyrl': 'Telegram сессиясини текшириб бўлмади.',
    en: 'Telegram session could not be verified.',
    ru: 'Не удалось проверить сеанс Telegram.',
  },
  'Изоҳ муҳокама оқимига қўшилди': {
    'uz-Latn': 'Izoh muhokama oqimiga qo‘shildi.',
    'uz-Cyrl': 'Изоҳ муҳокама оқимига қўшилди.',
    en: 'Comment added to the discussion.',
    ru: 'Комментарий добавлен в обсуждение.',
  },
  'Янги топшириқ муваффақиятли рўйхатга олинди': {
    'uz-Latn': 'Yangi topshiriq muvaffaqiyatli ro‘yxatdan o‘tkazildi.',
    'uz-Cyrl': 'Янги топшириқ муваффақиятли рўйхатдан ўтказилди.',
    en: 'New task created successfully.',
    ru: 'Новое задание успешно создано.',
  },
  'Иш жараёни (Clock In) қайд этилди': {
    'uz-Latn': 'Ish boshlangani qayd etildi.',
    'uz-Cyrl': 'Иш бошлангани қайд этилди.',
    en: 'Work session started.',
    ru: 'Начало работы отмечено.',
  },
};

const isMachineValue = (value: string) =>
  /^(?:https?:\/\/\S+|[\w.+-]+@[\w.-]+\.\w+|@[A-Za-z0-9_]+|\+?\d[\d ()-]*|\/[a-z0-9_/-]+)$/i.test(value.trim()) ||
  /^[A-Z]{2,8}$/.test(value.trim()) ||
  /^[A-Z]{2,8}[-_][A-Z0-9_-]+$/.test(value.trim()) ||
  /^[A-Za-z0-9]+_[A-Za-z0-9_.-]+$/.test(value.trim()) ||
  /^[a-z0-9_.-]*[_-]\d+[a-z0-9_.-]*$/i.test(value.trim());

const preserveUntranslatedEnglishData = (value: string) =>
  /^[A-Za-z][A-Za-z '-]*$/.test(value.trim());

let translationAliases: Map<string, string> | undefined;
const canonicalTranslationKey = (key: string) => {
  if (interfaceTranslations[key] || dataLabelTranslations[key]) return key;
  if (!translationAliases) {
    translationAliases = new Map();
    for (const [source, values] of [...Object.entries(interfaceTranslations), ...Object.entries(dataLabelTranslations)]) {
      for (const text of Object.values(values)) if (text) translationAliases.set(normalizeKey(text), source);
      if (values['uz-Latn']) translationAliases.set(normalizeKey(toUzbekCyrillic(values['uz-Latn'])), source);
    }
  }
  return translationAliases.get(key) || key;
};
export const localizeText = (input: string, selectedLanguage?: unknown): string => {
  if (!input) return input;
  const language = normalizeLanguage(
    selectedLanguage ??
      (typeof document !== 'undefined' ? document.documentElement.lang : DEFAULT_LANGUAGE),
  );
  const leading = input.match(/^\s*/)?.[0] ?? '';
  const trailing = input.match(/\s*$/)?.[0] ?? '';
  if (input.includes('\n')) return input.split('\n').map(line => localizeText(line, language)).join('\n');
  const key = canonicalTranslationKey(normalizeKey(input));
  if (!key) return input;
  const rowError = key.match(/^(?:Qator|Row) (\d+): (.+)$/);
  if (rowError) {
    const label = language === 'en' ? 'Row' : language === 'ru' ? 'Строка' : language === 'uz-Cyrl' ? 'Қатор' : 'Qator';
    return `${label} ${rowError[1]}: ${localizeText(rowError[2], language)}`;
  }
  const dynamicErrors: [RegExp, Record<Language, string>][] = [
    [/^New task assigned: (.*)\. Deadline: (\d{4}-\d{2}-\d{2})$/, {en:'New task assigned: $1. Deadline: $2',ru:'Назначено новое задание: $1. Срок: $2','uz-Latn':'Yangi topshiriq tayinlandi: $1. Muddat: $2','uz-Cyrl':'Янги топшириқ тайинланди: $1. Муддат: $2'}],
    [/^New task assigned: (.*)\.$/, {en:'New task assigned: $1.',ru:'Назначено новое задание: $1.','uz-Latn':'Yangi topshiriq tayinlandi: $1.','uz-Cyrl':'Янги топшириқ тайинланди: $1.'}],
    [/^(.*): deadline (\d{4}-\d{2}-\d{2})$/, {en:'$1: deadline $2',ru:'$1: срок $2','uz-Latn':'$1: muddat $2','uz-Cyrl':'$1: муддат $2'}],
    [/^Bo'lim "(.*)" topilmadi\.$/, { en:'Department "$1" was not found.',ru:'Подразделение «$1» не найдено.','uz-Latn':'Bo‘linma "$1" topilmadi.','uz-Cyrl':'Бўлинма «$1» топилмади.' }],
    [/^Mas'ul xodim "(.*)" topilmadi\.$/, { en:'Assignee "$1" was not found.',ru:'Исполнитель «$1» не найден.','uz-Latn':'Ijrochi "$1" topilmadi.','uz-Cyrl':'Ижрочи «$1» топилмади.' }],
    [/^Muhimlik darajasi noto'g'ri: (.*)\.$/, { en:'Invalid priority: $1.',ru:'Неверный приоритет: $1.','uz-Latn':'Muhimlik darajasi noto‘g‘ri: $1.','uz-Cyrl':'Муҳимлик даражаси нотўғри: $1.' }],
    [/^Takroriy topshiriq raqami: (.*)\.$/, { en:'Duplicate task number: $1.',ru:'Повторный номер задания: $1.','uz-Latn':'Takroriy topshiriq raqami: $1.','uz-Cyrl':'Такрорий топшириқ рақами: $1.' }],
    [/^Task number (.*) already exists\.$/, { en:'Task number $1 already exists.',ru:'Задание с номером $1 уже существует.','uz-Latn':'$1 raqamli topshiriq avval mavjud.','uz-Cyrl':'$1 рақамли топшириқ аввал мавжуд.' }],
  ];
  for (const [pattern, translations] of dynamicErrors) {
    const match = key.match(pattern);
    if (match) return translations[language].replace(/\$(\d+)/g, (_, number) => localizeText(match[Number(number)] || '', language));
  }

  const shortNarrative = key.match(
    /^Matnli xulosa kamida 20 belgidan iborat bo'lishi shart! \(Hozir: (\d+) ta\)$/,
  );
  if (shortNarrative) {
    const [, count] = shortNarrative;
    const errorText: Record<Language, string> = {
      'uz-Latn': `Xulosa kamida 20 ta belgidan iborat bo‘lishi kerak (hozir: ${count} ta).`,
      'uz-Cyrl': `Хулоса камида 20 та белгидан иборат бўлиши керак (ҳозир: ${count} та).`,
      en: `The summary must contain at least 20 characters (currently ${count}).`,
      ru: `В описании должно быть не менее 20 символов (сейчас ${count}).`,
    };
    return `${leading}${errorText[language]}${trailing}`;
  }

  const priorityUpdate = key.match(/^«([^»]+)» топшириғи муҳимлиги (.+) га ўзгартирилди$/);
  if (priorityUpdate) {
    const [, taskCode, priority] = priorityUpdate;
    const translatedPriority = dataLabelTranslations[priority]?.[language] ?? priority;
    const updateText: Record<Language, string> = {
      'uz-Latn': `“${taskCode}” topshirig‘i muhimligi ${translatedPriority} darajasiga o‘zgartirildi.`,
      'uz-Cyrl': `«${taskCode}» топшириғи муҳимлиги ${translatedPriority} га ўзгартирилди.`,
      en: `Priority for task ${taskCode} changed to ${translatedPriority}.`,
      ru: `Приоритет задачи ${taskCode} изменен на ${translatedPriority}.`,
    };
    return `${leading}${updateText[language]}${trailing}`;
  }

  const csvExport = key.match(/^(\d+) та топшириқ CSV ҳисобот файли сифатида юклаб олинди$/);
  if (csvExport) {
    const [, count] = csvExport;
    const exportText: Record<Language, string> = {
      'uz-Latn': `${count} ta topshiriq uchun CSV hisoboti yuklab olindi.`,
      'uz-Cyrl': `${count} та топшириқ учун CSV ҳисоботи юклаб олинди.`,
      en: `CSV report downloaded for ${count} tasks.`,
      ru: `Скачан CSV-отчет для ${count} задач.`,
    };
    return `${leading}${exportText[language]}${trailing}`;
  }

  const overdueBadge = key.match(/^(\d+)\s+overdue$/i);
  if (overdueBadge) {
    const [, count] = overdueBadge;
    const badgeText: Record<Language, string> = {
      'uz-Latn': `${count} ta muddati o'tgan`,
      'uz-Cyrl': `${count} та муддати ўтган`,
      en: `${count} overdue`,
      ru: `Просрочено: ${count}`,
    };
    return `${leading}${badgeText[language]}${trailing}`;
  }

  const domainTranslation = dataLabelTranslations[key]?.[language];
  if (domainTranslation) return `${leading}${domainTranslation}${trailing}`;
  const entry = interfaceTranslations[key];
  const semanticMachineKey = entry && [entry.en,entry.ru,entry['uz-Latn']].some(value => value && normalizeKey(value) !== key);
  if (isMachineValue(key) && !semanticMachineKey) return input;

  if (language === 'uz-Latn') {
    const translated = interfaceTranslations[key]?.['uz-Latn'] ?? toUzbekLatin(key);
    return `${leading}${translated}${trailing}`;
  }
  if (language === 'uz-Cyrl') {
    const latinTranslation = interfaceTranslations[key]?.['uz-Latn'] ?? toUzbekLatin(key);
    return `${leading}${toUzbekCyrillic(latinTranslation)}${trailing}`;
  }

  const translated = interfaceTranslations[key]?.[language];
  if (translated) return `${leading}${translated}${trailing}`;
  if (isMachineValue(key) || preserveUntranslatedEnglishData(key)) return input;
  return input;
};

export const localizeNode = (node: ReactNode, selectedLanguage?: unknown): ReactNode => {
  const language = normalizeLanguage(
    selectedLanguage ??
      (typeof document !== 'undefined' ? document.documentElement.lang : DEFAULT_LANGUAGE),
  );
  if (typeof node === 'string') return localizeText(node, language);
  if (Array.isArray(node)) return node.map((child) => localizeNode(child, language));
  if (!isValidElement<{ children?: ReactNode; translate?: string }>(node)) return node;

  if (node.props.translate === 'no') return node;
  const children = node.props.children;
  if (children === undefined) return node;
  return cloneElement(node, undefined, localizeNode(children, language));
};
