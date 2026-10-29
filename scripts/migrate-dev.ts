import { readFile, readdir } from 'node:fs/promises';
import { pool } from '../server/db';
if (process.env.NODE_ENV === 'production' || process.env.REPLIT_DEPLOYMENT === '1') {
  console.error('This command only applies development migrations. Publish handles production schema changes.');
  process.exitCode = 1;
} else {
  try { for (const file of (await readdir(new URL('../migrations/', import.meta.url))).filter(file => file.endsWith('.sql')).sort()) await pool.query(await readFile(new URL(`../migrations/${file}`, import.meta.url), 'utf8')); console.log('Development schema is ready. No records were seeded.'); }
  catch { console.error('Development migration failed. Check database availability.'); process.exitCode = 1; }
}
await pool.end();
