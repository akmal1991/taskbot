export interface TelegramInitDataUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

type TelegramWebAppWindow = Window & {
  Telegram?: {
    WebApp?: {
      initData?: string;
    };
  };
};

export type TelegramAction =
  | 'SESSION_CHECK'
  | 'CLOCK_IN'
  | 'SUBMIT_PROOF'
  | 'APPROVE_PROOF'
  | 'REJECT_PROOF';

export async function authorizeTelegramAction(
  action: TelegramAction,
  taskId: string,
  expectedTelegramId: string,
): Promise<void> {
  const initData = (window as TelegramWebAppWindow).Telegram?.WebApp?.initData;
  if (!initData) {
    throw new Error('Telegram Mini App tasdiqlangan sessiya bilan ochilishi kerak.');
  }
  if (!expectedTelegramId) {
    throw new Error('Joriy foydalanuvchiga Telegram hisobi ulanmagan.');
  }

  let response: Response;
  try {
    response = await fetch('/api/telegram/authorize-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData, action, taskId }),
    });
  } catch {
    throw new Error('Telegram sessiyasini tekshirib bo‘lmadi. Qayta urinib ko‘ring.');
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(payload?.error || 'Telegram sessiyasi haqiqiy emas yoki muddati tugagan.');
  }

  const payload = await response.json() as { user?: { id?: number } };
  if (String(payload.user?.id ?? '') !== expectedTelegramId) {
    throw new Error('Telegram hisobi joriy foydalanuvchi bilan mos kelmaydi.');
  }
}

export function getTaskTmaDeepLink(taskId: string): string {
  return `https://t.me/UniTaskBot/app?startapp=task_${taskId}`;
}

export function generateTelegramBindingCommand(userId: string): string {
  const token = btoa(`${userId}:${Date.now()}`).substring(0, 16);
  return `/start bind_${token}`;
}
