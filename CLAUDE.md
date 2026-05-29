# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Run production server
npm run lint     # ESLint (no test suite exists)
```

## Architecture

TonSense is an AI-powered DeFi dashboard for the TON blockchain — staking via Tonstakers, swaps via Ston.fi, AI analysis via DeepSeek, and Telegram alerts.

**Stack:** Next.js 16 App Router · React 19 · TypeScript 5 (strict) · Tailwind CSS 4 · Upstash Redis · TON Connect 2.0 · Deployed on Vercel

### Directory layout

| Path | Purpose |
|---|---|
| `app/page.tsx` | Single-page app (tab-based UI) |
| `app/api/` | All server-side logic as API routes |
| `components/` | Client-side React components |
| `lib/` | Client fetch wrappers (`api.ts`) and TON tx builders (`transactions.ts`) |
| `providers/` | TON Connect 2.0 and Telegram Mini App context providers |
| `hooks/` | Custom React hooks (e.g. `useTonBalance`) |
| `bot/` | Standalone Telegram bot — separate `tsconfig.json`, excluded from Next.js build |

### Key API routes

| Route | Purpose |
|---|---|
| `/api/ton-price` | TON/USD from CoinGecko, Redis-cached 60s |
| `/api/ton-history` | 90-day price history, Redis-cached 1h |
| `/api/staking-apy` | tsTON APY from TonAPI, Redis-cached 5min |
| `/api/agent` | DeepSeek chat with injected live price/APY/wallet context |
| `/api/ai-analysis` | DeepSeek structured JSON verdict/risk/action for dashboard |
| `/api/bot` | Telegram bot webhook handler |
| `/api/alerts/set` | Store price/APY alert in Redis |
| `/api/alerts/check` | Verify alerts (Vercel cron target) |

### State management

No global store. Components use `useState`/`useRef` locally. Redis (Upstash) is the only persistent store for alerts and API caches.

## Coding conventions

- **Server Components by default.** Add `'use client'` only when strictly needed (event handlers, browser APIs, TON Connect, Telegram SDK).
- **All API routes use `NextResponse`** — never raw `Response`.
- **No `any` types.**
- **Redis cache key pattern:** `ton:{entity}:{version}` (e.g. `ton:apy:v2`), TTL 300s default.
- **APY formula:** `((rate - 1) * 365 / daysSinceLaunch) * 100`
- Before adding a new component or utility, check `components/`, `lib/`, and `providers/` — reuse existing patterns.
- `next.config.ts` sets `X-Frame-Options: ALLOWALL` intentionally (Telegram Mini App iframe embedding).

## Environment variables

| Variable | Purpose |
|---|---|
| `DEEPSEEK_API_KEY` | DeepSeek AI (chat + analysis) |
| `TELEGRAM_BOT_TOKEN` | Telegram bot |
| `KV_REST_API_URL` | Upstash Redis endpoint |
| `KV_REST_API_TOKEN` | Upstash Redis auth token |
| `CRON_SECRET` | Vercel Cron auth (prevents unauthorized triggers) |
| `ADMIN_TELEGRAM_CHAT_ID` | Admin DM target for `/api/health/notify` |
