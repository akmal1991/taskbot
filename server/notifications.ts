import type pg from 'pg';
import { audit, id, HttpError, transaction, type DB } from './db';
export async function readSettings(db: DB) {
  return (await db.query("SELECT value FROM ut_settings WHERE key='notifications'")).rows[0]?.value ?? {
    notificationsEnabled: false, reminderHour: 9, reminderTemplate: '{task}: deadline {deadline}',
  };
}
export async function runNotificationJob(database: pg.Pool, job: 'reminders' | 'delivery', request: any = {}) {
  const settings = await readSettings(database);
  if (!settings.notificationsEnabled) throw new HttpError(409, 'Enable notifications in system settings first.');
  if (job === 'delivery' && !process.env.TELEGRAM_BOT_TOKEN) throw new HttpError(503, 'Telegram delivery is not configured. Add the server-side bot token.');
  return transaction(database, async db => {
    if (!(await db.query('SELECT pg_try_advisory_xact_lock($1) AS locked', [job === 'delivery' ? 741203 : 741204])).rows[0].locked)
      throw new HttpError(409, 'This notification job is already running.');
    let processed = 0;
    if (job === 'reminders') {
      const tasks = (await db.query(`SELECT t.* FROM ut_tasks t JOIN ut_users u ON u.id=t.assignee_id
        WHERE u.active=true AND t.deadline<=(now() AT TIME ZONE 'Asia/Tashkent')::date+1 AND t.status<>'COMPLETED' AND NOT t.draft AND t.archived_at IS NULL
        AND NOT EXISTS(SELECT 1 FROM ut_notifications n WHERE n.task_id=t.id AND n.type='DEADLINE_WARNING_2H'
          AND (n.created_at AT TIME ZONE 'Asia/Tashkent')::date=(now() AT TIME ZONE 'Asia/Tashkent')::date)`)).rows;
      for (const t of tasks) {
        const body = String(settings.reminderTemplate).replaceAll('{task}', t.title).replaceAll('{deadline}', new Date(t.deadline).toISOString().slice(0, 10));
        await db.query(`INSERT INTO ut_notifications(id,user_id,task_id,type,title,body) VALUES($1,$2,$3,'DEADLINE_WARNING_2H',$4,$5)`, [id('notice'), t.assignee_id, t.id, t.plan_code, body]);
        processed++;
      }
    } else {
      const rows = (await db.query(`SELECT n.*,u.telegram_id,u.active FROM ut_notifications n JOIN ut_users u ON u.id=n.user_id
        WHERE n.status IN ('WAITING','FAILED') AND n.attempts<5 AND n.next_attempt_at<=now() ORDER BY n.created_at LIMIT 20 FOR UPDATE OF n SKIP LOCKED`)).rows;
      for (const n of rows) {
        let error = '';
        if (!n.telegram_id || !n.active) error = 'Recipient has no verified Telegram link or is inactive.';
        else {
          try {
            const reply = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: n.telegram_id, text: `${n.title}\n${n.body}`.slice(0, 4096) }),
              signal: AbortSignal.timeout(8000),
            });
            const data = await reply.json() as { ok?: boolean };
            if (!reply.ok || !data.ok) error = 'Telegram rejected the delivery.';
          } catch { error = 'Telegram delivery timed out or could not connect.'; }
        }
        await db.query(`UPDATE ut_notifications SET status=$2,attempts=attempts+1,last_error=$3,
          sent_at=CASE WHEN $2='SENT' THEN now() ELSE sent_at END,next_attempt_at=now()+interval '5 minutes' WHERE id=$1`,
        [n.id, error ? 'FAILED' : 'SENT', error || null]);
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
  const timer = setInterval(async () => {
    try {
      const settings = await readSettings(database);
      if (!settings.notificationsEnabled) return;
      // Schedule is expressed in Asia/Tashkent civil time, not the server timezone.
      const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tashkent', hour: '2-digit', hourCycle: 'h23' }).format(new Date()));
      if (hour === settings.reminderHour) await runNotificationJob(database, 'reminders');
      if (process.env.TELEGRAM_BOT_TOKEN) await runNotificationJob(database, 'delivery');
    } catch { /* Persistent delivery errors are retained on notification records. Setup errors do not log secrets. */ }
  }, 60000);
  timer.unref(); return timer;
}
