const FALLBACK = {
  verdict: "Staking tsTON offers steady 18.7% APY yield.",
  risk: "Short-term price volatility may offset staking gains.",
  action: "Stake if bullish on TON long-term recovery.",
};

export async function POST(req: Request) {
  try {
    const { tonPrice, change24h, apy, userAmount, mode } = await req.json();

    const sign = change24h > 0 ? "+" : "";
    const userPrompt =
      mode === "future"
        ? `TON price: $${tonPrice} (${sign}${change24h.toFixed(2)}% 24h). tsTON APY: ${apy}%. User wants to stake ${userAmount} TON. Analyze staking outlook.`
        : `TON price: $${tonPrice} (${sign}${change24h.toFixed(2)}% 24h). tsTON APY: ${apy}%. Analyze current staking sentiment and whether to stake now.`;

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        max_tokens: 200,
        messages: [
          {
            role: "system",
            content:
              'You are a sharp DeFi analyst for TON blockchain. Return ONLY a JSON object with exactly this structure, no markdown, no extra text: {"verdict": "one sentence verdict on staking right now (max 12 words)", "risk": "main risk in one sentence (max 12 words)", "action": "specific actionable advice in one sentence (max 12 words)"}',
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
      }),
    });

    if (!response.ok) throw new Error(`DeepSeek ${response.status}`);
    const data = await response.json();
    const text: string = data.choices?.[0]?.message?.content ?? "";
    if (!text) throw new Error("empty response");

    const parsed = JSON.parse(text);
    const { verdict, risk, action } = parsed;
    if (!verdict || !risk || !action) throw new Error("missing fields");

    return Response.json({ verdict, risk, action });
  } catch {
    return Response.json(FALLBACK);
  }
}
