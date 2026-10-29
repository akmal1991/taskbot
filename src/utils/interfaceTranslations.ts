// Interface translations. Uzbek Cyrillic is derived from the reviewed Uzbek Latin strings.
import { securityCopy } from './securityTranslations.ts';
export const interfaceTranslations: Record<string, { en: string; ru: string; 'uz-Latn'?: string }> = {
  "Remove": { en: "Remove", ru: "Убрать", 'uz-Latn': "Olib tashlash" },
  "Additional assignees and departments": { en: "Additional assignees and departments", ru: "Дополнительные исполнители и подразделения", 'uz-Latn': "Qo‘shimcha ijrochilar va bo‘linmalar" },
  "Each assignee submits their own evidence. Task members can view all submitted evidence.": { en: "Each assignee submits their own evidence. Task members can view all submitted evidence.", ru: "Каждый исполнитель отправляет свои подтверждения. Участники задания видят все отправленные подтверждения.", 'uz-Latn': "Har bir ijrochi o‘z ish dalillarini topshiradi. Topshiriq ishtirokchilari barcha topshirilgan dalillarni ko‘ra oladi." },
  "Add assignee": { en: "Add assignee", ru: "Добавить исполнителя", 'uz-Latn': "Ijrochi qo‘shish" },
  "Task team": { en: "Task team", ru: "Участники задания", 'uz-Latn': "Topshiriq ishtirokchilari" },
  "Overall progress": { en: "Overall progress", ru: "Общий прогресс", 'uz-Latn': "Umumiy ijro" },
  "Each assignee may only be selected once.": { en: "Each assignee may only be selected once.", ru: "Каждого исполнителя можно выбрать только один раз.", 'uz-Latn': "Har bir ijrochini faqat bir marta tanlash mumkin." },
  "Team assignments are fixed after task creation.": { en: "Team assignments are fixed after task creation.", ru: "Состав участников нельзя менять после создания задания.", 'uz-Latn': "Topshiriq yaratilgach, ishtirokchilar tarkibini o‘zgartirib bo‘lmaydi." },
  "This username is already used by another account. Choose a different username or edit the existing account.": { en: "This username is already used by another account. Choose a different username or edit the existing account.", ru: "Это имя пользователя уже занято. Выберите другое имя или измените существующую учётную запись.", 'uz-Latn': "Bu foydalanuvchi nomi bilan hisob allaqachon mavjud. Boshqa nom tanlang yoki mavjud hisobni tahrirlang." },
  "This email is already used by another account. Use a different email or edit the existing account.": { en: "This email is already used by another account. Use a different email or edit the existing account.", ru: "Этот адрес электронной почты уже используется. Укажите другой адрес или измените существующую учётную запись.", 'uz-Latn': "Bu elektron pochta bilan hisob allaqachon mavjud. Boshqa pochta manzilini kiriting yoki mavjud hisobni tahrirlang." },
  "Username must contain 3–64 English letters, numbers, dots, underscores or hyphens, without spaces.": { en: "Username must contain 3–64 English letters, numbers, dots, underscores or hyphens, without spaces.", ru: "Имя пользователя должно содержать 3–64 латинские буквы, цифры, точки, подчёркивания или дефисы, без пробелов.", 'uz-Latn': "Foydalanuvchi nomi 3–64 ta lotin harfi, raqam, nuqta, pastki chiziq yoki defisdan iborat bo‘lishi kerak. Bo‘sh joy ishlatmang." },
  "Telegram": { en: "Telegram", ru: "Telegram", 'uz-Latn': "Telegram" },
  "Open in Telegram": { en: "Open in Telegram", ru: "Открыть в Telegram", 'uz-Latn': "Telegramda ochish" },
  "Topshiriq ish maydoni": { en: "Task workspace", ru: "Рабочая область заданий", 'uz-Latn': "Topshiriq ish maydoni" },
  "Topshiriqlarni bajaring, ijro foizini yangilang va bajarilgan ish dalillarini yuklang.": { en: "Work on tasks, update progress, and upload evidence of completed work.", ru: "Выполняйте задания, обновляйте прогресс и загружайте подтверждения выполненной работы.", 'uz-Latn': "Topshiriqlarni bajaring, ijro foizini yangilang va bajarilgan ish dalillarini yuklang." },
  "Ish maydonini ochish": { en: "Open workspace", ru: "Открыть рабочую область", 'uz-Latn': "Ish maydonini ochish" },
  "demo": {
    "en": "demo",
    "ru": "демо",
    "uz-Latn": "demo"
  },
  "Demo ma’lumotlari yuklandi. O‘zgarishlar ushbu qurilmada saqlanadi.": {
    "en": "Demo data loaded. Changes will be saved on this device.",
    "ru": "Демо-данные загружены. Изменения будут сохранены на этом устройстве.",
    "uz-Latn": "Demo ma’lumotlari yuklandi. O‘zgarishlar ushbu qurilmada saqlanadi."
  },
  "recovered": {
    "en": "recovered",
    "ru": "восстановлено",
    "uz-Latn": "tiklandi"
  },
  "Saqlangan ma’lumotlarni o‘qib bo‘lmadi. Demo ma’lumotlari yuklandi, avvalgi nusxa zaxiralandi va yangi o‘zgarishlar ushbu qurilmada saqlanadi.": {
    "en": "Could not read saved data. Demo data loaded, previous version backed up, and new changes will be saved on this device.",
    "ru": "Не удалось прочитать сохраненные данные. Загружены демо-данные, предыдущая копия сохранена, а новые изменения будут сохранены на этом устройстве.",
    "uz-Latn": "Saqlangan ma’lumotlarni o‘qib bo‘lmadi. Demo ma’lumotlari yuklandi, avvalgi nusxa zaxiralandi va yangi o‘zgarishlar ushbu qurilmada saqlanadi."
  },
  "unavailable": {
    "en": "unavailable",
    "ru": "недоступно",
    "uz-Latn": "mavjud emas"
  },
  "Brauzer xotirasi mavjud emas. O‘zgarishlar sahifani yangilagandan so‘ng saqlanmasligi mumkin.": {
    "en": "Browser storage unavailable. Changes may not be saved after refreshing the page.",
    "ru": "Память браузера недоступна. Изменения могут не сохраниться после обновления страницы.",
    "uz-Latn": "Brauzer xotirasi mavjud emas. O‘zgarishlar sahifani yangilagandan so‘ng saqlanmasligi mumkin."
  },
  "Tizim Xavfsizligi": {
    "en": "System Security",
    "ru": "Безопасность системы",
    "uz-Latn": "Tizim xavfsizligi"
  },
  "·": {
    "en": "·",
    "ru": "·",
    "uz-Latn": "·"
  },
  "Prisma AuditLog Storage": {
    "en": "Prisma AuditLog Storage",
    "ru": "Prisma AuditLog Storage",
    "uz-Latn": "Prisma audit jurnali xotirasi"
  },
  "Tizim Audit va Xavfsizlik Jurnali": {
    "en": "System Audit and Security Log",
    "ru": "Журнал аудита и безопасности системы",
    "uz-Latn": "Tizim audit va xavfsizlik jurnali"
  },
  "O'zgartirib bo'lmas yozuvlar (Immutable Log)": {
    "en": "Immutable Log",
    "ru": "Неизменяемый журнал (Immutable Log)",
    "uz-Latn": "O‘zgartirib bo‘lmas yozuvlar (Immutable Log)"
  },
  "Amal, mas'ul shaxs yoki topshiriq kodi bo'yicha qidiruv...": {
    "en": "Search by action, responsible person, or task code...",
    "ru": "Поиск по действию, ответственному лицу или коду задачи...",
    "uz-Latn": "Amal, mas’ul shaxs yoki topshiriq kodi bo‘yicha qidiruv..."
  },
  "Barcha amallar": {
    "en": "All actions",
    "ru": "Все действия",
    "uz-Latn": "Barcha amallar"
  },
  "Vaqt & IP": {
    "en": "Time & IP",
    "ru": "Время и IP",
    "uz-Latn": "Vaqt va IP"
  },
  "Amal (Action)": {
    "en": "Action",
    "ru": "Действие",
    "uz-Latn": "Amal"
  },
  "Ijrochi (Actor)": {
    "en": "Actor",
    "ru": "Исполнитель",
    "uz-Latn": "Ijrochi"
  },
  "Obyekt": {
    "en": "Object",
    "ru": "Объект",
    "uz-Latn": "Obyekt"
  },
  "Tafsilotlar": {
    "en": "Details",
    "ru": "Детали",
    "uz-Latn": "Tafsilotlar"
  },
  "—": {
    "en": "—",
    "ru": "—",
    "uz-Latn": "—"
  },
  "Admin Konsoli": {
    "en": "Admin Console",
    "ru": "Консоль администратора",
    "uz-Latn": "Admin konsoli"
  },
  "Excel Ingestion Engine": {
    "en": "Excel Ingestion Engine",
    "ru": "Движок импорта Excel",
    "uz-Latn": "Excel importi mexanizmi"
  },
  "ToshTech Yillik Ish Rejasini Excel (.xlsx) Bilan Boshqarish": {
    "en": "Manage ToshTech Annual Work Plan with Excel (.xlsx)",
    "ru": "Управление годовым планом работ ToshTech через Excel (.xlsx)",
    "uz-Latn": "ToshTech yillik ish rejasini Excel (.xlsx) bilan boshqarish"
  },
  "Hozirgi Rejani Yuklab Olish": {
    "en": "Download Current Plan",
    "ru": "Скачать текущий план",
    "uz-Latn": "Hozirgi Ish Rejasini Yuklab Olish"
  },
  "Excel Faylni Yuklash (Ingestion)": {
    "en": "Upload Excel File (Ingestion)",
    "ru": "Загрузить Excel-файл (импорт)",
    "uz-Latn": "Excel faylini yuklash"
  },
  "`ToshTech_ish_reja_2026_2027_.xlsx` formatidagi fayllarni avtomatik o'qish va ma'lumotlar bazasiga kiritish.": {
    "en": "Automatically read files in `ToshTech_ish_reja_2026_2027_.xlsx` format and add to the database.",
    "ru": "Автоматическое чтение файлов в формате `ToshTech_ish_reja_2026_2027_.xlsx` и внесение их в базу данных.",
    "uz-Latn": "`ToshTech_ish_reja_2026_2027_.xlsx` formatidagi fayllarni avtomatik o'qish va ma'lumotlar bazasiga kiritish."
  },
  "Faylni tanlash yoki shu yerga tashlash": {
    "en": "Select or drag file here",
    "ru": "Выберите или перетащите файл сюда",
    "uz-Latn": "Faylni tanlang yoki shu yerga tashlang"
  },
  "Faqat .xlsx va .xls formatlar qo'llab-quvvatlanadi": {
    "en": "Only .xlsx and .xls formats are supported",
    "ru": "Поддерживаются только форматы .xlsx и .xls",
    "uz-Latn": "Faqat .xlsx va .xls formatlari qo'llab-quvvatlanadi"
  },
  "Ustunlar: ID, Public Code, Title, Department, Responsible, Deadline, Priority": {
    "en": "Columns: ID, Public Code, Title, Department, Responsible, Deadline, Priority",
    "ru": "Столбцы: ID, Public Code, Title, Department, Responsible, Deadline, Priority",
    "uz-Latn": "Ustunlar: ID, Public Code, Title, Department, Responsible, Deadline, Priority"
  },
  "Namunaviy Paketni Sinash": {
    "en": "Test Sample Package",
    "ru": "Протестировать образец пакета",
    "uz-Latn": "Namunaviy Paketni Sinash"
  },
  "Standart Ustunlar Sxemasi": {
    "en": "Standard Column Schema",
    "ru": "Стандартная схема столбцов",
    "uz-Latn": "Standart Ustunlar Sxemasi"
  },
  "ToshTech 2026–2027 расмий иш режа формати қуйидаги 13 та устундан иборат:": {
    "en": "The official ToshTech 2026–2027 work plan format consists of the following 13 columns:",
    "ru": "Официальный формат плана работ ToshTech 2026–2027 состоит из следующих 13 столбцов:",
    "uz-Latn": "ToshTech 2026–2027 rasmiy ish rejasi formati quyidagi 13 ta ustundan iborat:"
  },
  ".": {
    "en": ".",
    "ru": ".",
    "uz-Latn": "."
  },
  "Bo'sh Shablonni Ko'chirib Olish": {
    "en": "Download Blank Template",
    "ru": "Скачать пустой шаблон",
    "uz-Latn": "Bo'sh shablonni yuklab olish"
  },
  "Excel Tahlil Xulosasi:": {
    "en": "Excel Analysis Summary:",
    "ru": "Итог анализа Excel:",
    "uz-Latn": "Excel tahlili xulosasi:"
  },
  "ta yangi topshiriq aniqlandi": {
    "en": "new tasks identified",
    "ru": "новых задач обнаружено",
    "uz-Latn": "ta yangi topshiriq aniqlandi"
  },
  "Bazaga Saqlash va Telegramga Yuborish": {
    "en": "Save to Database and Send to Telegram",
    "ru": "Сохранить в базу и отправить в Telegram",
    "uz-Latn": "Bazaga saqlash va Telegramga yuborish"
  },
  "Topshiriqlar muvaffaqiyatli import qilindi va mas'ul xodimlarning Telegramiga jo'natildi!": {
    "en": "Tasks successfully imported and sent to the responsible employees' Telegram!",
    "ru": "Задачи успешно импортированы и отправлены в Telegram ответственным сотрудникам!",
    "uz-Latn": "Topshiriqlar muvaffaqiyatli import qilindi va mas'ul xodimlarning Telegramiga jo'natildi!"
  },
  "Bildirishnomalar:": {
    "en": "Notifications:",
    "ru": "Уведомления:",
    "uz-Latn": "Bildirishnomalar:"
  },
  "Kod": {
    "en": "Code",
    "ru": "Код",
    "uz-Latn": "Kod"
  },
  "Topshiriq Nomi": {
    "en": "Task Name",
    "ru": "Название задачи",
    "uz-Latn": "Topshiriq nomi"
  },
  "Bo'lim": {
    "en": "Department",
    "ru": "Отдел",
    "uz-Latn": "Bo'lim"
  },
  "Mas'ul Xodim": {
    "en": "Responsible Employee",
    "ru": "Ответственный сотрудник",
    "uz-Latn": "Mas'ul xodim"
  },
  "Muhimlik": {
    "en": "Priority",
    "ru": "Важность",
    "uz-Latn": "Muhimlik"
  },
  "Muddat": {
    "en": "Deadline",
    "ru": "Срок",
    "uz-Latn": "Muddat"
  },
  "Bo'lim Boshlig'i & Rektorat": {
    "en": "Department Head & Rectorate",
    "ru": "Начальник отдела и Ректорат",
    "uz-Latn": "Bo'lim boshlig'i & Rektorat"
  },
  "Proof-of-Work Verification Protocol": {
    "en": "Proof-of-Work Verification Protocol",
    "ru": "Протокол верификации Proof-of-Work",
    "uz-Latn": "Bajarilgan ish dalilini tekshirish protokoli"
  },
  "Bajarganlik Isbotlarini Tekshirish va Qabul Qilish Konsoli": {
    "en": "Proof of Completion Verification and Acceptance Console",
    "ru": "Консоль проверки и принятия доказательств выполнения",
    "uz-Latn": "Bajarilgan ish dalillarini tekshirish va qabul qilish konsoli"
  },
  "Kutilayotganlar (": {
    "en": "Pending (",
    "ru": "Ожидающие (",
    "uz-Latn": "Kutilayotganlar ("
  },
  ")": {
    "en": ")",
    "ru": ")",
    "uz-Latn": " )"
  },
  "Tekshirilganlar Tarixi": {
    "en": "Verification History",
    "ru": "История проверок",
    "uz-Latn": "Ko'rik tarixi"
  },
  "Barchasi": {
    "en": "All",
    "ru": "Все",
    "uz-Latn": "Barchasi"
  },
  "Tekshiruv Navbati": {
    "en": "Verification Queue",
    "ru": "Очередь на проверку",
    "uz-Latn": "Ko'rik navbati"
  },
  "ta topshiriq": {
    "en": "tasks",
    "ru": "задач",
    "uz-Latn": "ta topshiriq"
  },
  "Hozirda tekshirish uchun topshirilgan yangi isbotlar yo'q.": {
    "en": "No new proofs submitted for review.",
    "ru": "Нет новых доказательств на проверку.",
    "uz-Latn": "Hozirda ko'rik uchun topshirilgan yangi bajarilgan ish dalillari yo'q."
  },
  "KO'RIKDA": {
    "en": "IN REVIEW",
    "ru": "НА ПРОВЕРКЕ",
    "uz-Latn": "KO‘RIKDA"
  },
  "TASDIQLANGAN": {
    "en": "APPROVED",
    "ru": "УТВЕРЖДЕНО",
    "uz-Latn": "TASDIQLANGAN"
  },
  "QAYTARILGAN": {
    "en": "REJECTED",
    "ru": "ОТКЛОНЕНО",
    "uz-Latn": "QAYTARILGAN"
  },
  "Ijrochi:": {
    "en": "Executor:",
    "ru": "Исполнитель:",
    "uz-Latn": "Ijrochi:"
  },
  "Bo'lim:": {
    "en": "Department:",
    "ru": "Отдел:",
    "uz-Latn": "Bo‘lim:"
  },
  "Topshirildi:": {
    "en": "Submitted:",
    "ru": "Представлено:",
    "uz-Latn": "Topshirildi:"
  },
  "Mas'ul:": {
    "en": "Responsible:",
    "ru": "Ответственный:",
    "uz-Latn": "Mas’ul:"
  },
  "(": {
    "en": "(",
    "ru": "(",
    "uz-Latn": "\"},"
  },
  "Telegram ulangan": {
    "en": "Telegram connected",
    "ru": "Telegram подключен",
    "uz-Latn": "Telegram ulangan"
  },
  "Kutilayotgan Natija (KPI)": {
    "en": "Expected Result (KPI)",
    "ru": "Ожидаемый результат (KPI)",
    "uz-Latn": "Kutilayotgan natija (KPI)"
  },
  "Reja talablariga mos natija": {
    "en": "Result compliant with plan requirements",
    "ru": "Результат соответствует требованиям плана",
    "uz-Latn": "Ish rejasi talablariga mos natija"
  },
  "Qabul Qilish Mezonlari": {
    "en": "Acceptance Criteria",
    "ru": "Критерии приемки",
    "uz-Latn": "Qabul qilish mezonlari"
  },
  "Hujjatli hisobot yoki dalolatnoma": {
    "en": "Documentary report or statement",
    "ru": "Документальный отчет или акт",
    "uz-Latn": "Hujjatli hisobot yoki dalolatnoma"
  },
  "Taqdim Etilgan Isbot (Proof-of-Work)": {
    "en": "Submitted Proof (Proof-of-Work)",
    "ru": "Представленное доказательство (Proof-of-Work)",
    "uz-Latn": "Taqdim etilgan bajarilgan ish dalili"
  },
  "ENFORCED PROTOCOL": {
    "en": "ENFORCED PROTOCOL",
    "ru": "ENFORCED PROTOCOL",
    "uz-Latn": "MAJBURIY PROTOKOL"
  },
  "1. Xodimning Matnli Xulosasi:": {
    "en": "1. Employee Text Summary:",
    "ru": "1. Текстовое заключение сотрудника:",
    "uz-Latn": "1. Xodimning matnli xulosasi:"
  },
  "belgi (min. 20 talab)": {
    "en": "characters (min. 20 required)",
    "ru": "символов (мин. 20)",
    "uz-Latn": "belgi (min. 20 ta talab qilinadi)"
  },
  "2. Biriktirilgan Hujjat / Fotosurat:": {
    "en": "2. Attached Document / Photo:",
    "ru": "2. Прикрепленный документ / Фото:",
    "uz-Latn": "2. Biriktirilgan hujjat / fotosurat:"
  },
  "2.1 MB": {
    "en": "2.1 MB",
    "ru": "2.1 МБ",
    "uz-Latn": "2.1 MB"
  },
  "· PDF/Hujjat": {
    "en": "· PDF/Document",
    "ru": "· PDF/Документ",
    "uz-Latn": "· PDF/Hujjat"
  },
  "Ko'rish": {
    "en": "View",
    "ru": "Просмотр",
    "uz-Latn": "Ko'rish"
  },
  "3. Tashqi Havola (GitHub / Cloud / Tizim):": {
    "en": "3. External Link (GitHub / Cloud / System):",
    "ru": "3. Внешняя ссылка (GitHub / Облако / Система):",
    "uz-Latn": "3. Tashqi havola (GitHub / Cloud / Tizim):"
  },
  "Ochish": {
    "en": "Open",
    "ru": "Открыть",
    "uz-Latn": "Ochish"
  },
  "APPROVED": {
    "en": "APPROVED",
    "ru": "УТВЕРЖДЕНО",
    "uz-Latn": "Tasdiqlangan"
  },
  "Tasdiqlangan": {
    "en": "Approved",
    "ru": "Утверждено",
    "uz-Latn": "Tasdiqlangan"
  },
  "Qaytarilgan": {
    "en": "Returned",
    "ru": "Возвращено",
    "uz-Latn": "Qaytarilgan"
  },
  "Izoh: \"": {
    "en": "Comment: \"",
    "ru": "Комментарий: \"",
    "uz-Latn": "Izoh: \""
  },
  "Izohsiz": {
    "en": "No comments",
    "ru": "Без комментариев",
    "uz-Latn": "Izohsiz"
  },
  "\"": {
    "en": "\"",
    "ru": "\"",
    "uz-Latn": "\""
  },
  "Tekshiruvchi:": {
    "en": "Verifier:",
    "ru": "Проверяющий:",
    "uz-Latn": "Tekshiruvchi:"
  },
  "Bo'lim Boshlig'i / Rektorat Xulosasi va Izohi:": {
    "en": "Department Head / Administration Summary and Comment:",
    "ru": "Заключение и комментарий начальника отдела / ректората:",
    "uz-Latn": "Bo'lim boshlig'i / Rektorat xulosasi va izohi:"
  },
  "Masalan: Barcha talablar to'liq bajarildi. Ijroga qabul qilindi... (Qaytarishda sabab kiritish majburiydir)": {
    "en": "Example: All requirements met. Accepted for execution... (Reason required for rejection)",
    "ru": "Например: Все требования выполнены. Принято к исполнению... (При отклонении причина обязательна)",
    "uz-Latn": "Masalan: Barcha talablar to'liq bajarildi. Ijroga qabul qilindi... (Qaytarishda sabab kiritish majburiydir)"
  },
  "Qaytarish va Qayta Ishlash Talab Qilish": {
    "en": "Reject and Request Rework",
    "ru": "Отклонить и запросить доработку",
    "uz-Latn": "Qaytarish va qayta ishlash talab qilish"
  },
  "Tasdiqlash va Topshiriqni Yakunlash (COMPLETED)": {
    "en": "Approve and Complete Task (COMPLETED)",
    "ru": "Утвердить и завершить задачу (COMPLETED)",
    "uz-Latn": "Tasdiqlash va topshiriqni yakunlash (COMPLETED)"
  },
  "Chap tomondan tekshirish uchun topshiriqni tanlang.": {
    "en": "Select a task on the left to verify.",
    "ru": "Выберите задачу слева для проверки.",
    "uz-Latn": "Chap tomondan ko'rik uchun topshiriqni tanlang."
  },
  "Orkestratsiya Dvigateli": {
    "en": "Orchestration Engine",
    "ru": "Движок оркестрации",
    "uz-Latn": "Orkestratsiya dvigateli"
  },
  "Redis + Queue Worker Engine": {
    "en": "Redis + Queue Worker Engine",
    "ru": "Redis + Queue Worker Engine",
    "uz-Latn": "Redis va navbat ishchi mexanizmi"
  },
  "Avtomatlashtirilgan Telegram Bildirishnoma va Scheduler Navbati": {
    "en": "Automated Telegram Notifications and Scheduler Queue",
    "ru": "Автоматизированные Telegram-уведомления и очередь планировщика",
    "uz-Latn": "Avtomatlashtirilgan Telegram bildirishnoma va Scheduler navbati"
  },
  "REDIS / QUEUE: ONLINE": {
    "en": "REDIS / QUEUE: ONLINE",
    "ru": "REDIS / QUEUE: ONLINE",
    "uz-Latn": "Redis / navbat: onlayn"
  },
  "Faol Dvigatel": {
    "en": "Active Engine",
    "ru": "Активный движок",
    "uz-Latn": "Faol dvigatel"
  },
  "UniTask Scheduler v2.6": {
    "en": "UniTask Scheduler v2.6",
    "ru": "UniTask Scheduler v2.6",
    "uz-Latn": "UniTask rejalashtiruvchisi v2.6"
  },
  "Node.js / Express Workers": {
    "en": "Node.js / Express Workers",
    "ru": "Node.js / Express Workers",
    "uz-Latn": "Node.js / Express ishchilari"
  },
  "Rejalashtirilgan Jarayonlar": {
    "en": "Scheduled Processes",
    "ru": "Запланированные процессы",
    "uz-Latn": "Rejalashtirilgan jarayonlar"
  },
  "ta vazifa": {
    "en": "tasks",
    "ru": "задач",
    "uz-Latn": "ta topshiriq"
  },
  "Cron + Event Triggered": {
    "en": "Cron + Event Triggered",
    "ru": "Cron + Event Triggered",
    "uz-Latn": "Cron va hodisa asosida"
  },
  "Yuborilgan Telegram Xabarlari": {
    "en": "Sent Telegram Messages",
    "ru": "Отправленные Telegram-сообщения",
    "uz-Latn": "Yuborilgan Telegram xabarlari"
  },
  "ta signal": {
    "en": "alerts",
    "ru": "сигналов",
    "uz-Latn": "ta signal"
  },
  "Yetkazish darajasi: 100%": {
    "en": "Delivery Rate: 100%",
    "ru": "Уровень доставки: 100%",
    "uz-Latn": "Yetkazish darajasi: 100%"
  },
  "Redis Kesh Holati": {
    "en": "Redis Cache Status",
    "ru": "Статус кэша Redis",
    "uz-Latn": "Redis kesh holati"
  },
  "Memory: 4.8 MB": {
    "en": "Memory: 4.8 MB",
    "ru": "Memory: 4.8 MB",
    "uz-Latn": "Xotira: 4.8 MB"
  },
  "0 ta muvaffaqiyatsiz navbat": {
    "en": "0 failed queues",
    "ru": "0 невыполненных очередей",
    "uz-Latn": "0 ta muvaffaqiyatsiz navbat [L2]"
  },
  "Avtomatik Fon Jarayonlari (Background Cron Jobs)": {
    "en": "Automatic Background Processes (Background Cron Jobs)",
    "ru": "Автоматические фоновые процессы (Background Cron Jobs)",
    "uz-Latn": "Avtomatik Fon Jarayonlari (Background Cron Jobs) [L3]"
  },
  "Har bir jarayon ToshTech yillik ish rejasidagi vazifalar muddatini tekshiradi va Telegramga avtomatik signal yuboradi.": {
    "en": "Each process checks the deadlines of tasks in the ToshTech annual work plan and sends an automatic alert via Telegram.",
    "ru": "Каждый процесс проверяет сроки задач в годовом плане ToshTech и автоматически отправляет сигнал в Telegram.",
    "uz-Latn": "Har bir jarayon ToshTech yillik ish rejasidagi topshiriqlar muddatini tekshiradi va Telegramga avtomatik signal yuboradi. [L4]"
  },
  "Queue:": {
    "en": "Queue:",
    "ru": "Очередь:",
    "uz-Latn": "Navbat: [L5]"
  },
  "Jadval:": {
    "en": "Schedule:",
    "ru": "Расписание:",
    "uz-Latn": "Jadval: [L6]"
  },
  "Oxirgi ishga tushishi:": {
    "en": "Last run:",
    "ru": "Последний запуск:",
    "uz-Latn": "Oxirgi ishga tushishi: [L7]"
  },
  "Bajarilmoqda": {
    "en": "In progress",
    "ru": "В процессе",
    "uz-Latn": "Bajarilmoqda"
  },
  "Qo'lda Ishga Tushirish": {
    "en": "Manual Trigger",
    "ru": "Ручной запуск",
    "uz-Latn": "Qo'lda Ishga Tushirish [L8]"
  },
  "Telegram Xabarlar Trassasi (Outbox Stream)": {
    "en": "Telegram Message Stream (Outbox Stream)",
    "ru": "Поток Telegram-сообщений (Outbox Stream)",
    "uz-Latn": "Telegram Xabarlar Trassasi (Outbox Stream) [L9]"
  },
  "ToshTech xodimlariga Telegram orqali yuborilgan jonli ogohlantirishlar va inline tugmali signallar": {
    "en": "Live alerts and inline button notifications sent to ToshTech staff via Telegram",
    "ru": "Живые оповещения и сигналы с кнопками, отправленные сотрудникам ToshTech через Telegram",
    "uz-Latn": "ToshTech xodimlariga Telegram orqali yuborilgan jonli ogohlantirishlar va inline tugmali signallar [L10]"
  },
  "Jami:": {
    "en": "Total:",
    "ru": "Итого:",
    "uz-Latn": "Jami: [L11]"
  },
  "ta": {
    "en": "count",
    "ru": "шт.",
    "uz-Latn": "ta [L12]"
  },
  "· ID:": {
    "en": "· ID:",
    "ru": "· ID:",
    "uz-Latn": "· ID: [L13]"
  },
  "Inline Action Buttons:": {
    "en": "Inline Action Buttons:",
    "ru": "Inline Action Buttons:",
    "uz-Latn": "Inline Action Buttons: [L14]"
  },
  "Modullar & Nazorat": {
    "en": "Modules & Control",
    "ru": "Модули и контроль",
    "uz-Latn": "Modullar va nazorat"
  },
  "Telegram Mini App": {
    "en": "Telegram Mini App",
    "ru": "Telegram Mini App",
    "uz-Latn": "Telegram Mini Ilovasi"
  },
  "@UniTaskBot": {
    "en": "@UniTaskBot",
    "ru": "@UniTaskBot",
    "uz-Latn": "@UniTaskBot"
  },
  "Xodimlar uchun mobil topshiriqlar, Clock-In va Proof-of-Work yuklash interfeysi.": {
    "en": "Mobile task interface for staff, Clock-In and Proof-of-Work upload.",
    "ru": "Интерфейс мобильных задач для сотрудников, Clock-In и загрузка Proof-of-Work.",
    "uz-Latn": "Xodimlar uchun mobil topshiriqlar, Clock-In va bajarilgan ish dalilini yuklash interfeysi."
  },
  "Mini Appni ochish": {
    "en": "Open Mini App",
    "ru": "Открыть Mini App",
    "uz-Latn": "Mini ilovani ochish"
  },
  "Telegram:": {
    "en": "Telegram:",
    "ru": "Telegram:",
    "uz-Latn": "Telegram:"
  },
  "Ulangan (ID:": {
    "en": "Connected (ID:",
    "ru": "Подключено (ID:",
    "uz-Latn": "Ulangan (ID:"
  },
  "***)": {
    "en": "***)",
    "ru": "***)",
    "uz-Latn": "***)"
  },
  "Ulanmagan": {
    "en": "Not connected",
    "ru": "Не подключено",
    "uz-Latn": "Ulanmagan"
  },
  "БАЖАРИЛДИ": {
    "en": "COMPLETED",
    "ru": "ВЫПОЛНЕНО",
    "uz-Latn": "BAJARILDI"
  },
  "КЎРИКДА": {
    "en": "UNDER REVIEW",
    "ru": "НА РАССМОТРЕНИИ",
    "uz-Latn": "KO'RIKDA"
  },
  "ЖАРАЁНДА": {
    "en": "IN PROGRESS",
    "ru": "В ПРОЦЕССЕ",
    "uz-Latn": "JARAYONDA"
  },
  "МУДДАТИ ЎТГАН": {
    "en": "OVERDUE",
    "ru": "ПРОСРОЧЕНО",
    "uz-Latn": "MUDDATI O'TGAN"
  },
  "ҚАЙТАРИЛГАН": {
    "en": "RETURNED",
    "ru": "ВОЗВРАЩЕНО",
    "uz-Latn": "QAYTARILGAN"
  },
  "БИРИКТИРИЛГАН": {
    "en": "ASSIGNED",
    "ru": "НАЗНАЧЕНО",
    "uz-Latn": "BIRIKTIRILGAN"
  },
  "Муддати яқинлашаётган топшириқлар огоҳлантириши": {
    "en": "Upcoming task deadline alert",
    "ru": "Уведомление о приближающихся сроках задач",
    "uz-Latn": "Muddati yaqinlashayotgan topshiriqlar ogohlantirishi"
  },
  "та топшириқ": {
    "en": "tasks",
    "ru": "задач",
    "uz-Latn": "ta topshiriq"
  },
  "та шошилинч": {
    "en": "urgent",
    "ru": "срочных",
    "uz-Latn": "ta shoshilinch"
  },
  "Яқин 14 кун ичида муддати тугайдиган ёки кечиктирилган топшириқлар аниқланди. Ҳисоботларни қабул қилиш ва ижрони тезлаштиринг.": {
    "en": "Tasks due or overdue within the next 14 days identified. Please accept reports and accelerate execution.",
    "ru": "Выявлены задачи с истекающим сроком в ближайшие 14 дней или просроченные. Примите отчеты и ускорьте выполнение.",
    "uz-Latn": "Yaqin 14 kun ichida muddati tugaydigan yoki kechiktirilgan topshiriqlar aniqlandi. Hisobotlarni qabul qilish va ijroni tezlashtiring."
  },
  "+": {
    "en": "+",
    "ru": "+",
    "uz-Latn": "+"
  },
  "та яна": {
    "en": "more",
    "ru": "ещё",
    "uz-Latn": "ta yana"
  },
  "Фақат муддати яқинлашган ёки ўтган топшириқларни кўрсатиш": {
    "en": "Show only upcoming or overdue tasks",
    "ru": "Показать только приближающиеся или просроченные задачи",
    "uz-Latn": "Faqat muddati yaqinlashgan yoki o'tgan topshiriqlarni ko'rsatish"
  },
  "Барчасини кўрсатиш": {
    "en": "Show all",
    "ru": "Показать все",
    "uz-Latn": "Hammasini ko'rsatish"
  },
  "Хавфдагиларни филтрлаш": {
    "en": "Filter at risk",
    "ru": "Отфильтровать рискованные",
    "uz-Latn": "Xavfdagilarni filtrlash"
  },
  "Огоҳлантиришни ёпиш (dismiss)": {
    "en": "Dismiss alert",
    "ru": "Закрыть уведомление (dismiss)",
    "uz-Latn": "Ogohlantirishni yopish (dismiss)"
  },
  "ToshTech Ишлар Режаси Реэстри": {
    "en": "ToshTech Task Registry",
    "ru": "Реестр задач ToshTech",
    "uz-Latn": "ToshTech Ish rejasi reestri"
  },
  "та расмий топшириқ": {
    "en": "official tasks",
    "ru": "официальных задач",
    "uz-Latn": "ta rasmiy topshiriq"
  },
  "2027 йил сентябрь ойига қадар “ToshTech” техника университети томонидан амалга ошириладиган ишлар": {
    "en": "Tasks to be completed by ToshTech Technical University by September 2027",
    "ru": "Работы, выполняемые техническим университетом ToshTech до сентября 2027 года",
    "uz-Latn": "2027 yil sentyabr oyiga qadar “ToshTech” texnika universiteti tomonidan amalga oshiriladigan ishlar"
  },
  "Жадвал кўриниши": {
    "en": "Table view",
    "ru": "Вид таблицы",
    "uz-Latn": "Jadval ko'rinishi"
  },
  "Жадвал": {
    "en": "Table",
    "ru": "Таблица",
    "uz-Latn": "Jadval"
  },
  "Муҳимлик тахтаси (Drag & Drop)": {
    "en": "Priority Board (Drag & Drop)",
    "ru": "Доска приоритетов (Drag & Drop)",
    "uz-Latn": "Muhimlik taxtasi (Drag & Drop)"
  },
  "Муҳимлик Тахтаси": {
    "en": "Priority Board",
    "ru": "Доска приоритетов",
    "uz-Latn": "Muhimlik Taxtasi"
  },
  "Муддат огоҳлантиришларини қайта очиш": {
    "en": "Reopen deadline alerts",
    "ru": "Открыть уведомления о сроках снова",
    "uz-Latn": "Muddat ogohlantirishlarini qayta ochish"
  },
  "Муддат Хавфи (": {
    "en": "Deadline Risk (",
    "ru": "Риск просрочки (",
    "uz-Latn": "Muddat Xavfi ("
  },
  "Асл PDF": {
    "en": "Original PDF",
    "ru": "Оригинал PDF",
    "uz-Latn": "Asl PDF"
  },
  "Барча 92 та расмий топшириқни Excel (.xlsx) форматида юклаб олиш": {
    "en": "Download all 92 official tasks in Excel (.xlsx) format",
    "ru": "Скачать все 92 официальные задачи в формате Excel (.xlsx)",
    "uz-Latn": "Barcha 92 ta rasmiy topshiriqni Excel (.xlsx) formatida yuklab olish"
  },
  "Excel (.xlsx)": {
    "en": "Excel (.xlsx)",
    "ru": "Excel (.xlsx)",
    "uz-Latn": "Excel (.xlsx)"
  },
  "Барча топшириқларни CSV файл сифатида юклаб олиш": {
    "en": "Download all tasks as CSV",
    "ru": "Скачать все задачи в формате CSV",
    "uz-Latn": "Barcha topshiriqlarni CSV fayl sifatida yuklab olish"
  },
  "CSV Экспорт": {
    "en": "CSV Export",
    "ru": "CSV Экспорт",
    "uz-Latn": "CSV Eksport"
  },
  "(.csv)": {
    "en": "(.csv)",
    "ru": "(.csv)",
    "uz-Latn": "(.csv)"
  },
  "Янги Топшириқ": {
    "en": "New Task",
    "ru": "Новая задача",
    "uz-Latn": "Yangi Topshiriq"
  },
  "Топшириқ номи, Т/р рақами (№1, TT-2026-01), масъул, бўлим ёки калит сўзлар...": {
    "en": "Task name, serial number (№1, TT-2026-01), responsible, department, or keywords...",
    "ru": "Название задачи, порядковый номер (№1, TT-2026-01), ответственный, отдел или ключевые слова...",
    "uz-Latn": "Topshiriq nomi, T/r raqami (№1, TT-2026-01), mas'ul, bo'lim yoki kalit so'zlar..."
  },
  "Қидирувни тозалаш": {
    "en": "Clear search",
    "ru": "Очистить поиск",
    "uz-Latn": "Qidiruvni tozalash"
  },
  "/": {
    "en": "/",
    "ru": "/",
    "uz-Latn": "/"
  },
  "📂 Барча Категориялар (": {
    "en": "📂 All Categories (",
    "ru": "📂 Все категории (",
    "uz-Latn": "📂 Barcha Kategoriyalar ("
  },
  "🏢 Барча бўлинмалар (": {
    "en": "🏢 All Departments (",
    "ru": "🏢 Все отделы (",
    "uz-Latn": "🏢 Barcha bo'linmalar ("
  },
  "Категориялар:": {
    "en": "Categories:",
    "ru": "Категории:",
    "uz-Latn": "Kategoriyalar:"
  },
  "Барчаси": {
    "en": "All",
    "ru": "Все",
    "uz-Latn": "Barchasi"
  },
  "Тезкор қидирув:": {
    "en": "Quick search:",
    "ru": "Быстрый поиск:",
    "uz-Latn": "Tezkor qidiruv:"
  },
  "Муҳимлик:": {
    "en": "Priority:",
    "ru": "Важность:",
    "uz-Latn": "Muhimlik:"
  },
  "Ҳолат:": {
    "en": "Status:",
    "ru": "Статус:",
    "uz-Latn": "Holat:"
  },
  "Муддати яқинлашган ва ўтган топшириқлар фильтри": {
    "en": "Upcoming and overdue tasks filter",
    "ru": "Фильтр приближающихся и просроченных задач",
    "uz-Latn": "Muddati yaqinlashgan va o'tgan topshiriqlar filtri"
  },
  "Муддат Хавфи": {
    "en": "Deadline Risk",
    "ru": "Риск просрочки",
    "uz-Latn": "Muddat xavfi"
  },
  "Фаол фильтрлар:": {
    "en": "Active filters:",
    "ru": "Активные фильтры:",
    "uz-Latn": "Faol filtrlar:"
  },
  "Қидирув: «": {
    "en": "Search: «",
    "ru": "Поиск: «",
    "uz-Latn": "Qidiruv: «"
  },
  "»": {
    "en": "»",
    "ru": "»",
    "uz-Latn": "»"
  },
  "Категория:": {
    "en": "Category:",
    "ru": "Категория:",
    "uz-Latn": "Kategoriya:"
  },
  "Бўлинма:": {
    "en": "Department:",
    "ru": "Отдел:",
    "uz-Latn": "Bo'lim:"
  },
  "⚠️ Муддат хавфи фильтри": {
    "en": "⚠️ Deadline risk filter",
    "ru": "⚠️ Фильтр риска сроков",
    "uz-Latn": "⚠️ Muddat xavfi filtri"
  },
  "Айни дамда сараланган топшириқларни CSV файл сифатида юклаб олиш": {
    "en": "Download filtered tasks as CSV",
    "ru": "Скачать отфильтрованные задачи как CSV",
    "uz-Latn": "Ayni damda saralangan topshiriqlarni CSV fayl sifatida yuklab olish"
  },
  "CSV Ҳисобот (": {
    "en": "CSV Report (",
    "ru": "CSV Отчет (",
    "uz-Latn": "CSV Hisobot ("
  },
  "Барча фильтрларни дастлабки ҳолатга қайтариш": {
    "en": "Reset all filters",
    "ru": "Сбросить все фильтры",
    "uz-Latn": "Barcha filtrlarni dastlabki holatga qaytarish"
  },
  "Тозалаш": {
    "en": "Clear",
    "ru": "Очистить",
    "uz-Latn": "Tozalash"
  },
  "Муҳимлик бўйича Drag & Drop:": {
    "en": "Drag & Drop by priority:",
    "ru": "Drag & Drop по приоритету:",
    "uz-Latn": "Muhimlik bo'yicha Drag & Drop:"
  },
  "Карточкаларни керакли устунга судраб ўтказинг ёки карточкадаги тугмача орқали ўзгартиринг.": {
    "en": "Drag cards to the desired column or change via button.",
    "ru": "Перетащите карточки в нужный столбец или измените через кнопку.",
    "uz-Latn": "Kartochkalarni kerakli ustunga sudrab o'tkazing yoki kartochkadagi tugmacha orqali o'zgartiring."
  },
  "Кўрсатилмоқда:": {
    "en": "Showing:",
    "ru": "Показано:",
    "uz-Latn": "Ko'rsatilmoqda:"
  },
  "Топшириқлар мавжуд эмас": {
    "en": "No tasks available",
    "ru": "Задачи отсутствуют",
    "uz-Latn": "Topshiriqlar mavjud emas"
  },
  "Судраб бу ерга ташланг": {
    "en": "Drag and drop here",
    "ru": "Перетащите сюда",
    "uz-Latn": "Sudrab bu yerga tashlang"
  },
  "Ушбу категория бўйича фильтрлаш": {
    "en": "Filter by this category",
    "ru": "Фильтровать по этой категории",
    "uz-Latn": "Ushbu kategoriya bo'yicha filtrlash"
  },
  "Ижро %": {
    "en": "Execution %",
    "ru": "Выполнение %",
    "uz-Latn": "Ijro %"
  },
  "%": {
    "en": "%",
    "ru": "%",
    "uz-Latn": "%"
  },
  "Муддат:": {
    "en": "Deadline:",
    "ru": "Срок:",
    "uz-Latn": "Muddat:"
  },
  "Кўчириш:": {
    "en": "Copy:",
    "ru": "Копировать:",
    "uz-Latn": "Ko'chirish:"
  },
  "🔴 CRIT": {
    "en": "🔴 CRIT",
    "ru": "🔴 CRIT",
    "uz-Latn": "🔴 KRITIK"
  },
  "🟠 HIGH": {
    "en": "🟠 HIGH",
    "ru": "🟠 HIGH",
    "uz-Latn": "🟠 YUQORI"
  },
  "🔵 MED": {
    "en": "🔵 MED",
    "ru": "🔵 MED",
    "uz-Latn": "🔵 O‘RTACA"
  },
  "⚪ LOW": {
    "en": "⚪ LOW",
    "ru": "⚪ LOW",
    "uz-Latn": "⚪ PAST"
  },
  "Telegram Mini Appда очиш": {
    "en": "Open in Telegram Mini App",
    "ru": "Открыть в Telegram Mini App",
    "uz-Latn": "Telegram Mini App'da ochish"
  },
  "Т/р": {
    "en": "No.",
    "ru": "№",
    "uz-Latn": "T/r"
  },
  "Иш Режа Номи & Категория": {
    "en": "Task Name & Category",
    "ru": "Название задачи & Категория",
    "uz-Latn": "Ish rejasi nomi & Kategoriya"
  },
  "Масъул Бўлим & Ходим": {
    "en": "Responsible Dept & Staff",
    "ru": "Ответственный отдел & Сотрудник",
    "uz-Latn": "Mas'ul bo'lim & Xodim"
  },
  "Муҳимлик": {
    "en": "Priority",
    "ru": "Важность",
    "uz-Latn": "Muhimlik"
  },
  "Ҳолат": {
    "en": "Status",
    "ru": "Статус",
    "uz-Latn": "Holat"
  },
  "Муддат & Огоҳлантириш": {
    "en": "Deadline & Alert",
    "ru": "Срок & Оповещение",
    "uz-Latn": "Muddat & Ogohlantirish"
  },
  "Муҳокама / TMA": {
    "en": "Discussion / TMA",
    "ru": "Обсуждение / TMA",
    "uz-Latn": "Muhokama / TMA"
  },
  "Танланган мезонларга мос топшириқлар топилмади.": {
    "en": "No tasks match the selected criteria.",
    "ru": "Задачи по выбранным критериям не найдены.",
    "uz-Latn": "Tanlangan mezonlarga mos topshiriqlar topilmadi."
  },
  "Қидирув сўзини ўзгартириб кўринг ёки фильтрларни тозаланг.": {
    "en": "Try changing the search term or clearing filters.",
    "ru": "Попробуйте изменить поисковый запрос или сбросить фильтры.",
    "uz-Latn": "Qidiruv so'zini o'zgartirib ko'ring yoki filtrlarni tozalang."
  },
  "Фильтрларни тозалаш": {
    "en": "Clear filters",
    "ru": "Сбросить фильтры",
    "uz-Latn": "Filtrlarni tozalash"
  },
  "TT-2026-": {
    "en": "TT-2026-",
    "ru": "TT-2026-",
    "uz-Latn": "TT-2026-"
  },
  "Муҳимликни танлаш": {
    "en": "Select priority",
    "ru": "Выбрать важность",
    "uz-Latn": "Muhimlikni tanlash"
  },
  "🔴 CRITICAL": {
    "en": "🔴 CRITICAL",
    "ru": "🔴 CRITICAL",
    "uz-Latn": "🔴 KRITIK"
  },
  "🔵 MEDIUM": {
    "en": "🔵 MEDIUM",
    "ru": "🔵 СРЕДНИЙ",
    "uz-Latn": "🔵 O'RTA"
  },
  "COMPLETED": {
    "en": "COMPLETED",
    "ru": "COMPLETED",
    "uz-Latn": "BAJARILDI"
  },
  "Якунланган": {
    "en": "Completed",
    "ru": "Завершено",
    "uz-Latn": "Yakunlangan"
  },
  "Муҳокама оқимини очиш": {
    "en": "Open discussion thread",
    "ru": "Открыть поток обсуждения",
    "uz-Latn": "Muhokama oqimini ochish"
  },
  "Т/р:": {
    "en": "No:",
    "ru": "№:",
    "uz-Latn": "T/r:"
  },
  "та фикр": {
    "en": "comments",
    "ru": "комментария",
    "uz-Latn": "ta fikr"
  },
  "Асосий Тавсиф": {
    "en": "Main Description",
    "ru": "Основное описание",
    "uz-Latn": "Asosiy tavsif"
  },
  "Жамоа Муҳокамаси (Thread)": {
    "en": "Team Discussion (Thread)",
    "ru": "Обсуждение команды (Thread)",
    "uz-Latn": "Jamoa muhokamasi (Thread)"
  },
  "Proof-of-Work Исботлари": {
    "en": "Proof-of-Work Evidence",
    "ru": "Доказательства Proof-of-Work",
    "uz-Latn": "Bajarilgan ish dalili"
  },
  "Муҳимлик Даражасини Танлаш:": {
    "en": "Select Priority:",
    "ru": "Выбрать приоритет:",
    "uz-Latn": "Muhimlik darajasini tanlash:"
  },
  "Ҳозирги:": {
    "en": "Current:",
    "ru": "Текущий:",
    "uz-Latn": "Hozirgi:"
  },
  "Амалга Ошириш Механизми (Батафсил)": {
    "en": "Implementation Mechanism (Details)",
    "ru": "Механизм реализации (Детально)",
    "uz-Latn": "Amalga oshirish mexanizmi (Batafsil)"
  },
  "Тавсиф берилмаган.": {
    "en": "No description provided.",
    "ru": "Описание не предоставлено.",
    "uz-Latn": "Tavsif berilmagan."
  },
  "Кутилаётган Натижа": {
    "en": "Expected Result",
    "ru": "Ожидаемый результат",
    "uz-Latn": "Kutilayotgan natija"
  },
  "Масъул Бўлим:": {
    "en": "Responsible Department:",
    "ru": "Ответственный отдел:",
    "uz-Latn": "Mas'ul bo'lim:"
  },
  "Ижро учун Масъул:": {
    "en": "Person Responsible:",
    "ru": "Ответственный исполнитель:",
    "uz-Latn": "Ijro uchun mas'ul:"
  },
  "Бажариш Муддати:": {
    "en": "Deadline:",
    "ru": "Срок выполнения:",
    "uz-Latn": "Bajarish muddati:"
  },
  "Назорат (Проректор):": {
    "en": "Oversight (Prorector):",
    "ru": "Контроль (Проректор):",
    "uz-Latn": "Nazorat (Prorektor):"
  },
  "Молиялаштириш Манбаи:": {
    "en": "Funding Source:",
    "ru": "Источник финансирования:",
    "uz-Latn": "Moliyalashtirish manbai:"
  },
  "Ушбу топшириқда": {
    "en": "In this task",
    "ru": "В этой задаче",
    "uz-Latn": "Ushbu topshiriqda"
  },
  "та": {
    "en": "items",
    "ru": "шт.",
    "uz-Latn": "ta"
  },
  "жамоа муҳокамаси мавжуд.": {
    "en": "there is a team discussion.",
    "ru": "есть командное обсуждение.",
    "uz-Latn": "jamoa muhokamasi mavjud."
  },
  "Муҳокамага ўтиш →": {
    "en": "Go to discussion →",
    "ru": "Перейти к обсуждению →",
    "uz-Latn": "Muhokamaga o'tish →"
  },
  "Ишчи Гуруҳ ва Раҳбарият Муҳокамаси (Threaded Comments)": {
    "en": "Working Group and Management Discussion (Threaded Comments)",
    "ru": "Обсуждение рабочей группы и руководства (Threaded Comments)",
    "uz-Latn": "Ishchi guruh va rahbariyat muhokamasi (Threaded Comments)"
  },
  "Топшириқ ижроси, тўсиқлар ва оралиқ натижалар бўйича тўғридан-тўғри жамоавий мулоқот": {
    "en": "Direct team communication on task progress, obstacles, and interim results",
    "ru": "Прямое командное общение по выполнению задачи, препятствиям и промежуточным результатам",
    "uz-Latn": "Topshiriq ijrosi, to'siqlar va oraliq natijalar bo'yicha to'g'ridan-to'g'ri jamoaviy muloqot"
  },
  "Янги фикр қолдириш": {
    "en": "Leave a new comment",
    "ru": "Оставить новый комментарий",
    "uz-Latn": "Yangi fikr qoldirish"
  },
  "Топшириқ бўйича фикр, кўрсатма ёки савол ёзинг (жамоа аъзолари кўради)...": {
    "en": "Write a comment, instruction, or question about the task (team members will see it)...",
    "ru": "Напишите комментарий, указание или вопрос по задаче (увидят члены команды)...",
    "uz-Latn": "Topshiriq bo'yicha fikr, ko'rsatma yoki savol yozing (jamoa a'zolari ko'radi)..."
  },
  "Юбориш": {
    "en": "Send",
    "ru": "Отправить",
    "uz-Latn": "Yuborish"
  },
  "Ҳозирча жамоавий муҳокама бошланмаган.": {
    "en": "No team discussion started yet.",
    "ru": "Командное обсуждение еще не начато.",
    "uz-Latn": "Hozircha jamoaviy muhokama boshlanmagan."
  },
  "Биринчи бўлиб фикр ёзинг, масъул ходимларга кўрсатма беринг ёки савол қолдиринг!": {
    "en": "Be the first to comment, give instructions to responsible staff, or leave a question!",
    "ru": "Напишите комментарий первым, дайте указания ответственным сотрудникам или оставьте вопрос!",
    "uz-Latn": "Birinchi bo'lib fikr yozing, mas'ul xodimlarga ko'rsatma bering yoki savol qoldiring!"
  },
  "•": {
    "en": "•",
    "ru": "•",
    "uz-Latn": "•"
  },
  "Жавоб бериш": {
    "en": "Reply",
    "ru": "Ответить",
    "uz-Latn": "Javob berish"
  },
  "фикрига жавоб ёзиш:": {
    "en": "reply to comment:",
    "ru": "ответить на комментарий:",
    "uz-Latn": "fikriga javob yozish:"
  },
  "Бекор қилиш": {
    "en": "Cancel",
    "ru": "Отмена",
    "uz-Latn": "Bekor qilish"
  },
  "Ёпиш": {
    "en": "Close",
    "ru": "Закрыть",
    "uz-Latn": "Yopish"
  },
  "Жавоб юбориш": {
    "en": "Send reply",
    "ru": "Отправить ответ",
    "uz-Latn": "Javob yuborish"
  },
  "Proof-of-Work Ҳужжатли Далиллар (": {
    "en": "Proof-of-Work Documentary Evidence (",
    "ru": "Proof-of-Work Документальные доказательства (",
    "uz-Latn": "Bajarilgan ish dalili hujjatli dalillar ("
  },
  "Ҳали исбот юкланмаган": {
    "en": "No proof uploaded yet",
    "ru": "Доказательства еще не загружены",
    "uz-Latn": "Hali isbot yuklanmagan"
  },
  "Ижро исботлари юкланмаган": {
    "en": "Execution proof not uploaded",
    "ru": "Доказательства выполнения не загружены",
    "uz-Latn": "Ijro isbotlari yuklanmagan"
  },
  "Ходим топшириқни Telegram Mini App орқали ёки порталда бажаргач, ҳужжатли исботлар шу ерда кўринади.": {
    "en": "Once the employee completes the task via Telegram Mini App or the portal, documented proof will appear here.",
    "ru": "После того, как сотрудник выполнит задание через Telegram Mini App или портал, документальные подтверждения появятся здесь.",
    "uz-Latn": "Xodim topshiriqni Telegram Mini App orqali yoki portalda bajargach, hujjatli isbotlar shu yerda ko'rinadi."
  },
  "Ҳисобот ҳужжати": {
    "en": "Report document",
    "ru": "Отчетный документ",
    "uz-Latn": "Hisobot hujjati"
  },
  "Ҳаволани очиш": {
    "en": "Open link",
    "ru": "Открыть ссылку",
    "uz-Latn": "Havolani ochish"
  },
  "Telegram Mini Appда Ижро Этиш": {
    "en": "Execute in Telegram Mini App",
    "ru": "Выполнить в Telegram Mini App",
    "uz-Latn": "Telegram Mini Appda ijro etish"
  },
  "Ишни Бошлаш (Clock In)": {
    "en": "Start Work (Clock In)",
    "ru": "Начать работу (Clock In)",
    "uz-Latn": "Ishni Boshlash (Clock In)"
  },
  "ToshTech Иш Режасига Янги Топшириқ Қўшиш": {
    "en": "Add New Task to ToshTech Work Plan",
    "ru": "Добавить новую задачу в план работы ToshTech",
    "uz-Latn": "ToshTech ish rejasi-ga yangi topshiriq qo'shish"
  },
  "Режа Коди": {
    "en": "Plan Code",
    "ru": "Код плана",
    "uz-Latn": "Reja kodi"
  },
  "Муҳимлик Даражаси": {
    "en": "Priority Level",
    "ru": "Уровень важности",
    "uz-Latn": "Muhimlik darajasi"
  },
  "🔴 CRITICAL (Жуда юқори)": {
    "en": "🔴 CRITICAL (Very high)",
    "ru": "🔴 CRITICAL (Очень высокий)",
    "uz-Latn": "🔴 CRITICAL (Juda yuqori)"
  },
  "🟠 HIGH (Юқори)": {
    "en": "🟠 HIGH (High)",
    "ru": "🟠 HIGH (Высокий)",
    "uz-Latn": "🟠 HIGH (Yuqori)"
  },
  "🔵 MEDIUM (Ўртача)": {
    "en": "🔵 MEDIUM (Medium)",
    "ru": "🔵 MEDIUM (Средний)",
    "uz-Latn": "🔵 MEDIUM (O'rtacha)"
  },
  "⚪ LOW (Паст)": {
    "en": "⚪ LOW (Low)",
    "ru": "⚪ LOW (Низкий)",
    "uz-Latn": "⚪ LOW (Past)"
  },
  "Иш Режа Категорияси (Бўлим) *": {
    "en": "Work Plan Category (Department) *",
    "ru": "Категория плана работ (Отдел) *",
    "uz-Latn": "Ish rejasi kategoriyasi (bo'lim) *"
  },
  "Топшириқ Сарлавҳаси *": {
    "en": "Task Title *",
    "ru": "Заголовок задачи *",
    "uz-Latn": "Topshiriq sarlavhasi *"
  },
  "Масалан: Siemens Questa лабораториясида чипларни синовдан ўтказиш": {
    "en": "Example: Testing chips at Siemens Questa lab",
    "ru": "Например: Тестирование чипов в лаборатории Siemens Questa",
    "uz-Latn": "Masalan: Siemens Questa laboratoriyasida chiplarni sinovdan o'tkazish"
  },
  "Амалга Ошириш Механизми (Тавсиф)": {
    "en": "Implementation Mechanism (Description)",
    "ru": "Механизм реализации (Описание)",
    "uz-Latn": "Amalga oshirish mexanizmi (tavsif)"
  },
  "Топшириқни бажариш босқичлари ва аниқ вазифалар...": {
    "en": "Task completion stages and specific duties...",
    "ru": "Этапы выполнения задачи и конкретные обязанности...",
    "uz-Latn": "Topshiriqni bajarish bosqichlari va aniq vazifalar..."
  },
  "Масъул Бўлинма *": {
    "en": "Responsible Department *",
    "ru": "Ответственное подразделение *",
    "uz-Latn": "Mas'ul bo'linma *"
  },
  "Ижро учун Масъул *": {
    "en": "Responsible for Execution *",
    "ru": "Ответственный за выполнение *",
    "uz-Latn": "Ijro uchun mas'ul *"
  },
  "Бажариш Муддати *": {
    "en": "Deadline *",
    "ru": "Срок выполнения *",
    "uz-Latn": "Bajarish muddati *"
  },
  "Молиялаштириш Манбаи": {
    "en": "Funding Source",
    "ru": "Источник финансирования",
    "uz-Latn": "Moliyalashtirish manbai"
  },
  "Бекор Қилиш": {
    "en": "Cancel",
    "ru": "Отмена",
    "uz-Latn": "Bekor qilish"
  },
  "Юклатиш ва Telegram Хабар Юбориш": {
    "en": "Upload and Send Telegram Message",
    "ru": "Загрузить и отправить сообщение в Telegram",
    "uz-Latn": "Yuklatish va Telegram xabar yuborish"
  },
  "Yopish": {
    "en": "Close",
    "ru": "Закрыть",
    "uz-Latn": "Yopish"
  },
  "UniTask Bot": {
    "en": "UniTask Bot",
    "ru": "UniTask Bot",
    "uz-Latn": "UniTask Bot"
  },
  "✓": {
    "en": "✓",
    "ru": "✓",
    "uz-Latn": "✓"
  },
  "mini app · ToshTech": {
    "en": "mini app · ToshTech",
    "ru": "mini app · ToshTech",
    "uz-Latn": "Mini ilova · ToshTech"
  },
  "•••": {
    "en": "•••",
    "ru": "•••",
    "uz-Latn": "•••"
  },
  "@": {
    "en": "@",
    "ru": "@",
    "uz-Latn": "@"
  },
  "worker": {
    "en": "worker",
    "ru": "worker",
    "uz-Latn": "Xodim"
  },
  "checking": {
    "en": "checking",
    "ru": "проверка",
    "uz-Latn": "Tekshirilmoqda"
  },
  "Telegram sessiyasi tekshirilmoqda…": {
    "en": "Checking Telegram session…",
    "ru": "Проверка сессии Telegram…",
    "uz-Latn": "Telegram sessiyasi tekshirilmoqda…"
  },
  "Telegram tasdiqlashi talab qilinadi": {
    "en": "Telegram verification required",
    "ru": "Требуется подтверждение Telegram",
    "uz-Latn": "Telegram tasdiqlashi talab qilinadi"
  },
  "Topshiriq amallari faqat haqiqiy Telegram Mini App sessiyasi bilan ishlaydi.": {
    "en": "Task actions only work with a valid Telegram Mini App session.",
    "ru": "Действия по заданию работают только с активной сессией Telegram Mini App.",
    "uz-Latn": "Topshiriq amallari faqat haqiqiy Telegram Mini App sessiyasi bilan ishlaydi."
  },
  "ToshTech 2026–2027 Ишлар Режаси": {
    "en": "ToshTech 2026–2027 Work Plan",
    "ru": "План работ ToshTech на 2026–2027 гг.",
    "uz-Latn": "ToshTech 2026–2027 Ish rejasi"
  },
  "92 та Расмий Топшириқ": {
    "en": "92 Official Tasks",
    "ru": "92 официальных задания",
    "uz-Latn": "92 ta rasmiy topshiriq"
  },
  "Сизга тегишли:": {
    "en": "Assigned to you:",
    "ru": "Ваши задачи:",
    "uz-Latn": "Sizga tegishli:"
  },
  "та вазифа": {
    "en": "tasks",
    "ru": "задач",
    "uz-Latn": "ta vazifa"
  },
  "Топшириқ қидириш (Т/р, номи)...": {
    "en": "Search tasks (ID, name)...",
    "ru": "Поиск задач (ID, название)...",
    "uz-Latn": "Topshiriq qidirish (T/r, nomi)..."
  },
  "Биринчи 15 та": {
    "en": "First 15",
    "ru": "Первые 15",
    "uz-Latn": "Birinchi 15 ta"
  },
  "Жараёнда": {
    "en": "In progress",
    "ru": "В процессе",
    "uz-Latn": "Jarayonda"
  },
  "Барча 92 та": {
    "en": "All 92",
    "ru": "Все 92",
    "uz-Latn": "Barcha 92 ta"
  },
  "Muddat:": {
    "en": "Deadline:",
    "ru": "Срок:",
    "uz-Latn": "Muddat:"
  },
  "Ishni boshlash (Clock In)": {
    "en": "Start task (Clock In)",
    "ru": "Начать задачу (Clock In)",
    "uz-Latn": "Ishni boshlash"
  },
  "Proof-of-Work topshirish": {
    "en": "Submit Proof-of-Work",
    "ru": "Отправить Proof-of-Work",
    "uz-Latn": "Bajarilgan ish dalilini topshirish"
  },
  "Kutilmoqda: Rahbariyat ko'rigida": {
    "en": "Pending: Under review",
    "ru": "Ожидание: На проверке",
    "uz-Latn": "Kutilmoqda: Rahbariyat ko'rigida"
  },
  "✓ Tasdiqlangan va yakunlangan": {
    "en": "✓ Approved and completed",
    "ru": "✓ Утверждено и завершено",
    "uz-Latn": "✓ Tasdiqlangan va yakunlangan"
  },
  "Proof-of-Work Yuklash:": {
    "en": "Upload Proof-of-Work:",
    "ru": "Загрузить Proof-of-Work:",
    "uz-Latn": "Bajarilgan ish dalilini yuklash:"
  },
  "· Muddat:": {
    "en": "· Deadline:",
    "ru": "· Срок:",
    "uz-Latn": "· Muddat:"
  },
  "Isbot Muvaffaqiyatli Yuklandi!": {
    "en": "Proof uploaded successfully!",
    "ru": "Доказательство успешно загружено!",
    "uz-Latn": "Dalil muvaffaqiyatli yuklandi!"
  },
  "Topshiriq ko'rik holatiga o'tkazildi. Bo'lim boshlig'iga Telegram orqali xabar yuborildi.": {
    "en": "Task sent for review. Notification sent via Telegram to manager.",
    "ru": "Задача отправлена на проверку. Уведомление отправлено руководителю через Telegram.",
    "uz-Latn": "Topshiriq ko'rik holatiga o'tkazildi. Bo'lim boshlig'iga Telegram orqali xabar yuborildi."
  },
  "Isbot Turi *": {
    "en": "Proof Type *",
    "ru": "Тип доказательства *",
    "uz-Latn": "Dalil turi *"
  },
  "Hujjat / PDF": {
    "en": "Document / PDF",
    "ru": "Документ / PDF",
    "uz-Latn": "Hujjat / PDF"
  },
  "Fotosurat": {
    "en": "Photo",
    "ru": "Фото",
    "uz-Latn": "Fotosurat"
  },
  "Havola": {
    "en": "Link",
    "ru": "Ссылка",
    "uz-Latn": "Havola"
  },
  "Fayl Biriktirish *": {
    "en": "Attach File *",
    "ru": "Прикрепить файл *",
    "uz-Latn": "Fayl biriktirish *"
  },
  "Almashtirish": {
    "en": "Replace",
    "ru": "Заменить",
    "uz-Latn": "Almashtirish"
  },
  "Bajarilgan Ish Xulosasi (Narrative) *": {
    "en": "Task Summary (Narrative) *",
    "ru": "Отчет о работе (Narrative) *",
    "uz-Latn": "Bajarilgan ish xulosasi (narrative) *"
  },
  "/ 20 belgi": {
    "en": "/ 20 characters",
    "ru": "/ 20 символов",
    "uz-Latn": "/ 20 ta belgi"
  },
  "Topshiriq yuzasidan amalga oshirilgan ishlarni qisqacha bayon qiling (kamida 20 ta belgi)...": {
    "en": "Briefly describe the work performed (at least 20 characters)...",
    "ru": "Кратко опишите выполненную работу (минимум 20 символов)...",
    "uz-Latn": "Topshiriq yuzasidan amalga oshirilgan ishlarni qisqacha bayon qiling (kamida 20 ta belgi)..."
  },
  "Tashqi Havola (Google Drive / GitHub / Server)": {
    "en": "External Link (Google Drive / GitHub / Server)",
    "ru": "Внешняя ссылка (Google Drive / GitHub / Server)",
    "uz-Latn": "Tashqi havola (Google Drive / GitHub / Server)"
  },
  "https://drive.google.com/... yoki https://github.com/...": {
    "en": "https://drive.google.com/... or https://github.com/...",
    "ru": "https://drive.google.com/... или https://github.com/...",
    "uz-Latn": "https://drive.google.com/... yoki https://github.com/..."
  },
  "Ko'rikka Topshirish (SUBMIT)": {
    "en": "Submit for Review (SUBMIT)",
    "ru": "Отправить на проверку (SUBMIT)",
    "uz-Latn": "Ko'rikka topshirish (SUBMIT)"
  },
  "Rahbariyat Tezkor Tasdig'i": {
    "en": "Quick Manager Approval",
    "ru": "Быстрое утверждение руководителем",
    "uz-Latn": "Rahbariyatning tezkor tasdig'i"
  },
  "Bo'lim xodimlari tomonidan taqdim etilgan isbotlarni to'g'ridan-to'g'ri Telegramdan tasdiqlang.": {
    "en": "Approve proof submitted by team members directly via Telegram.",
    "ru": "Утверждайте доказательства, представленные сотрудниками, прямо через Telegram.",
    "uz-Latn": "Bo'lim xodimlari tomonidan taqdim etilgan bajarilgan ish dalillarini to'g'ridan-to'g'ri Telegram orqali tasdiqlang."
  },
  "Hozirda tasdiqlash uchun navbatda isbotlar yo'q.": {
    "en": "No proof pending for approval.",
    "ru": "Нет доказательств, ожидающих подтверждения.",
    "uz-Latn": "Hozirda tasdiqlash uchun navbatda bajarilgan ish dalillari mavjud emas."
  },
  "Xodim:": {
    "en": "Employee:",
    "ru": "Сотрудник:",
    "uz-Latn": "Xodim:"
  },
  "↩️ Qaytarish": {
    "en": "↩️ Return",
    "ru": "↩️ Вернуть",
    "uz-Latn": "↩️ Qaytarish"
  },
  "✅ Tasdiqlash": {
    "en": "✅ Approve",
    "ru": "✅ Утвердить",
    "uz-Latn": "✅ Tasdiqlash"
  },
  "Buyruq yoki xabar yozing...": {
    "en": "Write a command or message...",
    "ru": "Напишите команду или сообщение...",
    "uz-Latn": "Buyruq yoki xabar yozing..."
  },
  "Topshiriq": {
    "en": "Task",
    "ru": "Задача",
    "uz-Latn": "Topshiriq"
  },
  "Isbot (PoW)": {
    "en": "Proof (PoW)",
    "ru": "Доказательство (PoW)",
    "uz-Latn": "Bajarilgan ish dalili (PoW)"
  },
  "Tasdiq": {
    "en": "Confirmation",
    "ru": "Подтверждение",
    "uz-Latn": "Tasdiq"
  },
  "Bot Chat": {
    "en": "Bot Chat",
    "ru": "Чат с ботом",
    "uz-Latn": "Bot suhbati"
  },
  "UT": {
    "en": "UT",
    "ru": "UT",
    "uz-Latn": "UT"
  },
  "UniTask Platform": {
    "en": "UniTask Platform",
    "ru": "Платформа UniTask",
    "uz-Latn": "UniTask platformasi"
  },
  "ToshTech 2026–2027 Ish Rejasi": {
    "en": "ToshTech 2026–2027 Work Plan",
    "ru": "План работы ToshTech 2026–2027",
    "uz-Latn": "ToshTech 2026–2027 ish rejasi"
  },
  "dark": {
    "en": "dark",
    "ru": "темный",
    "uz-Latn": "Qorong‘i"
  },
  "Kunduzgi rejimga o'tish (Light Mode)": {
    "en": "Switch to Light Mode",
    "ru": "Переключить на светлую тему",
    "uz-Latn": "Kunduzgi rejimga o'tish"
  },
  "Tungi rejimga o'tish (Dark Mode)": {
    "en": "Switch to Dark Mode",
    "ru": "Переключить на темную тему",
    "uz-Latn": "Tungi rejimga o'tish"
  },
  "Toggle theme": {
    "en": "Toggle theme",
    "ru": "Переключить тему",
    "uz-Latn": "Mavzuni almashtirish"
  },
  "Interface language": {
    "en": "Interface language",
    "ru": "Язык интерфейса",
    "uz-Latn": "Interfeys tili"
  },
  "O'zbekcha (Lotin)": {
    "en": "Uzbek (Latin)",
    "ru": "Узбекский (Латиница)",
    "uz-Latn": "O'zbekcha (Lotin)"
  },
  "Ўзбекча (Кирилл)": {
    "en": "Uzbek (Cyrillic)",
    "ru": "Узбекский (Кириллица)",
    "uz-Latn": "O'zbekcha (Kirill)"
  },
  "Русский": {
    "en": "Russian",
    "ru": "Русский",
    "uz-Latn": "Rus tili"
  },
  "English": {
    "en": "English",
    "ru": "Английский",
    "uz-Latn": "Ingliz tili"
  },
  "Rol:": {
    "en": "Role:",
    "ru": "Роль:",
    "uz-Latn": "Rol:"
  },
  "DIRECTOR (Rektor)": {
    "en": "DIRECTOR (Rector)",
    "ru": "ДИРЕКТОР (Ректор)",
    "uz-Latn": "DIRECTOR (Rektor)"
  },
  "HEAD (Bo'lim Boshlig'i)": {
    "en": "HEAD (Department Head)",
    "ru": "РУКОВОДИТЕЛЬ (Начальник отдела)",
    "uz-Latn": "HEAD (Bo'lim boshlig'i)"
  },
  "ADMIN (Tizim Admini)": {
    "en": "ADMIN (System Admin)",
    "ru": "АДМИН (Системный администратор)",
    "uz-Latn": "ADMIN (Tizim admini)"
  },
  "WORKER (Ijrochi Xodim)": {
    "en": "WORKER (Executive Staff)",
    "ru": "РАБОТНИК (Исполнитель)",
    "uz-Latn": "WORKER (Ijrochi xodim)"
  },
  "USER (Murojaatchi)": {
    "en": "USER (Applicant)",
    "ru": "ПОЛЬЗОВАТЕЛЬ (Заявитель)",
    "uz-Latn": "USER (Murojaatchi)"
  },
  "Telegram Mini App (TMA) mobil interfeysini ochish": {
    "en": "Open Telegram Mini App (TMA) mobile interface",
    "ru": "Открыть мобильный интерфейс Telegram Mini App (TMA)",
    "uz-Latn": "Telegram Mini App (TMA) mobil interfeysini ochish"
  },
  "TMA": {
    "en": "TMA",
    "ru": "TMA",
    "uz-Latn": "TMA"
  },
  "Telegram bildirishnomalari": {
    "en": "Telegram notifications",
    "ru": "Уведомления Telegram",
    "uz-Latn": "Telegram bildirishnomalari"
  },
  "Yagona Darcha": {
    "en": "Single Window",
    "ru": "Единое окно",
    "uz-Latn": "Yagona Darcha [L15]"
  },
  "ToshTech Service Desk": {
    "en": "ToshTech Service Desk",
    "ru": "ToshTech Service Desk",
    "uz-Latn": "ToshTech Service Desk [L16]"
  },
  "Ichki Murojaatlar va Texnik So'rovlar (HelpDesk)": {
    "en": "Internal Requests and Technical Queries (HelpDesk)",
    "ru": "Внутренние обращения и технические запросы (HelpDesk)",
    "uz-Latn": "Ichki Murojaatlar va Texnik So'rovlar (HelpDesk) [L17]"
  },
  "Yangi Murojaat Yuborish": {
    "en": "Submit New Request",
    "ru": "Отправить новое обращение",
    "uz-Latn": "Yangi Murojaat Yuborish [L18]"
  },
  "Bo'lim Javobi:": {
    "en": "Department Response:",
    "ru": "Ответ отдела:",
    "uz-Latn": "Bo'lim Javobi: [L19]"
  },
  "Javob Qaytarish / Hal Qilish": {
    "en": "Respond / Resolve",
    "ru": "Ответить / Решить",
    "uz-Latn": "Javob Qaytarish / Hal Qilish [L20]"
  },
  "Universitet Bo'limiga Murojaat Yuborish": {
    "en": "Submit Request to University Department",
    "ru": "Отправить запрос в отдел университета",
    "uz-Latn": "Universitet Bo'limiga Murojaat Yuborish [L21]"
  },
  "Qaysi bo'limga? *": {
    "en": "Which department? *",
    "ru": "В какой отдел? *",
    "uz-Latn": "Qaysi bo'limga? * [L22]"
  },
  "Murojaat Mavzusi *": {
    "en": "Request Subject *",
    "ru": "Тема запроса *",
    "uz-Latn": "Murojaat Mavzusi * [L23]"
  },
  "Masalan: Auditoriyadagi proyektorni ta'mirlash so'rovi": {
    "en": "Example: Classroom projector repair request",
    "ru": "Пример: Запрос на ремонт проектора в аудитории",
    "uz-Latn": "Masalan: Auditoriyadagi proyektorni ta'mirlash so'rovi [L24]"
  },
  "Batafsil Tafsilot *": {
    "en": "Detailed Description *",
    "ru": "Подробности *",
    "uz-Latn": "Batafsil Tafsilot * [L25]"
  },
  "Muammo yoki so'rov haqida to'liq ma'lumot...": {
    "en": "Full details about the issue or request...",
    "ru": "Полная информация о проблеме или запросе...",
    "uz-Latn": "Muammo yoki so'rov haqida to'liq ma'lumot... [L26]"
  },
  "Murojaatchi Ismi": {
    "en": "Requester Name",
    "ru": "Имя заявителя",
    "uz-Latn": "Murojaatchi ismi"
  },
  "Telefon Raqami": {
    "en": "Phone Number",
    "ru": "Номер телефона",
    "uz-Latn": "Telefon raqami"
  },
  "Bekor Qilish": {
    "en": "Cancel",
    "ru": "Отмена",
    "uz-Latn": "Bekor qilish"
  },
  "Yuborish": {
    "en": "Submit",
    "ru": "Отправить",
    "uz-Latn": "Yuborish"
  },
  "Murojaatga Javob Berish:": {
    "en": "Respond to Request:",
    "ru": "Ответить на запрос:",
    "uz-Latn": "Murojaatga javob berish:"
  },
  "Ijro Xulosasi / Javob Matni *": {
    "en": "Execution Summary / Response Text *",
    "ru": "Отчет об исполнении / Текст ответа *",
    "uz-Latn": "Ijro xulosasi / Javob matni *"
  },
  "Masalan: So'rov ko'rib chiqildi, mutaxassis borib uskunani tuzatdi...": {
    "en": "Example: Request reviewed, specialist repaired the equipment...",
    "ru": "Пример: Запрос рассмотрен, специалист починил оборудование...",
    "uz-Latn": "Masalan: So'rov ko'rib chiqildi, mutaxassis borib uskunani tuzatdi..."
  },
  "Hal Qilindi Deb Belgilash": {
    "en": "Mark as Resolved",
    "ru": "Отметить как решенное",
    "uz-Latn": "Hal qilindi deb belgilash"
  },
  "Xavfsizlik & RBAC": {
    "en": "Security & RBAC",
    "ru": "Безопасность & RBAC",
    "uz-Latn": "Xavfsizlik va RBAC"
  },
  "Telegram ID Binding Management": {
    "en": "Telegram ID Binding Management",
    "ru": "Управление привязкой Telegram ID",
    "uz-Latn": "Telegram ID bog'lash boshqaruvi"
  },
  "Foydalanuvchilar va Telegram ID Bog'lanish Reestri": {
    "en": "Users and Telegram ID Binding Registry",
    "ru": "Реестр пользователей и привязок Telegram ID",
    "uz-Latn": "Foydalanuvchilar va Telegram ID bog'lanish reestri"
  },
  "HMAC-SHA256 Xavfsizlik Himoyasi Faol": {
    "en": "HMAC-SHA256 Security Active",
    "ru": "Защита HMAC-SHA256 активна",
    "uz-Latn": "HMAC-SHA256 xavfsizlik himoyasi faol"
  },
  "Jami Xodimlar": {
    "en": "Total Staff",
    "ru": "Всего сотрудников",
    "uz-Latn": "Jami xodimlar"
  },
  "Telegram Bog'langan": {
    "en": "Telegram Linked",
    "ru": "Telegram привязан",
    "uz-Latn": "Telegram bog'langan"
  },
  "Bog'lanmagan (Kutilmoqda)": {
    "en": "Unlinked (Pending)",
    "ru": "Не привязан (Ожидается)",
    "uz-Latn": "Bog'lanmagan (kutilmoqda)"
  },
  "F.I.SH & Kontakt": {
    "en": "Full Name & Contact",
    "ru": "Ф.И.О. & Контакт",
    "uz-Latn": "F.I.SH va Kontakt"
  },
  "RBAC Roli": {
    "en": "RBAC Role",
    "ru": "Роль RBAC",
    "uz-Latn": "RBAC roli"
  },
  "Telegram ID": {
    "en": "Telegram ID",
    "ru": "Telegram ID",
    "uz-Latn": "Telegram ID"
  },
  "Holat": {
    "en": "Status",
    "ru": "Статус",
    "uz-Latn": "Holat"
  },
  "Amallar": {
    "en": "Actions",
    "ru": "Действия",
    "uz-Latn": "Amallar"
  },
  "Umumiy xizmat": {
    "en": "General service",
    "ru": "Общая служба",
    "uz-Latn": "Umumiy xizmat"
  },
  "Mavjud emas": {
    "en": "N/A",
    "ru": "Нет",
    "uz-Latn": "Mavjud emas"
  },
  "ULANGAN": {
    "en": "LINKED",
    "ru": "ПРИВЯЗАН",
    "uz-Latn": "ULANGAN"
  },
  "KUTILMOQDA": {
    "en": "PENDING",
    "ru": "ОЖИДАЕТСЯ",
    "uz-Latn": "KUTILMOQDA"
  },
  "Tahrirlash": {
    "en": "Edit",
    "ru": "Редактировать",
    "uz-Latn": "Tahrirlash"
  },
  "Bog'lash": {
    "en": "Connect",
    "ru": "Подключить",
    "uz-Latn": "Bog'lash"
  },
  "Telegram ID ni Bog'lash": {
    "en": "Link Telegram ID",
    "ru": "Привязать Telegram ID",
    "uz-Latn": "Telegram ID ni bog'lash"
  },
  "1-usul: Bir martalik buyruq orqali avtomatik bog'lash": {
    "en": "Method 1: Auto-link via one-time command",
    "ru": "Способ 1: Автоматическая привязка через разовую команду",
    "uz-Latn": "1-usul: Bir martalik buyruq orqali avtomatik bog'lash"
  },
  "Xodim o'z telefonidagi @UniTaskBot ga quyidagi buyruqni yuborishi kifoya:": {
    "en": "The employee just needs to send the following command to @UniTaskBot on their phone:",
    "ru": "Сотруднику достаточно отправить следующую команду боту @UniTaskBot:",
    "uz-Latn": "Xodim o'z telefonidagi @UniTaskBot ga quyidagi buyruqni yuborishi kifoya:"
  },
  "Nusxalash muvaffaqiyatsiz. Buyruqni qo'lda tanlab nusxalang.": {
    "en": "Copy failed. Select and copy the command manually.",
    "ru": "Не удалось скопировать. Выделите и скопируйте команду вручную.",
    "uz-Latn": "Nusxalash muvaffaqiyatsiz. Buyruqni qo'lda tanlab nusxalang."
  },
  "Nusxalandi!": {
    "en": "Copied!",
    "ru": "Скопировано!",
    "uz-Latn": "Nusxalandi!"
  },
  "Nusxalash": {
    "en": "Copy",
    "ru": "Копировать",
    "uz-Latn": "Nusxalash"
  },
  "2-usul: Telegram ID ni qo'lda kiritish": {
    "en": "Method 2: Manual Telegram ID entry",
    "ru": "Способ 2: Ручной ввод Telegram ID",
    "uz-Latn": "2-usul: Telegram ID ni qo'lda kiritish"
  },
  "Telegram Raqamli IDsi (Chat ID) *": {
    "en": "Telegram Numeric ID (Chat ID) *",
    "ru": "Цифровой ID Telegram (Chat ID) *",
    "uz-Latn": "Telegram raqamli IDsi (Chat ID) *"
  },
  "Masalan: 554198302": {
    "en": "Example: 554198302",
    "ru": "Например: 554198302",
    "uz-Latn": "Masalan: 554198302"
  },
  "Xodim @UniTaskBot da /myid buyrug'ini yuborib o'z ID sini bilishi mumkin.": {
    "en": "Employees can find their ID by sending the /myid command to @UniTaskBot.",
    "ru": "Сотрудник может узнать свой ID, отправив команду /myid боту @UniTaskBot.",
    "uz-Latn": "Xodim @UniTaskBot da /myid buyrug'ini yuborib, o'z ID sini bilib olishi mumkin."
  },
  "Telegram Username (ixtiyoriy)": {
    "en": "Telegram Username (optional)",
    "ru": "Telegram Username (необязательно)",
    "uz-Latn": "Telegram foydalanuvchi nomi (ixtiyoriy)"
  },
  "jasur_toshtech": {
    "en": "jasur_toshtech",
    "ru": "jasur_toshtech",
    "uz-Latn": "jasur_toshtech"
  },
  "Bog'lashni Saqlash": {
    "en": "Save Binding",
    "ru": "Сохранить привязку",
    "uz-Latn": "Bog'lashni saqlash"
  },
  "Тоифаси": {
    "en": "Category",
    "ru": "Категория",
    "uz-Latn": "Toifasi"
  },
  "Жами:": {
    "en": "Total:",
    "ru": "Всего:",
    "uz-Latn": "Jami:"
  },
  ":": {
    "en": ":",
    "ru": ":",
    "uz-Latn": ":"
  },
  "ToshTech Ректорати": {
    "en": "ToshTech Rectorate",
    "ru": "Ректорат ToshTech",
    "uz-Latn": "ToshTech Rektorati"
  },
  "2027 йил сентябрь ойига қадар": {
    "en": "Until September 2027",
    "ru": "До сентября 2027 г.",
    "uz-Latn": "2027 yil sentyabr oyiga qadar"
  },
  "2027 йил сентябрь ойига қадар “ToshTech” ишлар РЕЖАСИ": {
    "en": "ToshTech Work Plan until September 2027",
    "ru": "План работ ToshTech до сентября 2027 г.",
    "uz-Latn": "2027 yil sentyabr oyiga qadar “ToshTech” ishlar rejasi"
  },
  "Ўзбекистон Республикаси олий муҳандислик таълими трансформацияси ва ToshTech техника университетининг 8 та стратегик йўналиши": {
    "en": "Transformation of higher engineering education in the Republic of Uzbekistan and 8 strategic directions of ToshTech Technical University",
    "ru": "Трансформация высшего инженерного образования Республики Узбекистан и 8 стратегических направлений технического университета ToshTech",
    "uz-Latn": "O'zbekiston Respublikasi oliy muhandislik ta'limi transformatsiyasi va ToshTech texnika universitetining 8 ta strategik yo'nalishi"
  },
  "Расмий тасдиқланган PDF режа ҳужжатини очиш": {
    "en": "Open official approved PDF plan document",
    "ru": "Открыть официально утвержденный PDF-документ плана",
    "uz-Latn": "Rasmiy tasdiqlangan PDF reja hujjatini ochish"
  },
  "Асл PDF Режа (92 та топшириқ)": {
    "en": "Original PDF Plan (92 tasks)",
    "ru": "Оригинальный PDF-план (92 задания)",
    "uz-Latn": "Asl PDF reja (92 ta topshiriq)"
  },
  "Excel (.xlsx) Экспорт": {
    "en": "Export to Excel (.xlsx)",
    "ru": "Экспорт в Excel (.xlsx)",
    "uz-Latn": "Excel (.xlsx) eksport"
  },
  "Ходим TMA Мобили": {
    "en": "Staff TMA Mobile",
    "ru": "Сотрудник TMA Mobile",
    "uz-Latn": "Xodim TMA Mobili"
  },
  "Диққат: ToshTech иш режасида": {
    "en": "Attention: in the ToshTech work plan",
    "ru": "Внимание: в плане работ ToshTech",
    "uz-Latn": "Diqqat: ToshTech ish rejasida"
  },
  "та кечиктирилган топшириқ мавжуд!": {
    "en": "tasks are overdue!",
    "ru": "задач просрочено!",
    "uz-Latn": "ta kechiktirilgan topshiriq mavjud!"
  },
  "Автоматлаштирилган Telegram эскалация тизими масъул ходимлар ва бўлим бошлиқларига Қизил Байроқ билдиришномасини юборган.": {
    "en": "Automated Telegram escalation system has sent a Red Flag notification to responsible staff and department heads.",
    "ru": "Автоматизированная система эскалации Telegram отправила уведомление \"Красный флаг\" ответственным сотрудникам и начальникам отделов.",
    "uz-Latn": "Avtomatlashtirilgan Telegram eskalatsiya tizimi mas'ul xodimlar va bo'lim boshliqlariga Qizil Bayroq bildirishnomasini yuborgan."
  },
  "Кечикканларни Кўриш": {
    "en": "View overdue",
    "ru": "Просмотреть просроченные",
    "uz-Latn": "Kechikkanlarni Ko'rish"
  },
  "Умумий Режа Бажарилиши": {
    "en": "Overall Plan Execution",
    "ru": "Общее выполнение плана",
    "uz-Latn": "Umumiy ish rejasi bajarilishi"
  },
  "топшириқ)": {
    "en": "tasks)",
    "ru": "заданий)",
    "uz-Latn": "topshiriq)"
  },
  "Ижро Жараёнида": {
    "en": "In progress",
    "ru": "В процессе",
    "uz-Latn": "Ijro jarayonida"
  },
  "Фаол бажарилмоқда": {
    "en": "Active",
    "ru": "Выполняется",
    "uz-Latn": "Faol bajarilmoqda"
  },
  "Telegram Clock-In": {
    "en": "Telegram clock-in",
    "ru": "Отметка начала работы в Telegram",
    "uz-Latn": "Telegram orqali ish boshlashni qayd etish"
  },
  "8 та марказ ва бўлимлар": {
    "en": "8 centers and departments",
    "ru": "8 центров и отделов",
    "uz-Latn": "8 ta markaz va bo'limlar"
  },
  "Кўрик Кутилмоқда": {
    "en": "Awaiting review",
    "ru": "Ожидает проверки",
    "uz-Latn": "Ko'rik kutilmoqda"
  },
  "Proof-of-Work": {
    "en": "Proof of work",
    "ru": "Подтверждение выполнения",
    "uz-Latn": "Bajarilgan ish isboti"
  },
  "Текшириш консили": {
    "en": "Review console",
    "ru": "Консоль проверки",
    "uz-Latn": "Tekshirish konsili"
  },
  "Тасдиқ талаб": {
    "en": "Approval required",
    "ru": "Требуется подтверждение",
    "uz-Latn": "Tasdiq talab"
  },
  "Муддати Ўтган": {
    "en": "Overdue",
    "ru": "Просрочено",
    "uz-Latn": "Muddati o'tgan"
  },
  "Қизил байроқлар": {
    "en": "Red flags",
    "ru": "Красные флаги",
    "uz-Latn": "Qizil bayroqlar"
  },
  "Эскалация даражаси": {
    "en": "Escalation level",
    "ru": "Уровень эскалации",
    "uz-Latn": "Eskalatsiya darajasi"
  },
  "Ректорат Назорати": {
    "en": "Rectorate Control",
    "ru": "Контроль ректората",
    "uz-Latn": "Rektorat nazorati"
  },
  "Муҳимлик Даражаси (Priority) Бўйича Режа Бажарилиши": {
    "en": "Plan Execution by Priority Level",
    "ru": "Исполнение плана по уровню приоритетности",
    "uz-Latn": "Muhimlik darajasi (Priority) bo'yicha ish rejasi bajarilishi"
  },
  "CRITICAL, HIGH, MEDIUM ва LOW тоифасидаги 92 та режа топшириғининг ижро ҳолати (Recharts визуал таҳлили)": {
    "en": "Execution status of 92 planned tasks in CRITICAL, HIGH, MEDIUM and LOW categories (Recharts visual analysis)",
    "ru": "Статус исполнения 92 плановых задач категорий CRITICAL, HIGH, MEDIUM и LOW (визуальный анализ Recharts)",
    "uz-Latn": "CRITICAL, HIGH, MEDIUM va LOW toifasidagi 92 ta ish rejasi topshirig'ining ijro holati (Recharts vizual tahlili)"
  },
  "Тоифалар бўйича реэстр": {
    "en": "Registry by categories",
    "ru": "Реестр по категориям",
    "uz-Latn": "Toifalar bo'yicha reestr"
  },
  "Ижро кўрсаткичи:": {
    "en": "Performance indicator:",
    "ru": "Показатель исполнения:",
    "uz-Latn": "Ijro ko'rsatkichi:"
  },
  "бажарилди": {
    "en": "completed",
    "ru": "выполнено",
    "uz-Latn": "bajarildi"
  },
  "кечиккан": {
    "en": "delayed",
    "ru": "задержано",
    "uz-Latn": "kechikkan"
  },
  "жараёнда": {
    "en": "in progress",
    "ru": "в процессе",
    "uz-Latn": "jarayonda"
  },
  "Иш Режасининг 8 та Стратегик Бўлими (2027 Сентябргача)": {
    "en": "8 Strategic Sections of the Work Plan (until September 2027)",
    "ru": "8 стратегических разделов рабочего плана (до сентября 2027 г.)",
    "uz-Latn": "Ish rejasining 8 ta strategik bo'limi (2027 sentyabrgacha)"
  },
  "Ҳар бир бўлим бўйича бириктирилган мақсадли вазифалар сони ва ижро даражаси": {
    "en": "Number of assigned target tasks and execution level for each section",
    "ru": "Количество назначенных целевых задач и уровень исполнения по каждому разделу",
    "uz-Latn": "Har bir bo'lim bo'yicha biriktirilgan maqsadli vazifalar soni va ijro darajasi"
  },
  "Барча 92 та топшириқни кўриш": {
    "en": "View all 92 tasks",
    "ru": "Просмотреть все 92 задачи",
    "uz-Latn": "Barcha 92 ta topshiriqni ko'rish"
  },
  "-Бўлим": {
    "en": "-Section",
    "ru": "-Раздел",
    "uz-Latn": "-Bo'lim"
  },
  "Ўртача ижро:": {
    "en": "Average execution:",
    "ru": "Среднее исполнение:",
    "uz-Latn": "O'rtacha ijro:"
  },
  "Бўлимлар Бўйича 92 та Топшириқ Ижро Интизоми": {
    "en": "Execution Discipline of 92 Tasks by Sections",
    "ru": "Исполнительская дисциплина 92 задач по разделам",
    "uz-Latn": "Bo'limlar bo'yicha 92 ta topshiriq ijro intizomi"
  },
  "Масъул бўлинмалар ва мутасадди проректорлар кесимида": {
    "en": "By responsible units and assigned vice-rectors",
    "ru": "В разрезе ответственных подразделений и курирующих проректоров",
    "uz-Latn": "Mas'ul bo'linmalar va mutasaddi prorektorlar kesimida"
  },
  "Режа реэстри": {
    "en": "Plan registry",
    "ru": "Реестр плана",
    "uz-Latn": "Ish rejasi reestri"
  },
  "Бўлим / Департамент": {
    "en": "Department / Division",
    "ru": "Отдел / Департамент",
    "uz-Latn": "Bo'lim / Departament"
  },
  "Мутасадди": {
    "en": "Person in charge",
    "ru": "Ответственное лицо",
    "uz-Latn": "Mutasaddi"
  },
  "Вазифалар": {
    "en": "Tasks",
    "ru": "Задачи",
    "uz-Latn": "Topshiriqlar"
  },
  "Ижро Фоизи": {
    "en": "Execution %",
    "ru": "Процент исполнения",
    "uz-Latn": "Ijro foizi"
  },
  "KPI Мақсад": {
    "en": "KPI Goal",
    "ru": "Цель KPI",
    "uz-Latn": "KPI Maqsad"
  },
  "ходим": {
    "en": "employee",
    "ru": "сотрудник",
    "uz-Latn": "xodim"
  },
  "Тезкор Назорат": {
    "en": "Rapid Control",
    "ru": "Оперативный контроль",
    "uz-Latn": "Tezkor nazorat"
  },
  "Критик Топшириқлар": {
    "en": "Critical Tasks",
    "ru": "Критические задачи",
    "uz-Latn": "Kritik topshiriqlar"
  },
  "2026 йил IV чорак ва 2027 йил I чорак учун белгиланган кечиктириб бўлмас чора-тадбирлар.": {
    "en": "Urgent measures for Q4 2026 and Q1 2027.",
    "ru": "Неотложные меры на IV квартал 2026 года и I квартал 2027 года.",
    "uz-Latn": "2026 yil IV chorak va 2027 yil I chorak uchun belgilangan kechiktirib bo'lmas chora-tadbirlar."
  },
  "Масъул:": {
    "en": "Responsible:",
    "ru": "Ответственный:",
    "uz-Latn": "Mas'ul:"
  },
  "Кўриш": {
    "en": "View",
    "ru": "Просмотр",
    "uz-Latn": "Ko'rish"
  },
  "Барча 92 та Топшириқ Реэстрини Очиш": {
    "en": "Open All 92 Task Registry",
    "ru": "Открыть реестр всех 92 задач",
    "uz-Latn": "Barcha 92 ta Topshiriq Reestrini Ochish"
  },
  "Murojaat yuborish uchun bo‘lim mavjud emas.": {
    "en": "No department is available for this request.",
    "ru": "Для обращения нет доступного отдела.",
    "uz-Latn": "Murojaat yuborish uchun bo'lim mavjud emas."
  },
  "UniTask": {
    "en": "UniTask",
    "ru": "UniTask",
    "uz-Latn": "UniTask"
  },
  "Import xatolari:": {
    "en": "Import errors:",
    "ru": "Ошибки импорта:",
    "uz-Latn": "Import xatolari:"
  }
};

// Contract UI strings. Uzbek Cyrillic is produced from the reviewed Latin copy by i18n.
const administrationCopy: Record<string, string> = {
  "University work-plan system": "Система рабочих планов университета¦Universitet ish rejalari tizimi",
  "One secure workspace for university plans, responsibilities, and progress.": "Единое защищенное пространство для планов университета, обязанностей и хода выполнения.¦Universitet rejalari, mas’uliyatlar va bajarilish holati uchun yagona xavfsiz ish muhiti.",
  "Secure access · ToshTech": "Защищенный доступ · ToshTech¦Xavfsiz kirish · ToshTech",
  "Secure sign-in": "Безопасный вход¦Xavfsiz kirish",
  "Account activation": "Активация учетной записи¦Hisobni faollashtirish",
  "Account recovery": "Восстановление доступа¦Hisobga kirishni tiklash",
  "Welcome back": "С возвращением¦Xush kelibsiz",
  "Create your password": "Создайте пароль¦Parolingizni yarating",
  "Recover access": "Восстановить доступ¦Kirishni tiklash",
  "Sign in to UniTask": "Войдите в UniTask¦UniTask tizimiga kiring",
  "Choose a strong password to activate your account.": "Задайте надежный пароль для активации учетной записи.¦Hisobingizni faollashtirish uchun mustahkam parol tanlang.",
  "Enter your username or email to request account recovery.": "Введите имя пользователя или электронную почту для восстановления доступа.¦Hisobni tiklash uchun foydalanuvchi nomi yoki elektron pochtani kiriting.",
  "Use your university account credentials to continue.": "Для продолжения используйте учетные данные университета.¦Davom etish uchun universitet hisob ma’lumotlaridan foydalaning.",
  "Username or email": "Имя пользователя или электронная почта¦Foydalanuvchi nomi yoki elektron pochta",
  "Password": "Пароль¦Parol",
  "New password": "Новый пароль¦Yangi parol",
  "Confirm password": "Подтвердите пароль¦Parolni tasdiqlang",
  "Sign in": "Войти¦Kirish",
  "Signing in…": "Вход…¦Tizimga kirilmoqda…",
  "Forgot password?": "Забыли пароль?¦Parolni unutdingizmi?",
  "Set password": "Установить пароль¦Parolni o‘rnatish",
  "Saving…": "Сохранение…¦Saqlanmoqda…",
  "Submitting…": "Отправка…¦Yuborilmoqda…",
  "Request recovery": "Запросить восстановление¦Tiklashni so‘rash",
  "Back to sign in": "Вернуться ко входу¦Kirish sahifasiga qaytish",
  "Initial administrator access is provisioned by the secure server-side setup command. Contact your system administrator; credentials are never displayed here.": "Первичный доступ администратора создается защищенной серверной командой настройки. Обратитесь к системному администратору; учетные данные здесь не отображаются.¦Dastlabki administrator kirishi serverdagi xavfsiz sozlash buyrug‘i orqali yaratiladi. Tizim administratoriga murojaat qiling; hisob ma’lumotlari bu yerda ko‘rsatilmaydi.",
  "Unable to sign in. Check your details and try again.": "Не удалось войти. Проверьте данные и повторите попытку.¦Kirish amalga oshmadi. Ma’lumotlarni tekshirib, qayta urinib ko‘ring.",
  "This setup link is incomplete or has expired.": "Ссылка настройки неполная или срок ее действия истек.¦Sozlash havolasi to‘liq emas yoki uning muddati tugagan.",
  "Use at least 12 characters for your password.": "Пароль должен содержать не менее 12 символов.¦Parolingiz kamida 12 ta belgidan iborat bo‘lsin.",
  "The passwords do not match.": "Пароли не совпадают.¦Parollar mos kelmadi.",
  "Password established. Sign in with your account.": "Пароль установлен. Войдите в учетную запись.¦Parol o‘rnatildi. Hisobingiz orqali tizimga kiring.",
  "The setup service is unavailable. Please try again later.": "Сервис настройки недоступен. Повторите попытку позже.¦Sozlash xizmati hozircha mavjud emas. Keyinroq qayta urinib ko‘ring.",
  "If the account can be recovered, the next steps will be provided by your administrator.": "Если восстановление учетной записи возможно, дальнейшие инструкции предоставит администратор.¦Hisobni tiklash mumkin bo‘lsa, keyingi ko‘rsatmalarni administrator taqdim etadi.",
  "The recovery service is unavailable. Please try again later.": "Сервис восстановления недоступен. Повторите попытку позже.¦Tiklash xizmati hozircha mavjud emas. Keyinroq qayta urinib ko‘ring.",
  "Administration": "Администрирование¦Boshqaruv",
  "Loading current system data": "Загрузка текущих данных системы¦Joriy tizim ma’lumotlari yuklanmoqda",
  "Central control for accounts, work plans, task governance, and system operations.": "Центральное управление учетными записями, рабочими планами, задачами и операциями системы.¦Hisoblar, ish rejalari, topshiriqlar va tizim amallarini markazdan boshqarish.",
  "Administration sections": "Разделы администрирования¦Boshqaruv bo‘limlari",
  "Overview": "Обзор¦Umumiy ko‘rinish",
  "Users": "Пользователи¦Foydalanuvchilar",
  "Departments": "Подразделения¦Bo‘limlar",
  "Role permissions": "Разрешения ролей¦Rollar ruxsatlari",
  "Work plans & categories": "Рабочие планы и категории¦Ish rejalari va toifalar",
  "Task maintenance": "Управление задачами¦Topshiriqlarni boshqarish",
  "Settings": "Настройки¦Sozlamalar",
  "Deliveries & jobs": "Доставки и задания¦Yetkazmalar va ishlar",
  "Migration": "Миграция¦Ko‘chirish",
  "Could not load administration data": "Не удалось загрузить данные администрирования¦Boshqaruv ma’lumotlarini yuklab bo‘lmadi",
  "Retry": "Повторить¦Qayta urinish",
  "One-time setup link. Share it securely; it will not be stored.": "Одноразовая ссылка настройки. Передайте ее безопасно; она не сохраняется.¦Bir martalik sozlash havolasi. Uni xavfsiz ulashing; havola saqlanmaydi.",
  "Setup link": "Ссылка настройки¦Sozlash havolasi",
  "Copy link": "Скопировать ссылку¦Havolani nusxalash",
  "Link copied.": "Ссылка скопирована.¦Havola nusxalandi.",
  "Clipboard unavailable. Select and copy the link manually.": "Буфер обмена недоступен. Выделите и скопируйте ссылку вручную.¦Nusxalash buferi mavjud emas. Havolani belgilang va qo‘lda nusxalang.",
  "Changes saved successfully.": "Изменения успешно сохранены.¦O‘zgarishlar muvaffaqiyatli saqlandi.",
  "Recent imports": "Последние импорты¦So‘nggi importlar",
  "Latest administrative data operations": "Последние операции с данными¦Ma’lumotlar bilan oxirgi boshqaruv amallari",
  "rows": "строк¦qator",
  "No import activity yet.": "Импортов пока нет.¦Hozircha import amallari yo‘q.",
  "System activity": "Активность системы¦Tizim faolligi",
  "Delivery status from the server": "Статус доставки с сервера¦Serverdan yetkazish holati",
  "attempts": "попыток¦urinish",
  "No delivery records.": "Нет записей о доставке.¦Yetkazish yozuvlari mavjud emas.",
  "Account directory": "Каталог учетных записей¦Hisoblar ro‘yxati",
  "User management is restricted to administrators.": "Управление пользователями доступно только администраторам.¦Foydalanuvchilarni faqat administratorlar boshqaradi.",
  "Add user": "Добавить пользователя¦Foydalanuvchi qo‘shish",
  "Search users": "Поиск пользователей¦Foydalanuvchilarni qidirish",
  "Account": "Учетная запись¦Hisob",
  "Department": "Подразделение¦Bo‘lim",
  "Role": "Роль¦Rol",
  "Status": "Статус¦Holat",
  "Actions": "Действия¦Amallar",
  "Active": "Активен¦Faol",
  "Inactive": "Неактивен¦Faol emas",
  "Reset password": "Сбросить пароль¦Parolni tiklash",
  "Reset": "Сбросить¦Tiklash",
  "Edit": "Изменить¦Tahrirlash",
  "No users found": "Пользователи не найдены¦Foydalanuvchilar topilmadi",
  "Try a different search term or add an account.": "Измените запрос или добавьте учетную запись.¦Boshqa so‘z bilan qidiring yoki hisob qo‘shing.",
  "Code": "Код¦Kod",
  "Name": "Название¦Nomi",
  "Coordinator": "Координатор¦Muvofiqlashtiruvchi",
  "Unassigned": "Не назначен¦Biriktirilmagan",
  "Role permission matrix": "Матрица разрешений ролей¦Rollar ruxsatlari jadvali",
  "Ceilings are enforced by the server. Administrator permissions are fixed.": "Ограничения применяются сервером. Разрешения администратора фиксированы.¦Cheklovlar server tomonidan qo‘llanadi. Administrator ruxsatlari o‘zgarmas.",
  "Permission ceiling": "Максимум разрешений¦Ruxsatlar chegarasi",
  "Save permissions": "Сохранить разрешения¦Ruxsatlarni saqlash",
  "Permissions saved.": "Разрешения сохранены.¦Ruxsatlar saqlandi.",
  "Work plans": "Рабочие планы¦Ish rejalari",
  "Add work plan": "Добавить рабочий план¦Ish rejasi qo‘shish",
  "sections": "разделов¦bo‘lim",
  "Add section": "Добавить раздел¦Bo‘lim qo‘shish",
  "No work plans yet": "Рабочих планов пока нет¦Hozircha ish rejalari yo‘q",
  "Create a work plan to organize sections and tasks.": "Создайте рабочий план для организации разделов и задач.¦Bo‘limlar va topshiriqlarni tartiblash uchun ish rejasi yarating.",
  "Task categories": "Категории задач¦Topshiriq toifalari",
  "Add category": "Добавить категорию¦Toifa qo‘shish",
  "Category": "Категория¦Toifa",
  "No categories configured.": "Категории не настроены.¦Toifalar sozlanmagan.",
  "Corrections and lifecycle actions are submitted with the current task version.": "Изменения и действия передаются с текущей версией задачи.¦Tuzatishlar va holat amallari topshiriqning joriy versiyasi bilan yuboriladi.",
  "Search tasks": "Поиск задач¦Topshiriqlarni qidirish",
  "Task": "Задача¦Topshiriq",
  "Assignee": "Исполнитель¦Ijrochi",
  "Deadline": "Срок¦Muddat",
  "Restore": "Восстановить¦Tiklash",
  "Archive": "Архивировать¦Arxivlash",
  "No tasks found": "Задачи не найдены¦Topshiriqlar topilmadi",
  "Tasks available to this account appear here.": "Здесь отображаются задачи, доступные этой учетной записи.¦Bu yerda ushbu hisobga ochiq topshiriqlar ko‘rsatiladi.",
  "users": "пользователей¦foydalanuvchi",
  "tasks": "задач¦topshiriq",
  "Job completed": "Задание выполнено¦Ish bajarildi",
  "Scheduled jobs": "Запланированные задания¦Rejalashtirilgan ishlar",
  "Jobs execute on the server; a missing Telegram configuration is reported as an error.": "Задания выполняются на сервере; отсутствие настройки Telegram возвращается как ошибка.¦Ishlar serverda bajariladi; Telegram sozlamasi bo‘lmasa, xatolik ko‘rsatiladi.",
  "Run reminders": "Запустить напоминания¦Eslatmalarni ishga tushirish",
  "Run delivery": "Запустить доставку¦Yetkazishni ishga tushirish",
  "Delivery records": "Записи доставки¦Yetkazish yozuvlari",
  "Title": "Название¦Sarlavha",
  "Recipient": "Получатель¦Qabul qiluvchi",
  "Attempts": "Попытки¦Urinishlar",
  "Last error": "Последняя ошибка¦Oxirgi xatolik",
  "Created": "Создано¦Yaratilgan",
  "Legacy snapshot migration": "Перенос старого снимка данных¦Eski ma’lumotlar nusxasini ko‘chirish",
  "Upload a JSON snapshot for server-side preview. The original remains immutable; no official tasks are seeded automatically.": "Загрузите JSON-снимок для предварительной проверки на сервере. Оригинал остается неизменным; официальные задачи автоматически не создаются.¦Serverda ko‘rib chiqish uchun JSON nusxani yuklang. Asl nusxa o‘zgarmaydi; rasmiy topshiriqlar avtomatik yaratilmaydi.",
  "Choose a JSON snapshot": "Выберите JSON-снимок¦JSON nusxani tanlang",
  "The legacy local storage is not modified.": "Старое локальное хранилище не изменяется.¦Eski mahalliy xotira o‘zgartirilmaydi.",
  "Preview migration": "Предварительный просмотр миграции¦Ko‘chirishni ko‘rib chiqish",
  "Snapshot preview": "Предварительный просмотр снимка¦Nusxani ko‘rib chiqish",
  "Digest": "Контрольная сумма¦Nazorat yig‘indisi",
  "Warnings": "Предупреждения¦Ogohlantirishlar",
  "Map every legacy account to a role": "Назначьте роль каждой старой учетной записи¦Har bir eski hisobga rol belgilang",
  "Role for": "Роль для¦Rol",
  "Choose role": "Выберите роль¦Rolni tanlang",
  "I have backed up the target system and reviewed the immutable source snapshot.": "Я создал резервную копию целевой системы и проверил неизменяемый исходный снимок.¦Maqsad tizimining zaxira nusxasini yaratdim va o‘zgarmas manba nusxasini ko‘rib chiqdim.",
  "I explicitly confirm committing this migration after reviewing the preview and role mapping.": "Я подтверждаю выполнение миграции после проверки предварительного просмотра и назначения ролей.¦Ko‘rib chiqish va rollarni belgilashdan so‘ng ushbu ko‘chirishni tasdiqlayman.",
  "Commit migration": "Выполнить миграцию¦Ko‘chirishni bajarish",
  "Choose a role for every account before importing.": "Перед импортом назначьте роль каждой учетной записи.¦Importdan oldin har bir hisobga rol tanlang.",
  "Import this snapshot now? This action cannot be undone.": "Импортировать этот снимок сейчас? Это действие нельзя отменить.¦Ushbu nusxa hozir import qilinsinmi? Bu amalni bekor qilib bo‘lmaydi.",
  "Migration completed.": "Миграция завершена.¦Ko‘chirish yakunlandi.",
  "The selected file must contain a JSON snapshot.": "Выбранный файл должен содержать JSON-снимок.¦Tanlangan faylda JSON nusxa bo‘lishi kerak.",
  "Add department": "Добавить подразделение¦Bo‘lim qo‘shish",
  "No departments configured.": "Подразделения не настроены.¦Bo‘limlar sozlanmagan.",
  "Notification settings": "Настройки уведомлений¦Bildirishnoma sozlamalari",
  "Changes are applied after the server confirms the update.": "Изменения применяются после подтверждения сервера.¦O‘zgarishlar server tasdiqlaganidan so‘ng qo‘llanadi.",
  "Enable reminders": "Включить напоминания¦Eslatmalarni yoqish",
  "Reminder hour": "Час напоминания¦Eslatma soati",
  "Reminder template": "Шаблон напоминания¦Eslatma andozasi",
  "Save settings": "Сохранить настройки¦Sozlamalarni saqlash",
  "Settings saved.": "Настройки сохранены.¦Sozlamalar saqlandi.",
  "Correct task": "Исправить задачу¦Topshiriqni tuzatish",
  "Expected outcome": "Ожидаемый результат¦Kutilayotgan natija",
  "Acceptance criteria": "Критерии приемки¦Qabul mezonlari",
  "Priority": "Приоритет¦Muhimlik darajasi",
  "Work plan": "Рабочий план¦Ish rejasi",
  "None": "Нет¦Yo‘q",
  "No approver": "Нет проверяющего¦Tasdiqlovchi yo‘q",
  "Requires evidence": "Требуется подтверждение¦Dalil talab qilinadi",
  "Requires approval": "Требуется утверждение¦Tasdiqlash talab qilinadi",
  "Draft": "Черновик¦Qoralama",
  "Reason required for completed-task correction": "Для изменения завершенной задачи укажите причину¦Bajarilgan topshiriqni tuzatish sababini kiriting",
  "Save task": "Сохранить задачу¦Topshiriqni saqlash",
  "Task updated.": "Задача обновлена.¦Topshiriq yangilandi.",
  "Enter a reason for this task change:": "Укажите причину изменения задачи:¦Topshiriqni o‘zgartirish sababini kiriting:",
  "Permanently delete this eligible draft? The server may refuse if it has history.": "Удалить этот допустимый черновик навсегда? Сервер может отказать, если у него есть история.¦Ushbu ruxsat etilgan qoralama butunlay o‘chirilsinmi? Tarixi bo‘lsa, server rad etishi mumkin.",
  "Confirm task archive?": "Подтвердить архивирование задачи?¦Topshiriq arxivlansinmi?",
  "Confirm task restore?": "Подтвердить восстановление задачи?¦Topshiriq tiklansinmi?",
  "Confirm task delete?": "Подтвердить удаление задачи?¦Topshiriq o‘chirilsinmi?",
  "Create an account activation link for this user?": "Создать ссылку активации учетной записи?¦Ushbu hisobni faollashtirish havolasi yaratilsinmi?",
  "Issue a password reset link for this user?": "Создать ссылку сброса пароля для этого пользователя?¦Ushbu foydalanuvchi uchun parolni tiklash havolasi yaratilsinmi?",
  "Select work plan": "Выберите рабочий план¦Ish rejasini tanlang",
  "Section number": "Номер раздела¦Bo‘lim raqami",
  "Active account": "Активная учетная запись¦Faol hisob",
  "Save": "Сохранить¦Saqlash",
  "Cancel": "Отмена¦Bekor qilish",
  "No department": "Без подразделения¦Bo‘limsiz",
  "Activate": "Активировать¦Faollashtirish",
  "All roles": "Все роли¦Barcha rollar",
  "All statuses": "Все статусы¦Barcha holatlar",
  "Filter by role": "Фильтр по роли¦Rol bo‘yicha filtrlash",
  "Filter by status": "Фильтр по статусу¦Holat bo‘yicha filtrlash",
  "Sort users": "Сортировка пользователей¦Foydalanuvchilarni saralash",
  "Sort tasks": "Сортировка задач¦Topshiriqlarni saralash",
  "Sort by name": "По имени¦Nomi bo‘yicha",
  "Sort by email": "По электронной почте¦Elektron pochta bo‘yicha",
  "Sort by title": "По названию¦Sarlavha bo‘yicha",
  "Sort by deadline": "По сроку¦Muddat bo‘yicha",
  "Add plan": "Добавить план¦Reja qo‘shish",
  "Edit plan": "Изменить план¦Rejani tahrirlash",
  "Edit section": "Изменить раздел¦Bo‘limni tahrirlash",
  "Edit category": "Изменить категорию¦Toifani tahrirlash",
  "Edit user": "Изменить пользователя¦Foydalanuvchini tahrirlash",
  "Edit department": "Изменить подразделение¦Bo‘limni tahrirlash",
  "Administrator access is required to view this console.": "Для просмотра этой консоли необходим доступ администратора.¦Ushbu konsolani ko‘rish uchun administrator ruxsati talab etiladi.",
  "Manage users": "Управление пользователями¦Foydalanuvchilarni boshqarish",
  "Manage roles": "Управление ролями¦Rollarni boshqarish",
  "Manage departments": "Управление подразделениями¦Bo‘limlarni boshqarish",
  "Manage settings": "Управление настройками¦Sozlamalarni boshqarish",
  "Read all tasks": "Просмотр всех задач¦Barcha topshiriqlarni ko‘rish",
  "Create tasks": "Создание задач¦Topshiriq yaratish",
  "Edit tasks": "Изменение задач¦Topshiriqlarni tahrirlash",
  "Archive tasks": "Архивирование задач¦Topshiriqlarni arxivlash",
  "Delete eligible drafts": "Удаление разрешенных черновиков¦Ruxsat etilgan qoralamalarni o‘chirish",
  "Start tasks": "Начало выполнения задач¦Topshiriqni boshlash",
  "Update progress": "Обновление прогресса¦Jarayonni yangilash",
  "Submit tasks": "Отправка задач¦Topshiriqlarni yuborish",
  "Comment on tasks": "Комментирование задач¦Topshiriqlarga izoh qoldirish",
  "Review tasks": "Проверка задач¦Topshiriqlarni ko‘rib chiqish",
  "Manage work plans": "Управление рабочими планами¦Ish rejalarini boshqarish",
  "Manage imports": "Управление импортом¦Importlarni boshqarish",
  "Export reports": "Экспорт отчетов¦Hisobotlarni eksport qilish",
  "Read audit log": "Просмотр журнала аудита¦Audit jurnalini ko‘rish",
  "Manage notifications": "Управление уведомлениями¦Bildirishnomalarni boshqarish",
  "Resolve service tickets": "Решение обращений в поддержку¦Yordam murojaatlarini hal qilish",
  "Delete eligible draft": "Удалить разрешенный черновик¦Ruxsat etilgan qoralamani o‘chirish",
  "Only eligible drafts can be deleted.": "Можно удалить только разрешенные черновики.¦Faqat ruxsat etilgan qoralamalarni o‘chirish mumkin.",
  "Action": "Действие¦Amal",
  "Approver": "Проверяющий¦Tasdiqlovchi",
  "Description": "Описание¦Tavsif",
  "Email": "Электронная почта¦Elektron pochta",
  "Full name": "Полное имя¦To‘liq ism",
  "Phone": "Телефон¦Telefon",
  "Username": "Имя пользователя¦Foydalanuvchi nomi",
  "Year": "Год¦Yil",
  "Close": "Закрыть¦Yopish",
  "Close dialog": "Закрыть диалог¦Muloqot oynasini yopish",
  "Loading": "Загрузка¦Yuklanmoqda",
  "Previous page": "Предыдущая страница¦Oldingi sahifa",
  "Next page": "Следующая страница¦Keyingi sahifa"
};
Object.assign(interfaceTranslations, Object.fromEntries(Object.entries(administrationCopy).map(([key, value]) => {
  const [ru, uz] = value.split('¦');
  return [key, { en: key, ru, 'uz-Latn': uz }];
})));
const secureAccountCopy: Record<string, [string, string]> = {
  'Retry': ['Повторить', 'Qayta urinish'],
  'Administration': ['Администрирование', 'Ma’muriyat'],
  'My account': ['Мой аккаунт', 'Mening hisobim'],
  'Sign out': ['Выйти', 'Chiqish'],
  'Access denied': ['Доступ запрещён', 'Kirish taqiqlangan'],
  'You do not have permission to open this module.': ['У вас нет доступа к этому модулю.', 'Bu modulni ochishga ruxsatingiz yo‘q.'],
  'Telegram is not linked': ['Telegram не привязан', 'Telegram ulanmagan'],
  'Unlink this Telegram account?': ['Отвязать этот аккаунт Telegram?', 'Ushbu Telegram hisobini uzasizmi?'],
  'Unlink Telegram': ['Отвязать Telegram', 'Telegramni uzish'],
  'Verify Telegram account': ['Подтвердить Telegram', 'Telegram hisobini tasdiqlash'],
  'Change password': ['Изменить пароль', 'Parolni o‘zgartirish'],
  'Current password': ['Текущий пароль', 'Joriy parol'],
  'Notifications': ['Уведомления', 'Bildirishnomalar'],
  'No notifications': ['Нет уведомлений', 'Bildirishnomalar yo‘q'],
  'Mark as read': ['Прочитано', 'O‘qildi deb belgilash'],
  'Open the Mini App inside Telegram to verify your account.': ['Для подтверждения откройте мини-приложение в Telegram.', 'Hisobni tasdiqlash uchun Mini Appni Telegram ichida oching.'],
};
for (const [key, [ru, uz]] of Object.entries(secureAccountCopy)) interfaceTranslations[key] = { en: key, ru, 'uz-Latn': uz };
for (const [key, [ru, uz, en]] of Object.entries(securityCopy)) interfaceTranslations[key] = { en: en || key, ru, 'uz-Latn': uz };

const draftPlanCopy: Record<string, [string, string]> = {
  'Sample data — not real staff assignments': ['Пример данных — не реальные назначения сотрудникам', 'Namunaviy ma’lumotlar — haqiqiy xodimlarga tayinlov emas'],
  'Workbook plan code': ['Код плана из книги', 'Ish kitobidagi reja kodi'],
  'Workbook priority': ['Приоритет из книги', 'Ish kitobidagi ustuvorlik'],
  'Work-plan category': ['Категория рабочего плана', 'Ish rejasi toifasi'],
  'Reviewer (source or sample)': ['Рецензент (источник или пример)', 'Taqrizchi (manba yoki namuna)'],
  'Suggested responsible department': ['Предлагаемое ответственное подразделение', 'Taklif etilgan mas’ul bo‘linma'],
  'Sample execution responsibility': ['Пример ответственного исполнителя', 'Namunaviy ijro mas’uliyati'],
  'Completed workbook': ['Заполненная книга', 'To‘ldirilgan ish kitobi'],
  'The completed workbook contains invalid or incomplete task fields.': ['Заполненная книга содержит неверные или неполные поля заданий.', 'To‘ldirilgan ish kitobida noto‘g‘ri yoki to‘liq bo‘lmagan topshiriq maydonlari mavjud.'],
  'The completed workbook contains duplicate plan codes.': ['В заполненной книге повторяются коды плана.', 'To‘ldirilgan ish kitobida reja kodlari takrorlangan.'],
  'Unassigned draft plan import': ['Импорт чернового плана без исполнителей', 'Biriktirilmagan ish rejasi qoralamasini import qilish'],
  'No live tasks, priorities, or staff assignments will be created. Source schedule text is kept as written.': [
    'Активные задания, приоритеты и назначения сотрудникам созданы не будут. Сроки сохраняются в исходном виде.',
    'Faol topshiriqlar, ustuvorliklar yoki xodimlarga tayinlovlar yaratilmaydi. Manbadagi muddat matni aynanligicha saqlanadi.',
  ],
  'Upload the original work-plan Excel file': ['Загрузите исходный файл плана Excel', 'Ish rejasining asl Excel faylini yuklang'],
  'Please select an Excel .xlsx file.': ['Выберите файл Excel в формате .xlsx.', 'Excel .xlsx faylini tanlang.'],
  'The selected file is larger than the 10 MB limit.': ['Размер выбранного файла превышает 10 МБ.', 'Tanlangan fayl hajmi 10 MB chegarasidan katta.'],
  'Preview import': ['Предварительный просмотр', 'Importni ko‘rib chiqish'],
  'Importing...': ['Импорт выполняется...', 'Import qilinmoqda...'],
  'Import failed.': ['Импорт не выполнен.', 'Import amalga oshmadi.'],
  'Source file': ['Исходный файл', 'Manba fayl'],
  'Draft plan preview': ['Предварительный просмотр чернового плана', 'Ish rejasi qoralamasini ko‘rib chiqish'],
  'Items': ['Пункты', 'Bandlar'],
  'Import draft plan': ['Импортировать черновой план', 'Ish rejasi qoralamasini import qilish'],
  'Import completed. The plan is stored as an inactive draft.': [
    'Импорт завершен. План сохранен как неактивный черновик.',
    'Import yakunlandi. Reja faol bo‘lmagan qoralama sifatida saqlandi.',
  ],
  'Saved unassigned draft plans': ['Сохраненные черновые планы без исполнителей', 'Saqlangan biriktirilmagan ish rejalari'],
  'No draft plans imported yet.': ['Черновые планы еще не импортированы.', 'Hali ish rejalari qoralamasi import qilinmagan.'],
  'View items': ['Посмотреть пункты', 'Bandlarni ko‘rish'],
  'Hide items': ['Скрыть пункты', 'Bandlarni yashirish'],
  'Mechanism': ['Механизм реализации', 'Amalga oshirish mexanizmi'],
  'Schedule': ['Срок выполнения', 'Bajarish muddati'],
  'Funding source': ['Источник финансирования', 'Moliyalashtirish manbasi'],
  'Oversight': ['Контроль', 'Nazorat'],
  'Responsible': ['Ответственный', 'Mas’ul'],
  'Distributed units': ['Распределенные подразделения', 'Taqsimlangan bo‘linmalar'],
  'Only the first 12 items appear in this preview; all items are saved.': [
    'В предварительном просмотре показаны первые 12 пунктов; сохраняются все пункты.',
    'Ko‘rib chiqishda faqat dastlabki 12 band ko‘rsatiladi; barcha bandlar saqlanadi.',
  ],
  'The workbook has no sheets.': ['В книге нет листов.', 'Ish kitobida varaqlar yo‘q.'],
  'This is not a supported ToshTech work-plan workbook.': ['Формат файла не соответствует рабочему плану ToshTech.', 'Bu ToshTech ish rejasi uchun mos Excel formati emas.'],
  'The workbook is missing required work-plan columns.': ['В книге отсутствуют обязательные столбцы плана.', 'Ish rejasidagi zarur ustunlar faylda yo‘q.'],
  'The workbook title is missing.': ['В книге отсутствует название плана.', 'Ish rejasining sarlavhasi faylda yo‘q.'],
  'Could not determine the work-plan year from the file name or title.': [
    'Не удалось определить год плана по имени файла или названию.',
    'Fayl nomi yoki sarlavhadan ish rejasining yilini aniqlab bo‘lmadi.',
  ],
  'Work-plan item {number} is missing a section heading.': [
    'Для пункта плана {number} не указан раздел.',
    '{number}-reja bandi uchun bo‘lim ko‘rsatilmagan.',
  ],
  'A numbered work-plan item is missing its section heading.': [
    'Для пронумерованного пункта плана не указан раздел.',
    'Raqamlangan ish rejasi bandi uchun bo‘lim ko‘rsatilmagan.',
  ],
  'No numbered work-plan items were found.': ['Не найдены пронумерованные пункты плана.', 'Raqamlangan ish rejasi bandlari topilmadi.'],
  'The workbook contains duplicate section or item numbers.': [
    'В книге повторяются номера разделов или пунктов.',
    'Ish kitobida bo‘lim yoki band raqamlari takrorlangan.',
  ],
  'Every numbered work-plan item must have a title.': [
    'У каждого пронумерованного пункта должно быть название.',
    'Raqamlangan har bir ish rejasi bandida sarlavha bo‘lishi kerak.',
  ],
  'Each work-plan item must refer to one of the plan sections.': [
    'Каждый пункт плана должен относиться к одному из разделов.',
    'Har bir ish rejasi bandi reja bo‘limlaridan biriga tegishli bo‘lishi kerak.',
  ],
  'A work plan with this title and year or source file is already imported.': [
    'План с таким названием и годом или исходным файлом уже импортирован.',
    'Bunday nom va yilga ega yoki shu manba faylidan olingan ish rejasi avval import qilingan.',
  ],
  'The preview no longer matches this draft plan. Preview it again before importing.': [
    'Предварительный просмотр больше не соответствует черновому плану. Повторите просмотр перед импортом.',
    'Ko‘rib chiqish ma’lumotlari ish rejasi qoralamasiga mos emas. Importdan oldin qayta ko‘rib chiqing.',
  ],
  'Unassigned draft plan was not found.': ['Черновой план без исполнителей не найден.', 'Biriktirilmagan ish rejasi qoralamasi topilmadi.'],
  'Unassigned draft plans cannot be activated before their items are assigned.': [
    'Черновой план нельзя активировать до назначения исполнителей его пунктам.',
    'Qoralama bandlariga mas’ullar tayinlanmaguncha rejani faollashtirib bo‘lmaydi.',
  ],
};
for (const [key, [ru, uz]] of Object.entries(draftPlanCopy)) {
  interfaceTranslations[key] = { en: key, ru, 'uz-Latn': uz };
}
