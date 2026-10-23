import { createHmac, timingSafeEqual } from 'node:crypto';

export interface VerifiedTelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export type TelegramVerificationResult =
  | { ok: true; user: VerifiedTelegramUser; authDate: number }
  | { ok: false; reason: string };

const MAX_INIT_DATA_LENGTH = 8_192;
const DEFAULT_MAX_AGE_SECONDS = 24 * 60 * 60;
const DEFAULT_FUTURE_SKEW_SECONDS = 30;

export function verifyTelegramInitData(
  initData: string,
  botToken: string,
  options: {
    nowSeconds?: number;
    maxAgeSeconds?: number;
    futureSkewSeconds?: number;
  } = {},
): TelegramVerificationResult {
  if (!botToken) return { ok: false, reason: 'Telegram bot token is not configured.' };
  if (!initData || initData.length > MAX_INIT_DATA_LENGTH) {
    return { ok: false, reason: 'Telegram initData is missing or too large.' };
  }

  const params = new URLSearchParams(initData);
  const entries = [...params.entries()];
  if (entries.length === 0 || new Set(entries.map(([key]) => key)).size !== entries.length) {
    return { ok: false, reason: 'Telegram initData contains duplicate or missing fields.' };
  }

  const suppliedHash = params.get('hash');
  if (!suppliedHash || !/^[a-f\d]{64}$/i.test(suppliedHash)) {
    return { ok: false, reason: 'Telegram initData hash is invalid.' };
  }

  const dataCheckString = entries
    .filter(([key]) => key !== 'hash')
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const expectedHash = createHmac('sha256', secretKey).update(dataCheckString).digest();
  const receivedHash = Buffer.from(suppliedHash, 'hex');
  if (receivedHash.length !== expectedHash.length || !timingSafeEqual(receivedHash, expectedHash)) {
    return { ok: false, reason: 'Telegram initData signature is invalid.' };
  }

  const authDateRaw = params.get('auth_date');
  if (!authDateRaw || !/^\d+$/.test(authDateRaw)) {
    return { ok: false, reason: 'Telegram auth_date is invalid.' };
  }
  const authDate = Number(authDateRaw);
  const nowSeconds = options.nowSeconds ?? Math.floor(Date.now() / 1000);
  const maxAgeSeconds = options.maxAgeSeconds ?? DEFAULT_MAX_AGE_SECONDS;
  const futureSkewSeconds = options.futureSkewSeconds ?? DEFAULT_FUTURE_SKEW_SECONDS;
  if (!Number.isSafeInteger(authDate)
    || authDate > nowSeconds + futureSkewSeconds
    || nowSeconds - authDate > maxAgeSeconds) {
    return { ok: false, reason: 'Telegram initData has expired or is not yet valid.' };
  }

  const userRaw = params.get('user');
  if (!userRaw) return { ok: false, reason: 'Telegram user is missing.' };

  let user: unknown;
  try {
    user = JSON.parse(userRaw);
  } catch {
    return { ok: false, reason: 'Telegram user data is malformed.' };
  }
  if (!isVerifiedTelegramUser(user)) {
    return { ok: false, reason: 'Telegram user data is invalid.' };
  }

  return { ok: true, user, authDate };
}

function isVerifiedTelegramUser(value: unknown): value is VerifiedTelegramUser {
  if (!value || typeof value !== 'object') return false;
  const user = value as Partial<VerifiedTelegramUser>;
  return Number.isSafeInteger(user.id)
    && Number(user.id) > 0
    && typeof user.first_name === 'string'
    && user.first_name.length > 0;
}
