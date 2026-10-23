import express from 'express';
import { createServer as createHttpServer } from 'node:http';
import { resolve } from 'node:path';
import { createServer as createViteServer } from 'vite';
import { verifyTelegramInitData } from './telegramAuth';

const app = express();
const httpServer = createHttpServer(app);
app.use(express.json({ limit: '8kb' }));

const allowedActions = new Set([
  'SESSION_CHECK',
  'CLOCK_IN',
  'SUBMIT_PROOF',
  'APPROVE_PROOF',
  'REJECT_PROOF',
]);

app.post('/api/telegram/authorize-action', (request, response) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    response.status(503).json({ error: 'Telegram authentication is not configured on the server.' });
    return;
  }

  const { initData, action, taskId } = request.body ?? {};
  if (typeof initData !== 'string' || typeof action !== 'string'
    || !allowedActions.has(action)
    || (action !== 'SESSION_CHECK' && (typeof taskId !== 'string' || taskId.length === 0 || taskId.length > 128))) {
    response.status(400).json({ error: 'Invalid Telegram action request.' });
    return;
  }

  const result = verifyTelegramInitData(initData, botToken);
  if (!result.ok) {
    response.status(401).json({ error: 'Telegram session is invalid or expired. Reopen the Mini App from Telegram.' });
    return;
  }

  response.setHeader('Cache-Control', 'no-store');
  response.json({ authorized: true, user: { id: result.user.id }, authDate: result.authDate });
});

const portFlagIndex = process.argv.findIndex((argument) => argument === '--port');
const port = Number(
  portFlagIndex >= 0 ? process.argv[portFlagIndex + 1] :
    process.argv.find((argument) => argument.startsWith('--port='))?.split('=')[1] ||
    process.env.PORT ||
    5000,
);

if (process.env.NODE_ENV === 'production') {
  const distPath = resolve(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (_request, response) => response.sendFile(resolve(distPath, 'index.html')));
} else {
  const vite = await createViteServer({
    configFile: resolve(process.cwd(), 'vite.config.ts'),
    server: {
      middlewareMode: true,
      hmr: { server: httpServer },
    },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

httpServer.listen(port, '0.0.0.0', () => {
  console.log(`UniTask server listening on port ${port}`);
});
