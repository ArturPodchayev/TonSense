import { Redis } from "@upstash/redis";
import type { HealthStatus } from "../types";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const STATUS_KEY      = "health:status";
const LAST_NOTIFY_KEY = "health:last_notify";
const NOTIFY_COOLDOWN = 60 * 60 * 1000; // 1 hour in ms

function buildMessage(status: HealthStatus): string {
  const down: string[] = [];
  if (!status.tonPrice.ok)  down.push("TON Price API");
  if (!status.stakingApy.ok) down.push("Staking APY API");
  const service = down.length > 1 ? "all services" : down[0] ?? "an API";
  return `🚨 TonSense Alert: ${service} is down. Check immediately. tonsense.app`;
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const BOT_TOKEN    = process.env.TELEGRAM_BOT_TOKEN!;
  const ADMIN_CHAT   = process.env.ADMIN_TELEGRAM_CHAT_ID!;

  const status = await redis.get<HealthStatus>(STATUS_KEY);
  if (!status) {
    return Response.json({ skipped: true, reason: "no health status in Redis" });
  }

  if (status.overall === "ok") {
    return Response.json({ skipped: true, reason: "all systems ok" });
  }

  // Throttle: skip if notified within the last hour
  const lastNotify = await redis.get<number>(LAST_NOTIFY_KEY);
  if (lastNotify && Date.now() - lastNotify < NOTIFY_COOLDOWN) {
    return Response.json({ skipped: true, reason: "within cooldown period" });
  }

  const text = buildMessage(status);

  const tgRes = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: ADMIN_CHAT, text }),
    }
  );

  if (!tgRes.ok) {
    const err = await tgRes.text();
    return Response.json({ ok: false, error: err }, { status: 502 });
  }

  await redis.set(LAST_NOTIFY_KEY, Date.now(), { ex: 7200 }); // keep for 2h

  return Response.json({ ok: true, notified: true, message: text });
}
