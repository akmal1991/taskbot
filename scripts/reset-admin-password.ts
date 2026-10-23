import { z } from 'zod';
import { audit, pool, transaction } from '../server/db';
import { digest, hashPassword } from '../server/security';

try {
  const input = z.object({
    email: z.email().max(254),
    password: z.string().min(12).max(128),
  }).parse({
    email: process.env.BOOTSTRAP_ADMIN_EMAIL,
    password: process.env.ADMIN_RESET_PASSWORD,
  });
  const passwordHash = await hashPassword(input.password);

  await transaction(pool, async db => {
    await db.query('SELECT pg_advisory_xact_lock(741202)');
    const result = await db.query(
      "SELECT id, username, email FROM ut_users WHERE lower(email)=$1 AND role='ADMIN' AND active=true FOR UPDATE",
      [input.email.toLowerCase()],
    );
    if (result.rowCount !== 1) {
      throw new Error('The active administrator for the configured email was not found uniquely.');
    }

    const user = result.rows[0];
    const usernameConflict = await db.query(
      "SELECT 1 FROM ut_users WHERE lower(username)='admin' AND id<>$1 LIMIT 1",
      [user.id],
    );
    if (usernameConflict.rowCount) {
      throw new Error('The requested login name is already assigned to another account.');
    }

    await db.query(
      "UPDATE ut_users SET username='admin',password_hash=$2,auth_version=auth_version+1 WHERE id=$1",
      [user.id, passwordHash],
    );
    await db.query(
      "UPDATE ut_account_tokens SET consumed_at=now() WHERE user_id=$1 AND purpose IN ('RESET','ACTIVATE') AND consumed_at IS NULL",
      [user.id],
    );
    await db.query('DELETE FROM ut_sessions WHERE user_id=$1', [user.id]);
    await db.query(
      'DELETE FROM ut_login_throttle WHERE key=ANY($1::text[])',
      [[user.username, 'admin', user.email].map(value => digest(`account:${value.toLowerCase()}`))],
    );
    await audit(db, { ip: undefined }, 'ADMIN_PASSWORD_RESET', user.id);
  });

  console.log('Admin password reset successfully. Remove ADMIN_RESET_PASSWORD from workspace Secrets.');
} catch (error) {
  if (error instanceof z.ZodError) {
    const fields = [...new Set(error.issues.map(issue => issue.path.join('.')))].join(', ');
    console.error(`Admin reset values failed validation for: ${fields || 'configuration'}. Password must be 12–128 characters. Secret values were not logged.`);
  } else if (error instanceof Error && (
    error.message === 'The active administrator for the configured email was not found uniquely.' ||
    error.message === 'The requested login name is already assigned to another account.'
  )) {
    console.error(error.message);
  } else {
    console.error('Admin password reset failed. Check database connectivity. Secret values were not logged.');
  }
  process.exitCode = 1;
} finally {
  await pool.end();
}
