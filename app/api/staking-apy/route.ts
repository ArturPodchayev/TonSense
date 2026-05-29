import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

// Tonstakers liquid staking pool (liquidTF implementation)
const POOL_ADDRESS = "0:a45b17f28409229b78360e3290420f13e4fe20f90d7e2bf8c4ac6703259e22fa";
// tsTON jetton master — holds total_supply used to compute tsTON/TON exchange rate
const JETTON_MASTER = "0:bdf3fa8098d129b54b4f73b5bac5d1e1fd91eb054169c3916dfc8ccd536d1000";
const LAUNCH_DATE = new Date("2023-06-01").getTime();
const CACHE_KEY = "ton:apy:v2";
const CACHE_TTL_SECONDS = 300;

interface CachedApyPayload {
  apy: number;
  asOf: string;
}

interface StakingApyResponse {
  apy: number;
  asOf: string;
  source: "live" | "cache";
  cacheTtlSeconds: number;
}

function isValidApy(apy: number): boolean {
  return Number.isFinite(apy) && apy > 1 && apy < 20;
}

function toResponse(payload: CachedApyPayload, source: "live" | "cache"): NextResponse<StakingApyResponse> {
  return NextResponse.json({
    apy: payload.apy,
    asOf: payload.asOf,
    source,
    cacheTtlSeconds: CACHE_TTL_SECONDS,
  });
}

function unavailableResponse(): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: "APY_UNAVAILABLE",
        message: "Staking APY unavailable",
      },
    },
    { status: 503 }
  );
}

export async function GET() {
  try {
    const cached = await redis.get<CachedApyPayload>(CACHE_KEY);
    if (cached && isValidApy(cached.apy) && cached.asOf) {
      return toResponse(cached, "cache");
    }

    // Parallel: get total TON in pool + total tsTON supply
    const [poolRes, jettonRes] = await Promise.all([
      fetch(`https://tonapi.io/v2/staking/pool/${encodeURIComponent(POOL_ADDRESS)}`, { next: { revalidate: 0 } }),
      fetch(`https://tonapi.io/v2/blockchain/accounts/${encodeURIComponent(JETTON_MASTER)}/methods/get_jetton_data`, { next: { revalidate: 0 } }),
    ]);
    if (!poolRes.ok) throw new Error(`pool endpoint ${poolRes.status}`);
    if (!jettonRes.ok) throw new Error(`jetton endpoint ${jettonRes.status}`);

    const poolData = await poolRes.json();
    const jettonData = await jettonRes.json();

    // total_amount: nanoTON locked in the pool
    // total_supply: nanoTON-equivalent of tsTON minted — ratio gives tsTON/TON rate
    const totalAmount: number = poolData?.pool?.total_amount;
    const totalSupply: number = Number(jettonData?.decoded?.total_supply);
    if (!totalAmount || !totalSupply) {
      throw new Error(`missing pool data: amount=${totalAmount} supply=${totalSupply}`);
    }

    const rate = totalAmount / totalSupply;
    if (rate <= 1) throw new Error(`unexpected rate: ${rate}`);

    const daysSinceLaunch = (Date.now() - LAUNCH_DATE) / 86_400_000;
    // APY = ((rate - 1) * 365 / daysSinceLaunch) * 100
    const apy = parseFloat(
      (((rate - 1) * 365 / daysSinceLaunch) * 100).toFixed(1)
    );
    if (!isValidApy(apy)) throw new Error(`apy out of plausible range: ${apy}`);
    const result: CachedApyPayload = {
      apy,
      asOf: new Date().toISOString(),
    };

    await redis.set(CACHE_KEY, result, { ex: CACHE_TTL_SECONDS });
    return toResponse(result, "live");
  } catch (err) {
    console.error("[staking-apy]", err);
    const fallback = await redis.get<CachedApyPayload>(CACHE_KEY);
    if (fallback && isValidApy(fallback.apy) && fallback.asOf) {
      return toResponse(fallback, "cache");
    }
    return unavailableResponse();
  }
}
