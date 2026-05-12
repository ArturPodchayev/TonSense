import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

// Tonstakers liquid staking pool (liquidTF implementation)
const POOL_ADDRESS = "0:a45b17f28409229b78360e3290420f13e4fe20f90d7e2bf8c4ac6703259e22fa";
// tsTON jetton master — holds total_supply used to compute tsTON/TON exchange rate
const JETTON_MASTER = "0:bdf3fa8098d129b54b4f73b5bac5d1e1fd91eb054169c3916dfc8ccd536d1000";
const LAUNCH_DATE = new Date("2023-06-01").getTime();

export async function GET() {
  try {
    const cached = await redis.get<{ apy: number }>("ton:apy:v2");
    if (cached && cached.apy > 1 && cached.apy < 20) return Response.json(cached);

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
      (((rate - 1) * 365 / daysSinceLaunch) * 100).toFixed(2)
    );
    if (apy < 1 || apy > 20) throw new Error(`apy out of plausible range: ${apy}`);
    const result = { apy };

    await redis.set("ton:apy:v2", result, { ex: 300 });
    return Response.json(result);
  } catch (err) {
    console.error("[staking-apy]", err);
    const fallback = await redis.get<{ apy: number }>("ton:apy:v2");
    if (fallback && fallback.apy > 1 && fallback.apy < 20) return Response.json(fallback);
    return Response.json({ error: "rate unavailable" }, { status: 503 });
  }
}
