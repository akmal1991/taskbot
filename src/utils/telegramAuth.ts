import { api } from './api';
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

  const payload = await api<{ user?: { id?: number } }>('/telegram/authorize-action', {
    method: 'POST', body: JSON.stringify({ initData, action, taskId }),
  });
  if (String(payload.user?.id ?? '') !== expectedTelegramId) {
    throw new Error('Telegram hisobi joriy foydalanuvchi bilan mos kelmaydi.');
  }
}

export function getTaskTmaDeepLink(taskId: string): string {
  return `https://t.me/UniTaskBot/app?startapp=task_${taskId}`;
}

