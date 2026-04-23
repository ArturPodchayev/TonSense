# TonSense Bot

Telegram bot that opens the TonSense Mini App and provides quick price/APY lookups.

## Setup

1. Create a bot via [@BotFather](https://t.me/BotFather) and copy the token.
2. Set `TELEGRAM_BOT_TOKEN` in your environment.

## Run locally

```bash
cd bot && npm install && npm run dev
```

## Commands

| Command  | Description              |
|----------|--------------------------|
| /start   | Opens the TonSense Mini App |
| /help    | List available commands  |
| /price   | Current TON price        |
| /apy     | Current tsTON staking APY |

## Production

Deploy separately on [Railway](https://railway.app) or [Render](https://render.com) with `TELEGRAM_BOT_TOKEN` set as an environment variable.

Run command: `npm start`
