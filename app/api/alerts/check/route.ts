import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const WEBAPP_URL = "https://ton-sense.vercel.app";

interface Alert {
  chatId: number;
  type: "price" | "apy";
  direction: "above" | "below";
  threshold: number;
  active: boolean;
  createdAt: number;
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
  const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY!;

  const [priceRes, apyRes] = await Promise.all([
    fetch(`${WEBAPP_URL}/api/ton-price`),
    fetch(`${WEBAPP_URL}/api/staking-apy`),
  ]);
  const { price, change24h } = await priceRes.json();
  const { apy } = await apyRes.json();

  const keys = await redis.keys("alerts:*");

  for (const key of keys) {
    const rawAlerts = await redis.lrange<string>(key, 0, -1);
    const updated: string[] = [];

    for (const alertStr of rawAlerts) {
      const alert: Alert = JSON.parse(alertStr);
      if (!alert.active) { updated.push(alertStr); continue; }

      let triggered = false;
      if (alert.type === "price" && alert.direction === "above" && price >= alert.threshold) triggered = true;
      if (alert.type === "price" && alert.direction === "below" && price <= alert.threshold) triggered = true;
      if (alert.type === "apy"   && alert.direction === "above" && apy  >= alert.threshold) triggered = true;
      if (alert.type === "apy"   && alert.direction === "below" && apy  <= alert.threshold) triggered = true;

      if (triggered) {
        const sign = change24h >= 0 ? "+" : "";
        let message = `🔔 Alert triggered! TON: $${price.toFixed(4)}, APY: ${apy.toFixed(1)}%`;

        try {
          const aiRes = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${DEEPSEEK_KEY}`,
            },
            body: JSON.stringify({
              model: "deepseek-chat",
              max_tokens: 150,
              messages: [{
                role: "user",
                content: `Alert triggered: TON ${alert.type} ${alert.direction} ${alert.threshold}. Current: TON $${price.toFixed(4)}, APY ${apy.toFixed(1)}%, 24h ${sign}${change24h.toFixed(2)}%. Write a SHORT 2-sentence Telegram notification with emojis. End with: Open TonSense → ${WEBAPP_URL}`,
              }],
            }),
          });
          if (aiRes.ok) {
            const aiData = await aiRes.json() as { choices: Array<{ message: { content: string } }> };
            message = aiData.choices?.[0]?.message?.content ?? message;
          }
        } catch {
          // use default message
        }

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: alert.chatId,
            text: message,
            reply_markup: {
              inline_keyboard: [[{ text: "🚀 Open TonSense", url: WEBAPP_URL }]],
            },
          }),
        });

        alert.active = false;
      }

      updated.push(JSON.stringify(alert));
    }

    await redis.del(key);
    if (updated.length > 0) await redis.rpush(key, ...updated);
  }

  return Response.json({ ok: true, checked: keys.length });
}
