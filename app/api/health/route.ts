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
  const [priceResult, apyResult] = await Promise.allSettled([
    fetch(`${WEBAPP_URL}/api/ton-price`, { next: { revalidate: 0 } })
      .then(r => r.json())
      .then((d: { price: number }) => ({ ok: typeof d.price === "number" && d.price > 0, value: d.price ?? null })),
    fetch(`${WEBAPP_URL}/api/staking-apy`, { next: { revalidate: 0 } })
      .then(r => r.json())
      .then((d: { apy: number }) => ({ ok: typeof d.apy === "number" && d.apy > 0, value: d.apy ?? null })),
  ]);

  const tonPrice  = priceResult.status  === "fulfilled" ? priceResult.value  : { ok: false, value: null };
  const stakingApy = apyResult.status === "fulfilled" ? apyResult.value : { ok: false, value: null };

  const okCount = [tonPrice.ok, stakingApy.ok].filter(Boolean).length;
  const overall: HealthStatus["overall"] =
    okCount === 2 ? "ok" : okCount === 1 ? "degraded" : "down";

  return { timestamp: Date.now(), tonPrice, stakingApy, overall };
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
