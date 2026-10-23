import express from 'express';
import { createServer as createHttpServer } from 'node:http';
import { resolve } from 'node:path';
import { createServer as createViteServer } from 'vite';
import { createApplication } from './app';
import { pool } from './db';
import { startNotificationScheduler } from './notifications';

const app = createApplication(pool);
const httpServer = createHttpServer(app);

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

startNotificationScheduler(pool);
httpServer.listen(port, '0.0.0.0', () => {
  console.log(`UniTask server listening on port ${port}`);
});
