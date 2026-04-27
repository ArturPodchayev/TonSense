import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const WEBAPP_URL = "https://ton-sense.vercel.app";
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

interface Alert {
  chatId: number;
  type: "price" | "apy";
  direction: "above" | "below";
  threshold: number;
  active: boolean;
  createdAt: number;
}

function esc(s: string | number): string {
  return String(s).replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}

// ── Telegram helpers ──────────────────────────────────────────────────────────

async function sendMessage(chatId: number, text: string, extra?: object) {
  await fetch(`${API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "MarkdownV2", ...extra }),
  });
}

const openAppKeyboard = {
  inline_keyboard: [[{ text: "🚀 Open TonSense", web_app: { url: WEBAPP_URL } }]],
};

// ── API helpers ───────────────────────────────────────────────────────────────

async function fetchPrice(): Promise<{ price: number; change24h: number }> {
  const res = await fetch(`${WEBAPP_URL}/api/ton-price`);
  if (!res.ok) throw new Error(`price API ${res.status}`);
  return res.json();
}

async function fetchApy(): Promise<{ apy: number }> {
  const res = await fetch(`${WEBAPP_URL}/api/staking-apy`);
  if (!res.ok) throw new Error(`apy API ${res.status}`);
  return res.json();
}

// ── DeepSeek ──────────────────────────────────────────────────────────────────

async function askDeepSeek(system: string, user: string): Promise<string> {
  if (!DEEPSEEK_API_KEY) throw new Error("no key");
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
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`DeepSeek ${res.status}`);
  const data = await res.json() as { choices: Array<{ message: { content: string } }> };
  return data.choices?.[0]?.message?.content ?? "";
}

// ── Handlers ──────────────────────────────────────────────────────────────────

async function handleStart(chatId: number) {
  await sendMessage(
    chatId,
    "👋 *Welcome to TonSense\\!*\n\n💎 Your AI\\-powered TON DeFi advisor\\.\n\n📈 Calculate staking returns\n🤖 Ask AI about TON DeFi\n⚡ Swap & stake directly\n\nUse the menu below or type a command:",
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🚀 Open TonSense", web_app: { url: WEBAPP_URL } }],
          [
            { text: "📊 TON Price", callback_data: "price" },
            { text: "💡 Set Alert", callback_data: "alert_menu" },
          ],
        ],
      },
    }
  );
}

async function handlePrice(chatId: number) {
  try {
    const [{ price, change24h }, { apy }] = await Promise.all([fetchPrice(), fetchApy()]);
    const arrow = change24h >= 0 ? "▲" : "▼";
    const yearlyTon = (100 * apy) / 100;
    await sendMessage(
      chatId,
      `💎 *TON Price*\n\n*$${esc(price.toFixed(4))}*\n${arrow} ${esc(Math.abs(change24h).toFixed(2))}% \\(24h\\)\n\nStaking APY: *${esc(apy.toFixed(1))}%* \\(tsTON\\)\nIf you stake 100 TON today → *\\+${esc(yearlyTon.toFixed(2))} TON/year*\n\n🔔 /alert — set a price notification`,
      { reply_markup: openAppKeyboard }
    );
  } catch {
    await sendMessage(chatId, "⚠️ Could not fetch price\\. Try again later\\.");
  }
}

async function handleApy(chatId: number) {
  try {
    const [{ price }, { apy }] = await Promise.all([fetchPrice(), fetchApy()]);
    const monthlyTon = (100 * apy) / 100 / 12;
    const yearlyTon  = (100 * apy) / 100;
    await sendMessage(
      chatId,
      `📈 *tsTON Staking APY*\n\nCurrent: *${esc(apy.toFixed(1))}% annual*\nProvider: Tonstakers\n\nMonthly per 100 TON: *\\+${esc(monthlyTon.toFixed(2))} TON* \\($${esc((monthlyTon * price).toFixed(2))}\\)\nYearly per 100 TON: *\\+${esc(yearlyTon.toFixed(2))} TON* \\($${esc((yearlyTon * price).toFixed(2))}\\)\n\n💡 /ask What is the best time to stake TON?`,
      { reply_markup: openAppKeyboard }
    );
  } catch {
    await sendMessage(chatId, "⚠️ Could not fetch APY\\. Try again later\\.");
  }
}

async function handleAlertMenu(chatId: number) {
  await sendMessage(
    chatId,
    "🔔 *Smart Alerts*\n\nChoose what to track and I'll notify you when your target is hit:",
    {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "📈 TON Price ↑ Above", callback_data: "alert_price_above" },
            { text: "📉 TON Price ↓ Below", callback_data: "alert_price_below" },
          ],
          [
            { text: "📊 APY ↓ Below", callback_data: "alert_apy_below" },
          ],
          [
            { text: "❌ Cancel", callback_data: "alert_cancel" },
          ],
        ],
      },
    }
  );
}

async function handleAlertType(chatId: number, type: "price" | "apy", direction: "above" | "below") {
  await redis.set(`pending:${chatId}`, `${type}_${direction}`, { ex: 300 });
  const label = `${type === "price" ? "TON price" : "staking APY"} ${direction}`;
  const example = type === "price" ? "2\\.50" : "4\\.5";
  await sendMessage(
    chatId,
    `Enter the target value for *${esc(label)}*:\n\nExample: ${example}`
  );
}

async function handleAlerts(chatId: number) {
  try {
    console.log("Fetching alerts for chatId:", chatId);
    const alerts = await redis.lrange(`alerts:${chatId}`, 0, -1);
    console.log("Raw alerts from Redis:", alerts);

    if (!alerts || alerts.length === 0) {
      await sendMessage(chatId, "📋 No active alerts\\. Use /alert to set one\\.");
      return;
    }

    const parsed = alerts.map(a => typeof a === "string" ? JSON.parse(a) : a);
    console.log("Parsed alerts:", parsed);

    const active = parsed.filter((a: Alert) => a.active === true);
    console.log("Active alerts:", active);

    if (active.length === 0) {
      await sendMessage(chatId, "📋 No active alerts\\. Use /alert to set one\\.");
      return;
    }

    const list = active.map((a: Alert) =>
      `🔔 TON ${a.type} ${a.direction} \\$${a.threshold}`
    ).join("\n");

    await sendMessage(chatId, `📋 *Your active alerts:*\n\n${list}`);
  } catch (error) {
    console.error("handleAlerts error:", error);
    await sendMessage(chatId, "⚠️ Error fetching alerts\\. Try again\\.");
  }
}

async function handleStop(chatId: number) {
  try {
    await Promise.all([
      redis.del(`alerts:${chatId}`),
      redis.del(`pending:${chatId}`),
    ]);
  } catch {
    // ignore KV errors
  }
  await sendMessage(
    chatId,
    "🔕 All alerts disabled\\.\n\nUse /alert to set new ones\\.",
    { reply_markup: openAppKeyboard }
  );
}

async function handleSupport(chatId: number) {
  await sendMessage(
    chatId,
    "🆘 *TonSense Support*\n\n📢 Channel: @TonSense\\_official\n💬 [Support Chat](https://t.me/+ls8wv93nO9swYjli)\n\nDescribe your issue and we'll help ASAP\\! 🚀",
    {
      reply_markup: {
        inline_keyboard: [[
          { text: "💬 Open Support Chat", url: "https://t.me/+ls8wv93nO9swYjli" },
        ]],
      },
    }
  );
}

async function handleHelp(chatId: number) {
  await sendMessage(
    chatId,
    "🤖 *TonSense Commands*\n\n/start — Launch the app\n/price — Current TON price & APY\n/apy — Detailed staking stats\n/alert — Set a price or APY alert\n/alerts — List your active alerts\n/stop — Disable all your alerts\n/ask \\[question\\] — Ask TonSenseAI anything\n/support — Get help & support links\n/help — Show this message",
    { reply_markup: openAppKeyboard }
  );
}

async function handleAsk(chatId: number, question: string) {
  if (!question.trim()) {
    await sendMessage(chatId, "Please provide a question\\. Example: /ask What is tsTON?");
    return;
  }
  try {
    const [{ price, change24h }, { apy }] = await Promise.all([fetchPrice(), fetchApy()]);
    const sign = change24h >= 0 ? "+" : "";
    const system =
      "You are an expert TON blockchain DeFi advisor embedded in TonSense. " +
      "You have deep knowledge of Tonstakers, tsTON liquid staking, Ston.fi DEX, DeDust, " +
      "the Jetton token standard, TON Connect, and TON wallets. " +
      "Give concise, accurate answers in 3-4 sentences max. " +
      "Respond in plain text only, no markdown formatting.\n\n" +
      `Live market data:\n- TON price: $${price.toFixed(4)} (${sign}${change24h.toFixed(2)}% 24h)\n- tsTON staking APY: ${apy.toFixed(1)}%`;
    const answer = await askDeepSeek(system, question);
    await sendMessage(chatId, `🤖 *TonSenseAI*\n\n${esc(answer)}`, { reply_markup: openAppKeyboard });
  } catch {
    await sendMessage(
      chatId,
      "🤖 AI is temporarily unavailable\\.\n\nTop up DeepSeek balance to restore AI responses\\.\nIn the meantime, ask me /price or /apy\\!"
    );
  }
}

// ── Webhook entry point ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    const msg = update.message ?? update.callback_query?.message;
    const chatId: number | undefined = msg?.chat?.id;
    const text: string = update.message?.text ?? "";
    const callbackData: string | undefined = update.callback_query?.data;

    if (!chatId) return NextResponse.json({ ok: true });

    // Callback queries
    const callbackChatId = update.callback_query?.message?.chat?.id;
    if (callbackData && callbackChatId) {
      if (callbackData === "price")             await handlePrice(callbackChatId);
      if (callbackData === "alert_menu")        await handleAlertMenu(callbackChatId);
      if (callbackData === "alert_price_above") await handleAlertType(callbackChatId, "price", "above");
      if (callbackData === "alert_price_below") await handleAlertType(callbackChatId, "price", "below");
      if (callbackData === "alert_apy_below")   await handleAlertType(callbackChatId, "apy", "below");
      if (callbackData === "alert_cancel")      await sendMessage(callbackChatId, "❌ Alert setup cancelled\\.");
      return NextResponse.json({ ok: true });
    }

    // Pending alert: user is typing a threshold number
    const pending = await redis.get(`pending:${chatId}`);
    console.log("Pending alert for chatId:", chatId, "value:", pending);

    if (pending && !text.startsWith("/")) {
      const threshold = parseFloat(text);
      console.log("Parsed threshold:", threshold, "isNaN:", isNaN(threshold));

      if (!isNaN(threshold)) {
        const [type, direction] = (pending as string).split("_");
        console.log("Saving alert:", { chatId, type, direction, threshold });

        const alert: Alert = { chatId, type: type as Alert["type"], direction: direction as Alert["direction"], threshold, active: true, createdAt: Date.now() };
        await redis.lpush(`alerts:${chatId}`, JSON.stringify(alert));
        console.log("Alert saved directly to Redis");

        await redis.del(`pending:${chatId}`);
        await sendMessage(chatId,
          `✅ Alert set\\! I'll notify you when TON ${esc(type)} ${esc(direction)} \\$${esc(threshold)}\\.`
        );
      } else {
        await sendMessage(chatId, "Please enter a valid number\\. Example: 2\\.50");
      }
      return NextResponse.json({ ok: true });
    }

    // Commands
    if (text.startsWith("/start"))        await handleStart(chatId);
    else if (text.startsWith("/price"))   await handlePrice(chatId);
    else if (text.startsWith("/apy"))     await handleApy(chatId);
    else if (text.startsWith("/alerts"))  await handleAlerts(chatId);
    else if (text.startsWith("/alert"))   await handleAlertMenu(chatId);
    else if (text.startsWith("/stop"))    await handleStop(chatId);
    else if (text.startsWith("/support")) await handleSupport(chatId);
    else if (text.startsWith("/help"))    await handleHelp(chatId);
    else if (text.startsWith("/ask "))    await handleAsk(chatId, text.slice(5));
    else if (text.startsWith("/ask"))     await handleAsk(chatId, text.slice(4).trim());
    else if (text && !text.startsWith("/")) {
      await sendMessage(chatId,
        "🤖 I didn't get that\\. Try /help or just ask me anything about TON DeFi\\!",
        { reply_markup: openAppKeyboard }
      );
    }
  } catch (e) {
    console.error("webhook error:", e);
  }

  return NextResponse.json({ ok: true });
}
