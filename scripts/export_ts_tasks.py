import json

with open("scripts/tasks_dump.json", "r", encoding="utf-8") as f:
    tasks_data = json.load(f)

sections = [
    {
        "id": "SEC-1",
        "number": "I",
        "title": "Олий таълим ташкилотини кескин ўзгартиришга қаратилган янги ташаббуслар",
        "taskCount": 12
    },
    {
        "id": "SEC-2",
        "number": "II",
        "title": "Ўқув жараёнини ташкил этиш, таълим сифатини таъминлаш, янги педагогик технологиялар ва ўқитиш усулларини жорий этиш",
        "taskCount": 23
    },
    {
        "id": "SEC-3",
        "number": "III",
        "title": "Илмий-тадқиқот ва инновацион фаолиятни ривожлантириш ҳамда илмий ишлар натижадорлигини таъминлаш",
        "taskCount": 13
    },
    {
        "id": "SEC-4",
        "number": "IV",
        "title": "Маънавий-маърифий ва тарбиявий ишлар тизимини такомиллаштириш",
        "taskCount": 8
    },
    {
        "id": "SEC-5",
        "number": "V",
        "title": "Халқаро ҳамкорликни ташкил этиш ва ривожлантириш",
        "taskCount": 11
    },
    {
        "id": "SEC-6",
        "number": "VI",
        "title": "Университет фаолиятини рақамлаштириш ва таълим жараёнларига замонавий ахборот технологияларини жорий этиш",
        "taskCount": 7
    },
    {
        "id": "SEC-7",
        "number": "VII",
        "title": "Ташкилий-бошқарув фаолиятини такомиллаштириш",
        "taskCount": 13
    },
    {
        "id": "SEC-8",
        "number": "VIII",
        "title": "Моддий-техника базасини мустаҳкамлаш ва молиявий барқарорликни таъминлаш",
        "taskCount": 5
    }
]

sec_dict = {s["id"]: s["title"] for s in sections}

ts_tasks = []
for t in tasks_data:
    item_num, title, mechanism, deadline, priority, dept_id, dept_name, assignee_id, assignee_name, approver_name, funding, sec_id, status, progress = t
    
    proofs = []
    if status == 'COMPLETED':
        proofs.append({
            "id": f"proof-{item_num}",
            "taskId": f"task-{item_num:02d}",
            "type": "DOCUMENT",
            "fileName": f"Topshiriq_{item_num}_yakuniy_hisobot.pdf",
            "fileSize": "2.8 MB",
            "note": f"Topshiriq mezonlarga muvofiq to'liq bajarildi va tegishli dalolatnomalar rasmiylashtirildi.",
            "artifactUrl": f"https://storage.toshtech.uz/archive/2026/task_{item_num}.pdf",
            "submittedAt": "2026-10-10 14:00",
            "submittedBy": assignee_name,
            "submittedById": assignee_id,
            "status": "APPROVED",
            "reviewerRemarks": "Topshiriq mezonlarga muvofiq to'liq qabul qilindi.",
            "reviewedAt": "2026-10-11 10:00",
            "reviewedBy": approver_name
        })
    elif status == 'SUBMITTED_FOR_REVIEW':
        proofs.append({
            "id": f"proof-{item_num}",
            "taskId": f"task-{item_num:02d}",
            "type": "DOCUMENT",
            "fileName": f"Topshiriq_{item_num}_hisobot_loyihasi.pdf",
            "fileSize": "1.9 MB",
            "note": f"Topshiriq bo'yicha belgilangan barcha mexanizmlar bajarildi. Ko'rikdan o'tkazish va tasdiqlash uchun taqdim etilmoqda.",
            "artifactUrl": f"https://storage.toshtech.uz/review/task_{item_num}.pdf",
            "submittedAt": "2026-10-21 16:30",
            "submittedBy": assignee_name,
            "submittedById": assignee_id,
            "status": "PENDING"
        })
    elif status == 'OVERDUE':
        proofs.append({
            "id": f"proof-{item_num}",
            "taskId": f"task-{item_num:02d}",
            "type": "TEXT_NOTE",
            "note": "Topshiriq bo'yicha oraliq natijalar tayyorlandi, ammo hamkorlar bilan muvofiqlashtirish kechikishi sababli muddat uzaytirilishi so'ralmoqda.",
            "submittedAt": "2026-10-20 18:00",
            "submittedBy": assignee_name,
            "submittedById": assignee_id,
            "status": "PENDING"
        })

    task_obj = {
        "id": f"task-{item_num:02d}",
        "itemNumber": item_num,
        "planCode": f"TT-2026-{item_num:02d}",
        "title": title,
        "description": mechanism,
        "expectedOutcome": f"ToshTech 2026–2027 yillik ish rejasi {item_num}-bandida belgilangan ko'rsatkichlarga 100% erishish.",
        "acceptanceCriteria": "ToshTech Rektorati va mutasaddi prorektorlar tomonidan tasdiqlangan hujjatli dalolatnoma va hisobot.",
        "sourceReference": "ToshTech 2027-yil sentyabr oyiga qadar amalga ошириладиган ишлар РЕЖАСИ",
        "fundingSource": funding,
        "sectionId": sec_id,
        "sectionTitle": sec_dict.get(sec_id, ""),
        "status": status,
        "priority": priority,
        "departmentId": dept_id,
        "departmentName": dept_name,
        "assignedToId": assignee_id,
        "assignedToName": assignee_name,
        "assignedToTelegramId": "554198302" if assignee_id == "user-qayumov" else ("98412034" if assignee_id == "user-axatov" else "77218943"),
        "assignedToTelegramUsername": "jasur_toshtech" if assignee_id == "user-qayumov" else ("dilshod_karimov" if assignee_id == "user-axatov" else "farhod_ibragimov"),
        "createdById": "user-director",
        "createdByName": "Prof. Rustam O. Xoliqov",
        "approverId": "user-rustamov" if "Рустамов" in approver_name else ("user-tsironis" if "Циронис" in approver_name else "user-director"),
        "approverName": approver_name,
        "assignedDate": "2026-09-01",
        "deadline": deadline,
        "progressPercent": progress,
        "proofs": proofs,
        "createdAt": "2026-09-01 08:00",
        "updatedAt": "2026-10-21 16:30",
        "isClockedIn": status in ["IN_PROGRESS", "SUBMITTED_FOR_REVIEW"]
    }

    if status == "COMPLETED":
        task_obj["actualCompletionDate"] = "2026-10-11"
    if status in ["IN_PROGRESS", "SUBMITTED_FOR_REVIEW"]:
        task_obj["clockedInAt"] = "2026-10-22 08:30"

    ts_tasks.append(task_obj)

ts_content = f"""import {{ Task, WorkPlanSection }} from '../types';

export const OFFICIAL_SECTIONS: WorkPlanSection[] = {json.dumps(sections, ensure_ascii=False, indent=2)};

export const OFFICIAL_92_TASKS: Task[] = {json.dumps(ts_tasks, ensure_ascii=False, indent=2)};
"""

with open("src/data/officialTasks92.ts", "w", encoding="utf-8") as f:
    f.write(ts_content)

print("src/data/officialTasks92.ts updated successfully.")
