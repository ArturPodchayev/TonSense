<div align="center">
  <img src="public/logo.png" alt="TonSense" width="80" height="80" style="border-radius: 16px;" />
  <h1>TonSense</h1>
  <p><strong>AI-powered DeFi dashboard for TON blockchain. Stake, swap, analyze — all in one place.</strong></p>

  [![Live App](https://img.shields.io/badge/Live%20App-tonsense.app-0098EA?style=for-the-badge)](https://tonsense.app)
  [![Telegram Bot](https://img.shields.io/badge/Telegram%20Bot-@Ton__Sense__bot-229ED9?style=for-the-badge&logo=telegram)](https://t.me/Ton_Sense_bot)
  [![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
</div>

---

## Features

- **📈 Dashboard** — Real-time TON price, 24h change, and tsTON staking APY from Tonstakers
- **🕐 What If Calculator** — FOMO analysis: see exactly what you would have earned by staking N days ago
- **🤖 AI Agent** — DeepSeek-powered DeFi advisor with live price & APY context injected per message
- **⚡ Swap** — Ston.fi DEX integration with live rate simulation and on-chain swap execution
- **📅 DCA Simulator** — Dollar cost averaging calculator with projected returns
- **👤 Profile** — Wallet identity, TON balance, transaction history, and portfolio overview
- **🔔 Smart Alerts** — Telegram bot alerts when TON price or APY hits your target (powered by Upstash Redis + Vercel Cron)
- **💎 On-chain Staking** — Real Tonstakers transactions built and signed via TON Connect

---

## Screenshots

| Dashboard | What If |
|---|---|
| ![Dashboard](screenshots/dashboard.PNG) | ![What If](screenshots/whaif.PNG) |

| AI Agent | Swap |
|---|---|
| ![AI Agent](screenshots/ai%20agent.png) | ![Swap](screenshots/swap.png) |

| DCA | Results |
|---|---|
| ![DCA](screenshots/DCA.png) | ![Results](screenshots/results.jpg) |

| Profile | Profile (continued) |
|---|---|
| ![Profile 1](screenshots/profile1.png) | ![Profile 2](screenshots/profile2.png) |

| Transaction Preview |
|---|
| ![Transaction Preview](screenshots/Transaction%20Preview.png) |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router + TypeScript |
| Styling | Tailwind CSS + Glassmorphism |
| Charts | Recharts |
| Wallet | TON Connect 2.0 |
| AI | DeepSeek API |
| On-chain | @ton/core — real Tonstakers transactions |
| DEX | Ston.fi SDK + simulate API |
| Price Data | CoinGecko API |
| Caching | Upstash Redis (price, APY, history — 60s/5m/1h TTL) |
| Alerts | Upstash Redis + Vercel Cron |
| Bot | Telegram Bot webhook (serverless) |
| Deploy | Vercel |

---

## Environment Variables

| Variable | Description |
|---|---|
| `DEEPSEEK_API_KEY` | DeepSeek API key for AI responses |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token from @BotFather |
| `KV_REST_API_URL` | Upstash Redis REST URL |
| `KV_REST_API_TOKEN` | Upstash Redis REST token |
| `CRON_SECRET` | Secret for authenticating Vercel Cron requests |

```bash
# .env.local
DEEPSEEK_API_KEY=your_key
TELEGRAM_BOT_TOKEN=your_token
KV_REST_API_URL=https://your-db.upstash.io
KV_REST_API_TOKEN=your_token
CRON_SECRET=your_secret
```

---

## Getting Started

```bash
git clone https://github.com/ArturPodchayev/TonSense
cd TonSense
npm install
cp .env.local.example .env.local  # fill in your keys
npm run dev
```

---

## Links

| | |
|---|---|
| 🌐 App | [tonsense.app](https://tonsense.app) |
| 🤖 Telegram Bot | [@Ton\_Sense\_bot](https://t.me/Ton_Sense_bot) |
| 📢 Channel | [@TonSense\_official](https://t.me/TonSense_official) |
| 💬 Support | [Support Chat](https://t.me/+ls8wv93nO9swYjli) |

---

## Built by

**Artur Podchaev** — developer
- 🌐 [arturpodchaev.uz](https://arturpodchaev.uz)
- 💼 [linkedin.com/in/arturpodchayev](https://linkedin.com/in/arturpodchayev)

**greejjddg09** — QA & testing · [GitHub](https://github.com/greejjddg09)

---

*Built for the TON ecosystem — evolved into a full DeFi dApp.*
