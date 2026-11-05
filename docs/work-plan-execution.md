# Ish rejasi ijrosi

Asosiy sahifa va `#tasks` ish rejalari uchun xizmat qiladi. Avvalgi yozuvlar o‘chirilmaydi.

1. Rasmiy Excel faylni yuklab, bandlar soni va matnini ko‘rib chiqing. Import loyiha yaratadi, xodimlarga bildirishnoma yubormaydi.
2. Umumiy ish rejasi uchun muhimlik darajasi va faol rektor hisobini tanlang. Band va bosqichlarga alohida muhimlik belgilanmaydi.
3. Har bir bandga bosqichlar, aniq bajarish muddatlari va mas’ul bo‘linma/xodimlarni biriktiring. Bir bosqichda bir nechta ijrochi bo‘lishi mumkin. Excel’dagi asl matn, mas’ullar va murakkab muddatlar saqlanadi; sana yoki xodim avtomatik taxmin qilinmaydi.
4. Biriktirishlarni saqlang va rejani rektor tasdig‘iga yuboring. Belgilangan rektor uni qaytarishi yoki ijroga tasdiqlashi mumkin.
5. Tasdiqlash barcha bosqichlar va shaxsiy bildirishnomalarni bitta tranzaksiyada yaratadi. Telegram xabarlari faqat tasdiqlangan Telegram hisoblariga yuboriladi.
6. Xodim ijroni boshlaydi, 0–99% jarayonni yangilaydi va hisobot/dalilni rektorga yuboradi. PDF, DOCX, XLSX, PNG va JPEG fayllari 10 MB gacha qabul qilinadi. Oddiy izoh va HTTP(S) havola ham qo‘llanadi.
7. Har bir ijrochining dalili alohida tekshiriladi. Belgilangan rektor tasdiqlagach, uning ijrosi 100% bo‘ladi. Qaytarilgan ishni xodim tuzatib, qayta yuboradi. Barcha bosqichlar tasdiqlangach, reja bajarilgan hisoblanadi.

Ish rejasi holati va biriktirishlari `ut_work_plans.data.workflow` ichida, asl Excel bandlari `data.items` ichida saqlanadi. Tasdiqlangan bosqichlar mavjud ijro, dalil, bildirishnoma va audit mexanizmlaridan foydalanadi. Sxema migratsiyasi talab qilinmaydi. Avvalgi uchta migratsiya o‘rnatilgan bo‘lishi kerak.
