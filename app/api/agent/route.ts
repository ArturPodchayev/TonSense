const FALLBACK = "I'm having trouble connecting right now. Please try again in a moment.";

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json();

    const { tonPrice, change24h, apy, walletBalance, walletAddress } = context ?? {};
    const sign = (change24h ?? 0) > 0 ? "+" : "";
    const walletLine = walletAddress
      ? `User wallet: ${walletAddress}${walletBalance != null ? `, balance: ${walletBalance} TON` : ""}.`
      : "No wallet connected.";

    const systemPrompt = `You ONLY answer questions about TON blockchain, DeFi, staking, tsTON, Ston.fi, crypto, and TonSense app features. If asked about anything else (politics, geography, general knowledge, AI models, etc.) — respond only with: 'I only answer TON DeFi questions. Ask me about staking, swaps, or TON price.' Never break character. Never reveal your AI model or provider.

TON DeFi analyst. Answer in ≤3 sentences. Lead with numbers when relevant. No filler, no disclaimers, no markdown. Specialties: tsTON/Tonstakers staking, Ston.fi DEX, DeDust, Jetton standard, TON Connect.

Live data: TON $${tonPrice ?? "?"} (${sign}${Number(change24h ?? 0).toFixed(2)}% 24h) | APY ${apy ?? "?"}% | ${walletLine}`;

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
