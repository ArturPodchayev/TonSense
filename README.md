# 💎 TonSense

### *See what you missed. Plan what's next.*

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-blue) ![TON](https://img.shields.io/badge/TON-Blockchain-0098EA) ![Vercel](https://img.shields.io/badge/Deployed-Vercel-black) ![License](https://img.shields.io/badge/License-MIT-green)

🌐 **Live demo:** [ton-sense.vercel.app](https://ton-sense.vercel.app) &nbsp;|&nbsp; 🤖 **Telegram bot:** [@Ton\_Sense\_bot](https://t.me/Ton_Sense_bot)

---

## ✨ Features

| | |
|---|---|
| 🤖 **AI Agent** | TON DeFi expert powered by DeepSeek with live price & APY context |
| 📈 **Future ROI Calculator** | Reactive staking projections using real-time Tonstakers APY |
| 🕐 **What If Calculator** | FOMO analysis — see what returns you would have earned |
| 💎 **On-chain Staking** | Real Tonstakers integration with actual wallet transactions |
| 👤 **Profile** | Wallet identity, portfolio overview, and transaction history |
| 📅 **DCA Simulator** | Dollar cost averaging strategy calculator |
| 🔔 **Telegram Bot** | Smart price & APY alerts, inline wallet launch |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 App Router + TypeScript |
| Styling | Tailwind CSS + Glassmorphism |
| Charts | Recharts |
| Wallet | TON Connect 2.0 |
| AI | DeepSeek API |
| On-chain | @ton/core — real Tonstakers transactions |
| Price Data | CoinGecko API |
| Bot | node-telegram-bot-api |
| Deploy | Vercel (app) + Railway (bot) |

---

## 🚀 Getting Started

### App

```bash
git clone https://github.com/ArturPodchayev/TonSense
cd TonSense
npm install
cp .env.example .env.local
npm run dev
```

### Bot

```bash
cd bot
npm install
cp .env.example .env
npm run dev
```

---

## 🔑 Environment Variables

### App (`.env.local`)

```
DEEPSEEK_API_KEY=your_key
```

### Bot (`bot/.env`)

```
TELEGRAM_BOT_TOKEN=your_token
DEEPSEEK_API_KEY=your_key
```

---

## 📱 Screenshots

> Screenshots coming soon

---

## 🏗 Architecture

- **Next.js App Router** with 4 API route handlers (`/api/ton-price`, `/api/staking-apy`, `/api/agent`, `/api/history`)
- **TON Connect 2.0** for non-custodial wallet integration
- **Real on-chain transactions** via `@ton/core` — builds and signs Tonstakers deposit payloads
- **DeepSeek AI** with live market context injected per request (price, APY, wallet balance)
- **Telegram bot** with long-polling, per-chat alert state, and `alerts.json` persistence

---

## 🤖 Bot Commands

| Command | Description |
|---|---|
| `/start` | Welcome message + inline app launcher |
| `/price` | Live TON price, 24h change, and staking yield projection |
| `/apy` | Detailed tsTON APY with monthly & yearly TON/USD breakdown |
| `/alert` | Set a smart price or APY threshold notification |
| `/alerts` | List all your active alerts |
| `/stop` | Disable all your alerts |
| `/ask [question]` | Ask TonSenseAI anything about TON DeFi |
| `/help` | Show all commands |

---

## 📄 License

MIT

---

## 👨‍💻 Built by

**Artur Podchaev** — 17 y.o. tech lead & developer from Tashkent
- 🌐 Portfolio: [arturpodchaev.uz](https://arturpodchaev.uz)
- 💼 LinkedIn: [linkedin.com/in/arturpodchayev](https://linkedin.com/in/arturpodchayev)
- 🐙 GitHub: [ArturPodchayev](https://github.com/ArturPodchayev)

**greejjddg09** — QA & testing
- 🐙 GitHub: [greejjddg09](https://github.com/greejjddg09)

---

*Built during the TON Hackathon (Ston.fi track) — evolved into a full DeFi dApp.*
