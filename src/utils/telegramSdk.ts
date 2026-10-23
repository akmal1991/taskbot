export const telegramLaunch = typeof window !== 'undefined' &&
  /(?:^|[?#&])tgWebAppData=/.test(`${window.location.search}${window.location.hash}`);
export async function initializeTelegram() {
  if (!telegramLaunch) return;
  try {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-web-app.js'; script.async = true;
      const timer = setTimeout(() => reject(new Error('Telegram SDK unavailable.')), 5000);
      script.onload = () => { clearTimeout(timer); resolve(); };
      script.onerror = () => { clearTimeout(timer); reject(new Error('Telegram SDK unavailable.')); };
      document.head.appendChild(script);
    });
    (window as any).Telegram?.WebApp?.ready();
  } catch { /* Normal password login remains available; signed Telegram actions fail closed. */ }
  // The SDK has captured launch data. Do not interpret it as application navigation or leak it in links.
  const query = new URLSearchParams(window.location.search);
  for (const key of [...query.keys()]) if (key.startsWith('tgWebApp')) query.delete(key);
  window.history.replaceState(null,'',`${window.location.pathname}${query.size ? `?${query}` : ''}#dashboard`);
}
