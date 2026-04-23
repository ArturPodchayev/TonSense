const FALLBACK = "I'm having trouble connecting right now. Please try again in a moment.";

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json();

    const { tonPrice, change24h, apy, walletBalance, walletAddress } = context ?? {};
    const sign = (change24h ?? 0) > 0 ? "+" : "";
    const walletLine = walletAddress
      ? `User wallet: ${walletAddress}${walletBalance != null ? `, balance: ${walletBalance} TON` : ""}.`
      : "No wallet connected.";

    const systemPrompt = `You are an expert TON blockchain DeFi advisor embedded in TonSense. You have deep knowledge of Tonstakers, tsTON liquid staking, Ston.fi DEX, DeDust, the Jetton token standard, TON Connect, and TON wallets. Give concise, accurate answers in 3-4 sentences max. No markdown formatting.

Live market data:
- TON price: $${tonPrice ?? "unknown"} (${sign}${Number(change24h ?? 0).toFixed(2)}% 24h)
- tsTON staking APY: ${apy ?? "unknown"}%
- ${walletLine}`;

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        max_tokens: 300,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      }),
    });

    if (!response.ok) throw new Error(`DeepSeek ${response.status}`);
    const data = await response.json();
    const message: string = data.choices?.[0]?.message?.content ?? "";
    if (!message) throw new Error("empty response");

    return Response.json({ message });
  } catch {
    return Response.json({ message: FALLBACK });
  }
}
