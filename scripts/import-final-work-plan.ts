import { basename } from 'node:path';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { pool, audit, transaction } from '../server/db';
import { parseDraftPlanWorkbook } from '../src/utils/draftPlanImport';
import { mergeDraftCompletion } from '../src/utils/draftPlanCompletion';

// Explicit, development-only administrative operation. Does not seed on startup.
try {
  if (process.env.NODE_ENV === 'production' || process.env.REPLIT_DEPLOYMENT === '1') {
    throw new Error('This command only supports the Preview development database.');
  }
  const path = process.argv[2];
  if (!path || !path.endsWith('.xlsx')) throw new Error('Provide the completed .xlsx workbook path.');
  const bytes = await readFile(path);
  const plan = parseDraftPlanWorkbook(bytes, basename(path));
  if (plan.items.some(item => !item.completion)) throw new Error('Every item must have completed workbook fields.');
  const digest = createHash('sha256').update(bytes).digest('hex');
  const result = await transaction(pool, async db => {
    await db.query('SELECT pg_advisory_xact_lock($1)', [741203]);
    const candidates = await db.query(
      'SELECT * FROM ut_work_plans WHERE year=$1 AND lower(title)=lower($2) FOR UPDATE',
      [plan.year, plan.title],
    );
    if (candidates.rowCount !== 1) throw new Error('Exactly one matching existing draft plan is required.');
    const existing = candidates.rows[0];
    if (existing.active || existing.data?.draftImportKind !== 'UNASSIGNED_DRAFT') throw new Error('Plan is not an inactive unassigned draft.');
    if ((await db.query('SELECT id FROM ut_tasks WHERE work_plan_id=$1 LIMIT 1', [existing.id])).rowCount) {
      throw new Error('Plan already contains live tasks; manual reconciliation is required.');
    }
    const sections = new Map(plan.sections.map(section => [section.number, section.title]));
    if (existing.data.sections.length !== plan.sections.length ||
        existing.data.sections.some((section: { number: string; title: string }) => sections.get(section.number) !== section.title)) {
      throw new Error('Source sections changed.');
    }
    const items = mergeDraftCompletion(existing.data.items, plan.items);
    if (existing.data.completedWorkbook?.digest === digest) return { status: 'already_imported', items: items.length };
    const completedWorkbook = { sourceName: plan.sourceName, digest, sampleData: plan.items.some(i => i.completion?.sampleData), importedAt: new Date().toISOString() };
    if (!process.argv.includes('--commit')) return { status: 'preview', items: items.length, source: plan.sourceName };
    const data = { ...existing.data, items, completedWorkbook };
    await db.query('UPDATE ut_work_plans SET data=$2::jsonb WHERE id=$1', [existing.id, JSON.stringify(data)]);
    await audit(db, { ip: undefined }, 'WORK_PLAN_COMPLETION_IMPORTED', existing.id, existing.data, data,
      'User-requested workspace administrative import. Sample metadata only; no live tasks, accounts or notifications created.');
    return { status: 'imported', items: items.length, active: false, source: plan.sourceName };
  });
  console.log(JSON.stringify(result));
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Workbook import failed.');
  process.exitCode = 1;
} finally {
  await pool.end();
}
