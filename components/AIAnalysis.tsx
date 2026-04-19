"use client";

import { useEffect, useState } from "react";

interface Props {
  tonPrice: number;
  change24h: number;
  apy: number;
  userAmount: number;
  mode: "whatif" | "future";
}

interface AnalysisData {
  verdict: string;
  risk: string;
  action: string;
}

export default function AIAnalysis({ tonPrice, change24h, apy, userAmount, mode }: Props) {
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userAmount || !tonPrice) return;
    setLoading(true);
    setAnalysis(null);

    fetch("/api/ai-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tonPrice, change24h, apy, userAmount, mode }),
    })
      .then((r) => r.json())
      .then((data: AnalysisData) => setAnalysis(data))
      .catch(() =>
        setAnalysis({
          verdict: "Staking tsTON offers steady 4.2% APY yield.",
          risk: "Short-term price volatility may offset staking gains.",
          action: "Stake if bullish on TON long-term recovery.",
        })
      )
      .finally(() => setLoading(false));
  }, [tonPrice, change24h, apy, userAmount, mode]);

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        background: "linear-gradient(135deg, rgba(0,152,234,0.06) 0%, rgba(124,58,237,0.06) 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderTop: "1px solid rgba(0,152,234,0.2)",
        borderLeft: "3px solid #0098EA",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <span
          className="text-sm font-bold"
          style={{
            background: "linear-gradient(90deg, #0098EA, #7C3AED)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          🤖 AI Analysis
        </span>
        <span
          className="text-[11px] font-medium px-2.5 py-1 rounded-full"
          style={{
            backdropFilter: "blur(12px)",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.45)",
          }}
        >
          Powered by TonSenseAI
        </span>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-md animate-pulse flex-shrink-0" style={{ background: "rgba(255,255,255,0.07)" }} />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-16 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.07)" }} />
                <div className="h-3.5 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.07)", width: `${75 + i * 8}%` }} />
              </div>
            </div>
          ))}
        </div>
      ) : analysis ? (
        <div className="space-y-4">
          <div className="flex gap-3 items-start">
            <span className="text-lg leading-none">🎯</span>
            <div>
              <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Verdict</p>
              <p className="text-sm font-medium text-white">{analysis.verdict}</p>
            </div>
          </div>

          <div className="border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }} />

          <div className="flex gap-3 items-start">
            <span className="text-lg leading-none">⚠️</span>
            <div>
              <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Risk</p>
              <p className="text-sm font-medium" style={{ color: "#EF4444" }}>{analysis.risk}</p>
            </div>
          </div>

          <div className="border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }} />

          <div className="flex gap-3 items-start">
            <span className="text-lg leading-none">💡</span>
            <div>
              <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Action</p>
              <p className="text-sm font-medium" style={{ color: "#22C55E" }}>{analysis.action}</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
