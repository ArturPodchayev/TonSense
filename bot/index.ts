import TelegramBot from "node-telegram-bot-api";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBAPP_URL = "https://ton-sense.vercel.app";

if (!BOT_TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN is not set");
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "👋 Welcome to TonSense!\n\n💎 AI-powered DeFi calculator for TON blockchain.\n\n📈 Calculate staking returns\n🤖 Ask AI about TON DeFi\n⚡ Swap & stake directly",
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🚀 Open TonSense",
              web_app: { url: WEBAPP_URL },
            },
          ],
        ],
      },
    }
  );
});

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "🤖 TonSense commands:\n\n/start — Launch the app\n/price — Current TON price\n/apy — Current staking APY"
  );
});

bot.onText(/\/price/, async (msg) => {
  try {
    const res = await fetch(`${WEBAPP_URL}/api/ton-price`);
    const data = await res.json() as { price: number; change24h: number };
    const sign = data.change24h >= 0 ? "▲" : "▼";
    bot.sendMessage(
      msg.chat.id,
      `💎 TON Price\n\n$${data.price.toFixed(4)}\n${sign} ${Math.abs(data.change24h).toFixed(2)}% (24h)`
    );
  } catch {
    bot.sendMessage(msg.chat.id, "⚠️ Could not fetch price. Try again later.");
  }
});

bot.onText(/\/apy/, async (msg) => {
  try {
    const res = await fetch(`${WEBAPP_URL}/api/staking-apy`);
    const data = await res.json() as { apy: number };
    bot.sendMessage(
      msg.chat.id,
      `📈 tsTON Staking APY\n\n${data.apy.toFixed(1)}% annual\n\nPowered by Tonstakers`
    );
  } catch {
    bot.sendMessage(msg.chat.id, "⚠️ Could not fetch APY. Try again later.");
  }
});

bot.on("polling_error", (err) => {
  console.error("Polling error:", err.message);
});

console.log("TonSense bot running...");
