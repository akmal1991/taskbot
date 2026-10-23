import { pool, id, transaction, audit } from '../server/db';
import { hashPassword } from '../server/security';
import { z } from 'zod';
try {
  const input = z.object({
    username: z.string().regex(/^[A-Za-z0-9_.-]{3,64}$/),
    email: z.email().max(254), password: z.string().min(12).max(128),
  }).parse({ username: process.env.BOOTSTRAP_ADMIN_USERNAME, email: process.env.BOOTSTRAP_ADMIN_EMAIL, password: process.env.BOOTSTRAP_ADMIN_PASSWORD });
  const hash = await hashPassword(input.password);
  await transaction(pool, async db => {
    await db.query('SELECT pg_advisory_xact_lock(741202)');
    if ((await db.query("SELECT id FROM ut_users WHERE role='ADMIN' AND active=true")).rowCount)
      throw new Error('An active administrator already exists. Use authenticated account management.');
    const userId = id('user');
    await db.query("INSERT INTO ut_users(id,username,email,full_name,role,password_hash,active) VALUES($1,$2,$3,'System administrator','ADMIN',$4,true)",
      [userId, input.username, input.email.toLowerCase(), hash]);
    await audit(db, { ip: undefined }, 'FIRST_ADMIN_PROVISIONED', userId);
  });
  console.log('First administrator provisioned. Remove the bootstrap password from the environment after use.');
} catch (error) {
  if (error instanceof z.ZodError) {
    const fields = [...new Set(error.issues.map(issue => issue.path.join('.')))].join(', ');
    console.error(`Bootstrap values failed validation for: ${fields || 'configuration'}. Username: 3–64 letters/numbers/dot/underscore/hyphen; email: valid email; password: 12–128 characters. Secret values were not logged.`);
  } else if (error instanceof Error && error.message.startsWith('An active administrator already exists.')) {
    console.error(error.message);
  } else {
    console.error('Provisioning failed. Check database connectivity and account uniqueness. Secret values were not logged.');
  }
  process.exitCode = 1;
} finally { await pool.end(); }
