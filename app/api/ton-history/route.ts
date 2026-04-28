import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export async function GET() {
  try {
    const cached = await redis.get("ton:history");
    if (cached) return Response.json(cached);

    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/the-open-network/market_chart?vs_currency=usd&days=90&interval=daily",
      { next: { revalidate: 0 } }
    );
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const data = await res.json();
    const prices: [number, number][] = data.prices;
    const history = prices.slice(-90).map(([ts, price]) => ({
      date: new Date(ts).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      price: parseFloat(price.toFixed(4)),
    }));

    await redis.set("ton:history", history, { ex: 3600 });
    return Response.json(history);
  } catch {
    const fallback = await redis.get("ton:history");
    if (fallback) return Response.json(fallback);
    return Response.json([]);
  }
}
