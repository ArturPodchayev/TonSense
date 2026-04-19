export async function GET() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd&include_24hr_change=true",
      { next: { revalidate: 60 } }
    );
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const data = await res.json();
    const ton = data["the-open-network"];
    return Response.json({
      price: ton.usd as number,
      change24h: ton.usd_24h_change as number,
    });
  } catch {
    return Response.json({ price: 3.24, change24h: 0 });
  }
}
