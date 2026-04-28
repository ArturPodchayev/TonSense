// Local development only — production uses webhook at app/api/bot/route.ts
import dotenv from "dotenv";
dotenv.config();

import TelegramBot from "node-telegram-bot-api";
import fs from "fs";
import path from "path";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const WEBAPP_URL = "https://tonsense.app";
const ALERTS_FILE = path.join(__dirname, "alerts.json");

if (!BOT_TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN is not set");
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// ── Types ─────────────────────────────────────────────────────────────────────

interface Alert {
  chatId: number;
  type: "price" | "apy";
  direction: "above" | "below";
  threshold: number;
  active: boolean;
}

interface PriceData { price: number; change24h: number }
interface ApyData   { apy: number }

// ── Alert file I/O ────────────────────────────────────────────────────────────

function readAlerts(): Alert[] {
  try {
    return JSON.parse(fs.readFileSync(ALERTS_FILE, "utf-8")) as Alert[];
  } catch {
    return [];
  }
}

function saveAlerts(alerts: Alert[]): void {
  try {
    fs.writeFileSync(ALERTS_FILE, JSON.stringify(alerts, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save alerts:", e);
  }
}

// ── API helpers ───────────────────────────────────────────────────────────────

async function fetchPrice(): Promise<PriceData> {
  const res = await fetch(`${WEBAPP_URL}/api/ton-price`);
  if (!res.ok) throw new Error(`Price API ${res.status}`);
  return res.json() as Promise<PriceData>;
}

async function fetchApy(): Promise<ApyData> {
  const res = await fetch(`${WEBAPP_URL}/api/staking-apy`);
  if (!res.ok) throw new Error(`APY API ${res.status}`);
  return res.json() as Promise<ApyData>;
}

// ── DeepSeek helpers ──────────────────────────────────────────────────────────

const EXPERT_SYSTEM_PROMPT =
  "You are an expert TON blockchain DeFi advisor embedded in TonSense. " +
  "You have deep knowledge of Tonstakers, tsTON liquid staking, Ston.fi DEX, DeDust, " +
  "the Jetton token standard, TON Connect, and TON wallets. " +
  "Give concise, accurate answers in 3-4 sentences max. " +
  "Use Telegram markdown (*bold*, _italic_). No markdown headers.";

async function askDeepSeek(system: string, user: string): Promise<string> {
  if (!DEEPSEEK_API_KEY) throw new Error("DEEPSEEK_API_KEY not set");
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      max_tokens: 300,
      messages: [
        { role: "system", content: system },
        { role: "user",   content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`DeepSeek ${res.status}`);
  const data = await res.json() as { choices: Array<{ message: { content: string } }> };
  return data.choices?.[0]?.message?.content ?? "";
}

async function generateAlertMessage(params: {
  price: number; change24h: number; apy: number; alert: Alert;
}): Promise<string> {
  const { price, change24h, apy, alert } = params;
  const sign = change24h >= 0 ? "+" : "";
  try {
    return await askDeepSeek(
      "You are TonSenseAI bot assistant. Generate a SHORT (max 3 sentences) " +
      "Telegram notification message. Use emojis. Be specific with numbers. " +
      "End with a call to action to open TonSense app.",
      `Alert triggered: user set alert for ${alert.type} ${alert.direction} ${alert.threshold}. ` +
      `Current: TON price $${price.toFixed(4)}, APY ${apy.toFixed(1)}%, ` +
      `24h change ${sign}${change24h.toFixed(2)}%. Generate the notification.`
    );
  } catch {
    const label =
      alert.type === "price"
        ? `TON price ${alert.direction} $${alert.threshold}`
        : `tsTON APY ${alert.direction} ${alert.threshold}%`;
    return (
      `🔔 *Alert triggered!*\n\n${label}\n\n` +
      `Current: TON $${price.toFixed(4)} | APY ${apy.toFixed(1)}%\n\n` +
      `Open TonSense: ${WEBAPP_URL}`
    );
  }
}

// ── Shared UI helpers ─────────────────────────────────────────────────────────

const openAppBtn = { text: "🚀 Open TonSense", web_app: { url: WEBAPP_URL } };

function openAppKeyboard(): TelegramBot.InlineKeyboardMarkup {
  return { inline_keyboard: [[openAppBtn]] };
}

// ── Pending alert state ───────────────────────────────────────────────────────

const pendingAlerts = new Map<number, { type: "price" | "apy"; direction: "above" | "below" }>();

// ── Reusable command handlers (called from both commands and callback_query) ──

async function handlePrice(chatId: number) {
  try {
    const [{ price, change24h }, { apy }] = await Promise.all([fetchPrice(), fetchApy()]);
    const arrow = change24h >= 0 ? "▲" : "▼";
    const yearlyTon = (100 * apy) / 100;
    await bot.sendMessage(
      chatId,
      `💎 *TON Price*\n\n*$${price.toFixed(4)}*\n${arrow} ${Math.abs(change24h).toFixed(2)}% (24h)\n\nStaking APY: *${apy.toFixed(1)}%* (tsTON)\nIf you stake 100 TON today → *+${yearlyTon.toFixed(2)} TON/year*\n\n🔔 /alert — set a price notification\n🚀 Open app: ${WEBAPP_URL}`,
      { parse_mode: "Markdown", reply_markup: openAppKeyboard() }
    );
  } catch {
    bot.sendMessage(chatId, "⚠️ Could not fetch price. Try again later.");
  }
}

function handleAlertMenu(chatId: number) {
  bot.sendMessage(chatId, `🔔 *Set up a smart alert*\n\nChoose what to track:`, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "📈 TON Price ↑ Above", callback_data: "alert_price_above" },
          { text: "📉 TON Price ↓ Below", callback_data: "alert_price_below" },
        ],
        [{ text: "📊 APY ↓ Below", callback_data: "alert_apy_below" }],
        [{ text: "❌ Cancel all alerts",  callback_data: "alert_cancel" }],
      ],
    },
  });
}

// ── /start ────────────────────────────────────────────────────────────────────

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `👋 *Welcome to TonSense!*\n\n💎 Your AI-powered TON DeFi advisor.\n\n📈 I track TON price & staking APY 24/7\n🔔 I'll notify you when YOUR targets are hit\n🤖 Ask me anything about TON DeFi\n\nUse the menu below or type a command:`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [openAppBtn],
          [{ text: "📊 TON Price", callback_data: "price" }],
          [{ text: "💡 Set Alert",  callback_data: "alert_menu" }],
        ],
      },
    }
  );
});

// ── /help ─────────────────────────────────────────────────────────────────────

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `🤖 *TonSense Commands*\n\n/start — Launch the app\n/price — Current TON price & APY\n/apy — Detailed staking stats\n/alert — Set a price or APY alert\n/alerts — List your active alerts\n/stop — Disable all your alerts\n/ask \\[question\\] — Ask TonSenseAI anything\n/support — Get help & support links\n/help — Show this message`,
    { parse_mode: "Markdown", reply_markup: openAppKeyboard() }
  );
});

// ── /price ────────────────────────────────────────────────────────────────────

bot.onText(/\/price/, (msg) => handlePrice(msg.chat.id));

// ── /apy ──────────────────────────────────────────────────────────────────────

bot.onText(/\/apy/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const [{ price }, { apy }] = await Promise.all([fetchPrice(), fetchApy()]);
    const monthlyTon = (100 * apy) / 100 / 12;
    const yearlyTon  = (100 * apy) / 100;
    bot.sendMessage(
      chatId,
      `📈 *tsTON Staking APY*\n\nCurrent: *${apy.toFixed(1)}% annual*\nProvider: Tonstakers\n\nMonthly per 100 TON: *+${monthlyTon.toFixed(2)} TON* ($${(monthlyTon * price).toFixed(2)})\nYearly per 100 TON: *+${yearlyTon.toFixed(2)} TON* ($${(yearlyTon * price).toFixed(2)})\n\n💡 /alert apy 15 — notify if APY drops below 15%`,
      { parse_mode: "Markdown", reply_markup: openAppKeyboard() }
    );
  } catch {
    bot.sendMessage(chatId, "⚠️ Could not fetch APY. Try again later.");
  }
});

// ── /alert ────────────────────────────────────────────────────────────────────

bot.onText(/\/alert/, (msg) => handleAlertMenu(msg.chat.id));

// ── /alerts ───────────────────────────────────────────────────────────────────

bot.onText(/\/alerts/, (msg) => {
  const chatId = msg.chat.id;
  const active = readAlerts().filter((a) => a.chatId === chatId && a.active);
  if (active.length === 0) {
    bot.sendMessage(chatId, "No active alerts. Use /alert to set one.", {
      reply_markup: openAppKeyboard(),
    });
    return;
  }
  const lines = active.map((a) => {
    const label =
      a.type === "price"
        ? `TON Price ${a.direction} $${a.threshold}`
        : `APY ${a.direction} ${a.threshold}%`;
    return `🔔 ${label} — active`;
  });
  bot.sendMessage(chatId, lines.join("\n"), {
    parse_mode: "Markdown",
    reply_markup: openAppKeyboard(),
  });
});

// ── /stop ─────────────────────────────────────────────────────────────────────

bot.onText(/\/stop/, (msg) => {
  const chatId = msg.chat.id;
  const alerts = readAlerts();
  let changed = false;
  for (const a of alerts) {
    if (a.chatId === chatId && a.active) { a.active = false; changed = true; }
  }
  if (changed) saveAlerts(alerts);
  bot.sendMessage(chatId, "🔕 All alerts disabled. Use /alert to set new ones.", {
    parse_mode: "Markdown",
  });
});

// ── /support ──────────────────────────────────────────────────────────────────

bot.onText(/\/support/, (msg) => {
  bot.sendMessage(msg.chat.id,
    "🆘 *TonSense Support*\n\n" +
    "📢 Channel: @TonSense\\_official\n" +
    "💬 Support chat: https://t.me/+ls8wv93nO9swYjli\n\n" +
    "Describe your issue in the support chat and we'll help ASAP! 🚀",
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[
          { text: "💬 Open Support Chat", url: "https://t.me/+ls8wv93nO9swYjli" }
        ]]
      }
    }
  );
});

// ── /ask ──────────────────────────────────────────────────────────────────────

bot.onText(/\/ask (.+)/, async (msg, match) => {
  const chatId  = msg.chat.id;
  const question = match?.[1]?.trim();
  if (!question) {
    bot.sendMessage(chatId, "Please provide a question. Example: /ask What is tsTON?");
    return;
  }
  try {
    const [{ price, change24h }, { apy }] = await Promise.all([fetchPrice(), fetchApy()]);
    const sign = change24h >= 0 ? "+" : "";
    const system =
      `${EXPERT_SYSTEM_PROMPT}\n\nLive market data:\n` +
      `- TON price: $${price.toFixed(4)} (${sign}${change24h.toFixed(2)}% 24h)\n` +
      `- tsTON staking APY: ${apy.toFixed(1)}%`;
    const answer = await askDeepSeek(system, question);
    bot.sendMessage(chatId, `🤖 *TonSenseAI*\n\n${answer}`, {
      parse_mode: "Markdown",
      reply_markup: openAppKeyboard(),
    });
  } catch {
    bot.sendMessage(chatId, "⚠️ AI is unavailable right now. Try again later.");
  }
});

// ── Callback queries ──────────────────────────────────────────────────────────

bot.on("callback_query", async (query) => {
  const chatId = query.message?.chat.id;
  if (!chatId) return;
  bot.answerCallbackQuery(query.id);

  const data = query.data ?? "";

  if (data === "price") {
    handlePrice(chatId);
    return;
  }

  if (data === "alert_menu") {
    handleAlertMenu(chatId);
    return;
  }

  if (data === "alert_cancel") {
    const alerts = readAlerts();
    let changed = false;
    for (const a of alerts) {
      if (a.chatId === chatId && a.active) { a.active = false; changed = true; }
    }
    if (changed) saveAlerts(alerts);
    bot.sendMessage(chatId, "🔕 All alerts disabled. Use /alert to set new ones.");
    return;
  }

  // alert_price_above | alert_price_below | alert_apy_below
  const alertMatch = data.match(/^alert_(price|apy)_(above|below)$/);
  if (alertMatch) {
    const type      = alertMatch[1] as "price" | "apy";
    const direction = alertMatch[2] as "above" | "below";
    pendingAlerts.set(chatId, { type, direction });
    const example = type === "price" ? "e.g. 2.50" : "e.g. 15";
    bot.sendMessage(chatId, `Enter the value (${example}):`);
  }
});

// ── General message handler (threshold capture + unknown messages) ────────────

bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const text   = msg.text?.trim();
  if (!text || text.startsWith("/")) return;

  const pending = pendingAlerts.get(chatId);
  if (pending) {
    const threshold = parseFloat(text);
    if (isNaN(threshold) || threshold <= 0) {
      bot.sendMessage(chatId, "⚠️ Please enter a valid positive number (e.g. 2.50):");
      return;
    }
    pendingAlerts.delete(chatId);

    const alerts = readAlerts();
    alerts.push({ chatId, type: pending.type, direction: pending.direction, threshold, active: true });
    saveAlerts(alerts);

    const label =
      pending.type === "price"
        ? `TON price goes ${pending.direction} $${threshold}`
        : `tsTON APY drops ${pending.direction} ${threshold}%`;
    bot.sendMessage(chatId, `✅ *Alert set!*\nI'll notify you when ${label}`, {
      parse_mode: "Markdown",
      reply_markup: openAppKeyboard(),
    });
    return;
  }

  bot.sendMessage(
    chatId,
    "🤖 I didn't get that. Try /help or just ask me anything about TON DeFi!",
    { reply_markup: openAppKeyboard() }
  );
});

// ── Alert monitoring (every 10 minutes) ──────────────────────────────────────

async function checkAlerts() {
  const alerts = readAlerts();
  const active  = alerts.filter((a) => a.active);
  if (active.length === 0) return;

  let price: number, change24h: number, apy: number;
  try {
    [{ price, change24h }, { apy }] = await Promise.all([fetchPrice(), fetchApy()]);
  } catch (e) {
    console.error("checkAlerts: API error:", e);
    return;
  }

  let dirty = false;
  for (const alert of active) {
    const triggered =
      (alert.type === "price" && alert.direction === "above" && price >= alert.threshold) ||
      (alert.type === "price" && alert.direction === "below" && price <= alert.threshold) ||
      (alert.type === "apy"   && alert.direction === "below" && apy   <= alert.threshold);

    if (!triggered) continue;

    const aiMessage = await generateAlertMessage({ price, change24h, apy, alert });
    bot.sendMessage(alert.chatId, aiMessage, {
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: [[openAppBtn]] },
    });

    alert.active = false;
    dirty = true;
  }

  if (dirty) saveAlerts(alerts);
}

setInterval(checkAlerts, 10 * 60 * 1000);

// ── Error handling ────────────────────────────────────────────────────────────

bot.on("polling_error", (err) => {
  console.error("Polling error:", err.message);
});

console.log("TonSense bot running...");
