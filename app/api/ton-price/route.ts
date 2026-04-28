import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export async function GET() {
  try {
    const cached = await redis.get("ton:price");
    if (cached) return Response.json(cached);

    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd&include_24hr_change=true",
      { next: { revalidate: 0 } }
    );
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const data = await res.json();
    const ton = data["the-open-network"];
    const result = {
      price: ton.usd as number,
      change24h: ton.usd_24h_change as number,
    };

    await redis.set("ton:price", result, { ex: 60 });
    return Response.json(result);
  } catch {
    const fallback = await redis.get("ton:price");
    if (fallback) return Response.json(fallback);
    return Response.json({ price: 3.24, change24h: 0 });
  }
}
