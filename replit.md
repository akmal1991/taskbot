# Run this app on Replit

## Start the preview

This project is a React app served by Vite and uses Bun. Use the **Project** run button, which starts the **Start application** workflow:

```sh
bun run dev -- --port 5000
```

The workflow serves the app on port `5000`, which is mapped to the Replit web preview. To install the dependencies declared in `package.json`, run:

```sh
bun install
```

To check the TypeScript project and build the app, run:

```sh
bun run lint
bun run build
```

## Environment settings

The preview launches without Telegram credentials, but Telegram task actions stay blocked until the server-side `TELEGRAM_BOT_TOKEN` secret is configured. Never use a `VITE_`-prefixed variable for this token. `.env.example` also mentions `GEMINI_API_KEY` and `APP_URL` for an AI Studio deployment.
