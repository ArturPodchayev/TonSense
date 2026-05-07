import { Redis } from "@upstash/redis";
import type { HealthStatus } from "./types";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const WEBAPP_URL = "https://tonsense.app";
const REDIS_KEY = "health:status";
const TTL = 600; // 10 minutes

async function runChecks(): Promise<HealthStatus> {
  const [priceResult, apyResult, deepseekResult] = await Promise.allSettled([
    fetch(`${WEBAPP_URL}/api/ton-price`, { next: { revalidate: 0 } })
      .then(r => r.json())
      .then((d: { price: number }) => ({ ok: typeof d.price === "number" && d.price > 0, value: d.price ?? null })),
    fetch(`${WEBAPP_URL}/api/staking-apy`, { next: { revalidate: 0 } })
      .then(r => r.json())
      .then((d: { apy: number }) => ({ ok: typeof d.apy === "number" && d.apy > 0, value: d.apy ?? null })),
    fetch("https://api.deepseek.com/user/balance", {
      headers: { Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
    })
      .then(r => r.json())
      .then((d: { balance_infos: Array<{ total_balance: string | number }> }) => {
        const raw = d?.balance_infos?.[0]?.total_balance ?? null;
        const balance = raw !== null ? parseFloat(String(raw)) : null;
        return { ok: balance !== null && !isNaN(balance) && balance > 0, balance };
      }),
  ]);

  const tonPrice   = priceResult.status    === "fulfilled" ? priceResult.value    : { ok: false, value: null };
  const stakingApy = apyResult.status      === "fulfilled" ? apyResult.value      : { ok: false, value: null };
  const deepseek   = deepseekResult.status === "fulfilled" ? deepseekResult.value : { ok: false, balance: null };

  // "down"     — a core data API failed
  // "degraded" — core APIs ok but DeepSeek balance is low (< 0.5) or unreachable
  // "ok"       — everything healthy
  let overall: HealthStatus["overall"];
  if (!tonPrice.ok || !stakingApy.ok) {
    overall = "down";
  } else if (!deepseek.ok || (deepseek.balance !== null && deepseek.balance < 0.5)) {
    overall = "degraded";
  } else {
    overall = "ok";
  }

  return { timestamp: Date.now(), tonPrice, stakingApy, deepseek, overall };
}

// GET — cron-triggered (with CRON_SECRET) runs checks and writes Redis.
//       Called without auth returns the last saved status (public status page).
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (isCron) {
    const status = await runChecks();
    await redis.set(REDIS_KEY, status, { ex: TTL });
    return Response.json(status);
  }

  // Public read — return last saved status (or run a fresh check if cache is empty)
  const cached = await redis.get<HealthStatus>(REDIS_KEY);
  if (cached) return Response.json(cached);

  const status = await runChecks();
  await redis.set(REDIS_KEY, status, { ex: TTL });
  return Response.json(status);
}
