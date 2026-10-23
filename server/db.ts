import pg from 'pg';
import { randomUUID } from 'node:crypto';
import type { Request } from 'express';
import type { Permission, Role } from '../shared/policy';
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 10, connectionTimeoutMillis: 5000 });
export type DB = pg.Pool | pg.PoolClient;
export const id = (prefix: string) => `${prefix}-${randomUUID()}`;
export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export const assert = (condition: unknown, status: number, message: string): asserts condition => {
  if (!condition) throw new HttpError(status, message);
};
export interface Actor { id: string; role: Role; fullName: string; permissions: Permission[]; telegramId?: string; }
declare global {
  namespace Express {
    interface Request { actor?: Actor; sessionHash?: string; csrfToken?: string; }
  }
}
export async function transaction<T>(database: pg.Pool, work: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await database.connect();
  try { await client.query('BEGIN'); const result = await work(client); await client.query('COMMIT'); return result; }
  catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
}
export const publicUser = (row: any) => ({
  id: row.id, username: row.username, email: row.email, fullName: row.full_name,
  role: row.role, roleLabel: row.role, departmentId: row.department_id,
  departmentName: row.department_name, active: row.active,
  phone: row.data?.phone || '', avatarUrl: row.data?.avatarUrl,
  telegramId: row.telegram_id, telegramUsername: row.telegram_username,
  isTelegramBound: Boolean(row.telegram_id), lastLoginAt: row.last_login_at,
});
export async function audit(db: DB, request: Pick<Request, 'actor' | 'ip'>, action: string, targetId?: string,
  before: unknown = null, after: unknown = null, details = '') {
  await db.query(`INSERT INTO ut_audit(actor_id,actor_name,actor_role,action,target_id,before_data,after_data,details,ip_address)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
  [request.actor?.id ?? null, request.actor?.fullName ?? 'System', request.actor?.role ?? 'SYSTEM',
    action, targetId ?? null, before === null ? null : JSON.stringify(before), after === null ? null : JSON.stringify(after), details, request.ip || '']);
}
