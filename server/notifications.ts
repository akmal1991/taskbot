import type pg from 'pg';
import { audit, id, HttpError, transaction, type DB } from './db';
import { priorityLabels, prioritySticker } from './prioritySticker';

export async function queueAssignmentNotification(db: DB, taskId: string, userId: string, departmentId: string) {
  const task = (await db.query(`SELECT t.*,creator.full_name AS creator_name,recipient.full_name AS recipient_name,
    d.name AS department_name,c.name AS category_name FROM ut_tasks t
    JOIN ut_users creator ON creator.id=t.creator_id JOIN ut_users recipient ON recipient.id=$2
    JOIN ut_departments d ON d.id=$3 LEFT JOIN ut_categories c ON c.id=t.category_id WHERE t.id=$1`, [taskId,userId,departmentId])).rows[0];
  const body = [
    '📋 YANGI TOPSHIRIQ', '', `🔢 Reja kodi: ${task.plan_code}`, `📝 Topshiriq: ${task.title}`,
    `🚦 Muhimlik: ${priorityLabels[task.priority] || task.priority}`,
    `📅 Bajarish muddati: ${new Date(task.deadline).toISOString().slice(0,10)}`,
    `👤 Topshiriq beruvchi: ${task.creator_name}`, `🏢 Mas’ul bo‘lim: ${task.department_name}`,
    `👷 Ijrochi: ${task.recipient_name}`, ...(task.category_name ? [`🗂 Kategoriya: ${task.category_name}`] : []),
    ...(task.data?.description ? ['', '📄 Amalga oshirish mexanizmi:', String(task.data.description).slice(0,1800)] : []),
    ...(task.data?.expectedOutcome ? ['', `🎯 Kutilayotgan natija: ${String(task.data.expectedOutcome).slice(0,400)}`] : []),
    '', '👇 Tafsilotlar va ish dalilini yuborish uchun topshiriqni oching.',
  ].join('\n').slice(0,3900);
  await db.query(`INSERT INTO ut_notifications(id,user_id,task_id,type,title,body) VALUES($1,$2,$3,'NEW_ASSIGNMENT',$4,$5)`,
    [id('notice'),userId,taskId,task.plan_code,body]);
}
export async function readSettings(db: DB) {
  return (await db.query("SELECT value FROM ut_settings WHERE key='notifications'")).rows[0]?.value ?? {
    notificationsEnabled: false, reminderHour: 9, reminderTemplate: '{task}: deadline {deadline}',
  };
}
export async function runNotificationJob(database: pg.Pool, job: 'reminders' | 'delivery', request: any = {}, transport: typeof fetch = fetch) {
  const settings = await readSettings(database);
  if (!settings.notificationsEnabled) throw new HttpError(409, 'Enable notifications in system settings first.');
  if (job === 'delivery' && !process.env.TELEGRAM_BOT_TOKEN) throw new HttpError(503, 'Telegram delivery is not configured. Add the server-side bot token.');
  return transaction(database, async db => {
    if (!(await db.query('SELECT pg_try_advisory_xact_lock($1) AS locked', [job === 'delivery' ? 741203 : 741204])).rows[0].locked)
      throw new HttpError(409, 'This notification job is already running.');
    let processed = 0;
    if (job === 'reminders') {
      const tasks = (await db.query(`SELECT t.*,member->>'userId' AS recipient_id FROM ut_tasks t
        CROSS JOIN LATERAL jsonb_array_elements(COALESCE(t.data->'assignments',jsonb_build_array(jsonb_build_object('userId',t.assignee_id,'status',t.status)))) member
        JOIN ut_users u ON u.id=member->>'userId'
        WHERE u.active=true AND t.deadline<=(now() AT TIME ZONE 'Asia/Tashkent')::date+1 AND member->>'status'<>'COMPLETED' AND NOT t.draft AND t.archived_at IS NULL
        AND NOT EXISTS(SELECT 1 FROM ut_notifications n WHERE n.task_id=t.id AND n.user_id=u.id AND n.type='DEADLINE_WARNING_2H'
          AND (n.created_at AT TIME ZONE 'Asia/Tashkent')::date=(now() AT TIME ZONE 'Asia/Tashkent')::date)`)).rows;
      for (const t of tasks) {
        const body = String(settings.reminderTemplate).replaceAll('{task}', t.title).replaceAll('{deadline}', new Date(t.deadline).toISOString().slice(0, 10));
        await db.query(`INSERT INTO ut_notifications(id,user_id,task_id,type,title,body) VALUES($1,$2,$3,'DEADLINE_WARNING_2H',$4,$5)`, [id('notice'), t.recipient_id, t.id, t.plan_code, body]);
        processed++;
      }
    } else {
      const rows = (await db.query(`SELECT n.*,u.telegram_id,u.active,t.priority FROM ut_notifications n JOIN ut_users u ON u.id=n.user_id
        LEFT JOIN ut_tasks t ON t.id=n.task_id
        WHERE n.status IN ('WAITING','FAILED') AND n.attempts<5 AND n.next_attempt_at<=now()
        AND u.active=true AND u.telegram_id IS NOT NULL ORDER BY n.created_at LIMIT 20 FOR UPDATE OF n SKIP LOCKED`)).rows;
      for (const n of rows) {
        let error = '';
        let stickerWarning = '';
        if (!n.telegram_id || !n.active) error = 'Recipient has no verified Telegram link or is inactive.';
        else {
          try {
            const appUrl = process.env.APP_URL || (process.env.RENDER_EXTERNAL_URL || '');
            const taskUrl = /^https:\/\//.test(appUrl) ? `${appUrl.replace(/\/$/, '')}/#tasks` : '';
            const reply = await transport(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: n.telegram_id, text: `${n.title}\n${n.body}`.slice(0, 4096),
                ...(taskUrl && n.task_id ? { reply_markup: { inline_keyboard: [[{ text: '🚀 UniTaskni ochish', style: 'primary', web_app: { url: taskUrl } }]] } } : {}) }),
              signal: AbortSignal.timeout(8000),
            });
            const data = await reply.json() as { ok?: boolean; result?: { message_id: number } };
            if (!reply.ok || !data.ok) error = 'Telegram rejected the delivery.';
            else if (n.type === 'NEW_ASSIGNMENT') {
              // A decoration failure must never resend an already delivered task message.
              try {
                const sticker = new FormData();
                sticker.set('chat_id', n.telegram_id);
                sticker.set('sticker', new Blob([new Uint8Array(prioritySticker(n.priority))], { type: 'application/x-tgsticker' }), 'unitask-priority.tgs');
                sticker.set('disable_notification', 'true');
                if (data.result?.message_id) sticker.set('reply_parameters', JSON.stringify({ message_id: data.result.message_id }));
                const stickerReply = await transport(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendSticker`, {
                  method: 'POST', body: sticker, signal: AbortSignal.timeout(8000),
                });
                const stickerResult = await stickerReply.json() as { ok?: boolean };
                if (!stickerReply.ok || !stickerResult.ok) stickerWarning = 'Task message delivered; priority sticker was rejected.';
              } catch { stickerWarning = 'Task message delivered; priority sticker could not be sent.'; }
            }
          } catch { error = 'Telegram delivery timed out or could not connect.'; }
        }
        await db.query(`UPDATE ut_notifications SET status=$2,attempts=attempts+1,last_error=$3,
          sent_at=CASE WHEN $2='SENT' THEN now() ELSE sent_at END,next_attempt_at=now()+interval '5 minutes' WHERE id=$1`,
        [n.id, error ? 'FAILED' : 'SENT', error || stickerWarning || null]);
        processed++;
      }
    }
    await db.query(`INSERT INTO ut_settings(key,value) VALUES($1,$2) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=now()`,
      [`job:${job}`, JSON.stringify({ processed, lastRun: new Date().toISOString() })]);
    await audit(db, request, 'NOTIFICATION_JOB_RUN', job, null, { processed });
    return processed;
  });
}
export function startNotificationScheduler(database: pg.Pool) {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const settings = await readSettings(database);
      if (!settings.notificationsEnabled) return;
      // Schedule is expressed in Asia/Tashkent civil time, not the server timezone.
      const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tashkent', hour: '2-digit', hourCycle: 'h23' }).format(new Date()));
      if (hour === settings.reminderHour) await runNotificationJob(database, 'reminders');
      if (process.env.TELEGRAM_BOT_TOKEN) await runNotificationJob(database, 'delivery');
    } catch { /* Persistent delivery errors are retained on notification records. Setup errors do not log secrets. */ }
    finally { running = false; }
  };
  const timer = setInterval(tick, 15000);
  void tick();
  timer.unref(); return timer;
}
