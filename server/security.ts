import { Router, type RequestHandler, type Request, type Response } from 'express';
import type pg from 'pg';
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { parseCookie, stringifySetCookie } from 'cookie';
import { z } from 'zod';
import { effectivePermissions, type Permission } from '../shared/policy';
import { audit, HttpError, publicUser, transaction, type DB } from './db';

let activePasswordJobs = 0;
const waitingPasswordJobs: (() => void)[] = [];
const scrypt = async (password: string, salt: Buffer, size: number, options: { N: number; r: number; p: number; maxmem: number }) => {
  if (activePasswordJobs >= 2) {
    if (waitingPasswordJobs.length >= 8) throw new HttpError(429, 'Password service is busy. Retry shortly.');
    await new Promise<void>(resolve => waitingPasswordJobs.push(resolve));
  } else activePasswordJobs++;
  try { return await new Promise<Buffer>((resolve, reject) => scryptCallback(password, salt, size, options, (error, result) => error ? reject(error) : resolve(result))); }
  finally { const next = waitingPasswordJobs.shift(); if (next) next(); else activePasswordJobs--; }
};
const production = process.env.NODE_ENV === 'production';
export const COOKIE_NAME = production ? '__Host-unitask.sid' : 'unitask.sid';
export const digest = (text: string) => createHash('sha256').update(text).digest('hex');
export const randomToken = () => randomBytes(32).toString('base64url');
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64, { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 }) as Buffer;
  return `scrypt$131072$8$1$${salt.toString('hex')}$${key.toString('hex')}`;
}
export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [algorithm, n, r, p, salt, hash] = encoded.split('$');
  if (algorithm !== 'scrypt' || n !== '131072' || r !== '8' || p !== '1' || !/^[a-f0-9]{32}$/.test(salt || '') || !/^[a-f0-9]{128}$/.test(hash || '')) return false;
  const key = await scrypt(password, Buffer.from(salt, 'hex'), 64, { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 }) as Buffer;
  return timingSafeEqual(key, Buffer.from(hash, 'hex'));
}
const dummyHash = `scrypt$131072$8$1$${randomBytes(16).toString('hex')}$${randomBytes(64).toString('hex')}`;
export const wrap = (fn: (req: Request, res: Response) => Promise<any>): RequestHandler =>
  (req, res, next) => { Promise.resolve(fn(req, res)).catch(next); };
const passwordSchema = z.string().min(12, 'Use at least 12 characters.').max(128);
const setSessionCookie = (res: Response, token: string, maxAge = 8 * 60 * 60) => res.setHeader('Set-Cookie',
  stringifySetCookie({ name: COOKIE_NAME, value: token, httpOnly: true, secure: production, sameSite: 'strict', path: '/', maxAge }));

export function originGuard(req: Request, _res: Response, next: (error?: any) => void) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (req.get('sec-fetch-site') === 'cross-site') return next(new HttpError(403, 'Cross-site requests are not allowed.'));
  if (origin) {
    try { if (new URL(origin).host !== req.get('host')) return next(new HttpError(403, 'Invalid request origin.')); }
    catch { return next(new HttpError(403, 'Invalid request origin.')); }
  }
  if (!req.is('application/json') && !req.is('multipart/form-data') && Number(req.get('content-length') || 0) > 0)
    return next(new HttpError(415, 'Use JSON for this request.'));
  next();
}
export const requireAuth: RequestHandler = (req, _res, next) =>
  next(req.actor ? undefined : new HttpError(401, 'Please sign in to continue.'));
export const permit = (permission: Permission): RequestHandler => (req, _res, next) =>
  next(req.actor?.permissions.includes(permission) ? undefined : new HttpError(403, 'Access denied.'));
export const csrfGuard: RequestHandler = (req, _res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const supplied = req.get('x-csrf-token') || '';
  if (!req.csrfToken || supplied.length !== req.csrfToken.length ||
      !timingSafeEqual(Buffer.from(supplied), Buffer.from(req.csrfToken)))
    return next(new HttpError(403, 'Session verification failed. Reload the page and retry.'));
  next();
};
export function loadSession(database: pg.Pool): RequestHandler {
  return (req, _res, next) => {
    (async () => {
      const token = parseCookie(req.headers.cookie || '')[COOKIE_NAME];
      if (!token || token.length > 128) return;
      const hash = digest(token);
      const result = await database.query(`SELECT s.*,u.*,s.auth_version AS session_version,
        s.expires_at AS session_expires_at,p.permissions
        FROM ut_sessions s JOIN ut_users u ON u.id=s.user_id
        LEFT JOIN ut_role_permissions p ON p.role=u.role
        WHERE s.token_hash=$1 AND s.expires_at>now() AND s.last_seen_at>now()-interval '30 minutes'
        AND u.active=true AND s.auth_version=u.auth_version`, [hash]);
      const row = result.rows[0];
      if (!row) return;
      req.actor = { id: row.user_id, fullName: row.full_name, role: row.role,
        permissions: effectivePermissions(row.role, row.permissions), telegramId: row.telegram_id };
      req.sessionHash = hash; req.csrfToken = row.csrf_token;
      await database.query('UPDATE ut_sessions SET last_seen_at=now() WHERE token_hash=$1', [hash]);
    })().then(() => next(), next);
  };
}
export async function issueAccountToken(db: DB, userId: string, purpose: 'RESET' | 'ACTIVATE' | 'TELEGRAM') {
  const token = randomToken();
  await db.query(`UPDATE ut_account_tokens SET consumed_at=now() WHERE user_id=$1 AND purpose=$2 AND consumed_at IS NULL`, [userId, purpose]);
  const result = await db.query(`INSERT INTO ut_account_tokens(token_hash,user_id,purpose,expires_at)
    VALUES($1,$2,$3,now()+interval '1 hour') RETURNING expires_at`, [digest(token), userId, purpose]);
  return { token, expiresAt: result.rows[0].expires_at };
}
export function authRoutes(database: pg.Pool) {
  const router = Router();
  const sessionResponse = async (userId: string) => {
    const row = (await database.query(`SELECT u.*,d.name AS department_name,p.permissions FROM ut_users u
      LEFT JOIN ut_departments d ON d.id=u.department_id LEFT JOIN ut_role_permissions p ON p.role=u.role WHERE u.id=$1`, [userId])).rows[0];
    return { user: publicUser(row), permissions: effectivePermissions(row.role, row.permissions) };
  };
  router.post('/login', wrap(async (req, res) => {
    const input = z.object({ identifier: z.string().trim().min(1).max(254), password: z.string().min(1).max(128) }).strict().parse(req.body);
    for (const source of [`ip:${req.ip}`, `account:${input.identifier.toLowerCase()}`]) {
      const throttle = await database.query(`INSERT INTO ut_login_throttle(key,attempts,window_start) VALUES($1,1,now())
        ON CONFLICT(key) DO UPDATE SET
        attempts=CASE WHEN ut_login_throttle.window_start<now()-interval '15 minutes' THEN 1 ELSE ut_login_throttle.attempts+1 END,
        window_start=CASE WHEN ut_login_throttle.window_start<now()-interval '15 minutes' THEN now() ELSE ut_login_throttle.window_start END
        RETURNING attempts`, [digest(source)]);
      if (throttle.rows[0].attempts > (source.startsWith('ip:') ? 30 : 10)) throw new HttpError(429, 'Too many sign-in attempts. Try again in 15 minutes.');
    }
    const row = (await database.query('SELECT * FROM ut_users WHERE lower(username)=$1 OR lower(email)=$1', [input.identifier.toLowerCase()])).rows[0];
    const matches = await verifyPassword(input.password, row?.password_hash || dummyHash);
    if (!row?.active || !matches) {
      await audit(database, req, 'LOGIN_FAILED', undefined, null, null, 'Unsuccessful sign-in attempt.');
      throw new HttpError(401, 'Invalid credentials or account unavailable.');
    }
    const token = randomToken(), csrfToken = randomToken();
    await transaction(database, async db => {
      await db.query(`INSERT INTO ut_sessions(token_hash,user_id,csrf_token,auth_version,expires_at)
        VALUES($1,$2,$3,$4,now()+interval '8 hours')`, [digest(token), row.id, csrfToken, row.auth_version]);
      await db.query('UPDATE ut_users SET last_login_at=now() WHERE id=$1', [row.id]);
      await db.query('DELETE FROM ut_login_throttle WHERE key=$1', [digest(`account:${input.identifier.toLowerCase()}`)]);
      await audit(db, { ...req, actor: { id: row.id, role: row.role, fullName: row.full_name, permissions: [] }, ip: req.ip }, 'LOGIN', row.id);
    });
    setSessionCookie(res, token);
    res.json({ ...await sessionResponse(row.id), csrfToken });
  }));
  router.get('/me', wrap(async (req, res) => {
    // Anonymous session discovery is not an authorization error; protected endpoints still return 401.
    if (!req.actor) { res.json({user:null,permissions:[],csrfToken:''}); return; }
    res.json({ ...await sessionResponse(req.actor.id), csrfToken: req.csrfToken });
  }));
  router.post('/logout', requireAuth, csrfGuard, wrap(async (req, res) => {
    await transaction(database, async db => {
      await db.query('DELETE FROM ut_sessions WHERE token_hash=$1', [req.sessionHash]);
      await audit(db, req, 'LOGOUT', req.actor!.id);
    });
    setSessionCookie(res, '', 0); res.json({ ok: true });
  }));
  router.post('/forgot-password', wrap(async (req, res) => {
    const { identifier } = z.object({ identifier: z.string().trim().min(1).max(254) }).parse(req.body);
    const row = (await database.query('SELECT id FROM ut_users WHERE lower(username)=$1 OR lower(email)=$1', [identifier.toLowerCase()])).rows[0];
    if (row) await audit(database, req, 'PASSWORD_RESET_REQUESTED', row.id, null, null, 'Administrator-assisted password reset requested.');
    res.json({ message: 'If this account exists, a password reset request has been recorded. Contact your administrator for a secure reset link.' });
  }));
  router.post('/setup-password', wrap(async (req, res) => {
    const input = z.object({ token: z.string().min(32).max(128), password: passwordSchema }).strict().parse(req.body);
    if (!(await database.query(`SELECT token_hash FROM ut_account_tokens WHERE token_hash=$1 AND purpose IN ('RESET','ACTIVATE')
      AND consumed_at IS NULL AND expires_at>now()`, [digest(input.token)])).rowCount)
      throw new HttpError(400, 'This setup link is invalid, expired, or already used.');
    const passwordHash = await hashPassword(input.password);
    await transaction(database, async db => {
      const token = (await db.query(`SELECT * FROM ut_account_tokens WHERE token_hash=$1 AND purpose IN ('RESET','ACTIVATE')
        AND consumed_at IS NULL AND expires_at>now() FOR UPDATE`, [digest(input.token)])).rows[0];
      if (!token) throw new HttpError(400, 'This setup link is invalid, expired, or already used.');
      const user = (await db.query('SELECT * FROM ut_users WHERE id=$1 FOR UPDATE', [token.user_id])).rows[0];
      if (!user.active && token.purpose !== 'ACTIVATE') throw new HttpError(403, 'Account is deactivated. Contact an administrator.');
      await db.query(`UPDATE ut_users SET password_hash=$2,active=CASE WHEN $3='ACTIVATE' THEN true ELSE active END,
        auth_version=auth_version+1 WHERE id=$1`, [user.id, passwordHash, token.purpose]);
      await db.query('UPDATE ut_account_tokens SET consumed_at=now() WHERE user_id=$1 AND purpose IN ($2,$3)', [user.id, 'RESET', 'ACTIVATE']);
      await db.query('DELETE FROM ut_sessions WHERE user_id=$1', [user.id]);
      await audit(db, req, 'PASSWORD_SET', user.id);
    });
    res.json({ ok: true });
  }));
  router.post('/change-password', requireAuth, csrfGuard, wrap(async (req, res) => {
    const input = z.object({ currentPassword: z.string().max(128), password: passwordSchema }).strict().parse(req.body);
    await transaction(database, async db => {
      const row = (await db.query('SELECT * FROM ut_users WHERE id=$1 FOR UPDATE', [req.actor!.id])).rows[0];
      if (!await verifyPassword(input.currentPassword, row.password_hash || '')) throw new HttpError(400, 'Current password is incorrect.');
      await db.query('UPDATE ut_users SET password_hash=$2,auth_version=auth_version+1 WHERE id=$1', [row.id, await hashPassword(input.password)]);
      await db.query('DELETE FROM ut_sessions WHERE user_id=$1', [row.id]);
      await audit(db, req, 'PASSWORD_CHANGED', row.id);
    });
    setSessionCookie(res, '', 0); res.json({ ok: true });
  }));
  return router;
}
