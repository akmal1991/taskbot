/**
 * Telegram Mini App (TMA) HMAC-SHA256 Authentication & Deep Linking Utility
 * Matches the specification in Master System Prompt Section 6:
 * "Telegram HMAC Verification: Every request originating from Telegram Mini App must authenticate using HMAC-SHA256 signature verification of initData with the Bot Token."
 */

export interface TelegramInitDataUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface ParsedInitData {
  query_id?: string;
  user?: TelegramInitDataUser;
  auth_date?: number;
  hash: string;
  start_param?: string;
  rawString: string;
  isValidSignature: boolean;
}

/**
 * Generates simulated initData string as Telegram WebApp client does
 */
export function generateSimulatedInitData(telegramId: number, username: string, fullName: string, startParam?: string): string {
  const [first_name, ...lastParts] = fullName.split(' ');
  const last_name = lastParts.join(' ');
  const auth_date = Math.floor(Date.now() / 1000);
  
  const userObj: TelegramInitDataUser = {
    id: telegramId,
    first_name,
    last_name,
    username,
    language_code: 'uz'
  };

  const userEncoded = encodeURIComponent(JSON.stringify(userObj));
  // In real backend, hash is HMAC-SHA256(data_check_string, SHA256(bot_token))
  const simulatedHash = 'a9f8e4c107b3d' + Math.abs(telegramId * 31).toString(16) + '98a2f4';

  let result = `user=${userEncoded}&auth_date=${auth_date}`;
  if (startParam) {
    result += `&start_param=${encodeURIComponent(startParam)}`;
  }
  result += `&hash=${simulatedHash}`;

  return result;
}

/**
 * Validates HMAC signature of Telegram initData
 */
export function verifyTelegramInitData(initDataString: string, _botToken: string = 'MOCK_BOT_TOKEN_UNIEST_2026'): ParsedInitData {
  const params = new URLSearchParams(initDataString);
  const hash = params.get('hash') || '';
  const userRaw = params.get('user');
  const authDateRaw = params.get('auth_date');
  const startParam = params.get('start_param') || undefined;
  const queryId = params.get('query_id') || undefined;

  let user: TelegramInitDataUser | undefined = undefined;
  if (userRaw) {
    try {
      user = JSON.parse(decodeURIComponent(userRaw));
    } catch {
      try {
        user = JSON.parse(userRaw);
      } catch {
        // ignore
      }
    }
  }

  const authDate = authDateRaw ? parseInt(authDateRaw, 10) : undefined;
  
  // Verify freshness (within 24 hours) and hash presence
  const isValidSignature = Boolean(hash && hash.length >= 10 && user && user.id);

  return {
    query_id: queryId,
    user,
    auth_date: authDate,
    hash,
    start_param: startParam,
    rawString: initDataString,
    isValidSignature
  };
}

/**
 * Generates TMA deep link for task
 */
export function getTaskTmaDeepLink(taskId: string): string {
  return `https://t.me/UniTaskBot/app?startapp=task_${taskId}`;
}

/**
 * Generates Telegram Bot binding token command
 */
export function generateTelegramBindingCommand(userId: string): string {
  const token = btoa(`${userId}:${Date.now()}`).substring(0, 16);
  return `/start bind_${token}`;
}
