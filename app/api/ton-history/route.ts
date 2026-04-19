export async function GET() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/the-open-network/market_chart?vs_currency=usd&days=90&interval=daily",
      { next: { revalidate: 3600 } }
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
    return Response.json(history);
  } catch {
    return Response.json([]);
  }
}
