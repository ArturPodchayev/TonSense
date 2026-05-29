"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { fetchTonHistory, fetchStakingAPY, fetchTonPrice, type HistoryPoint } from "@/lib/api";
import { useTonBalance } from "@/hooks/useTonBalance";
import AIAnalysis from "@/components/AIAnalysis";
import ShareCard from "@/components/ShareCard";
import Toast from "@/components/Toast";
import TxButton from "@/components/TxButton";
import { buildStakeTx } from "@/lib/transactions";

const PERIODS = [
  { label: "7d", value: 7 },
  { label: "14d", value: 14 },
  { label: "30d", value: 30 },
  { label: "60d", value: 60 },
  { label: "90d", value: 90 },
];

interface Results {
  heldUSDT: number;
  stakedUSDT: number;
  diff: number;
  tonAmount: number;
  days: number;
}

const glass = {
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
} as const;

const fmt2 = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function WhatIfCalculator() {
  const [amount, setAmount] = useState<string>("");
  const [period, setPeriod] = useState<number>(30);
  const walletBalance = useTonBalance();
  const [results, setResults] = useState<Results | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [apy, setApy] = useState<number | null>(null);
  const [apyLoading, setApyLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState<number>(3.24);
  const [change24h, setChange24h] = useState<number>(0);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!walletBalance || amount) return;
    void Promise.resolve().then(() => setAmount(String(walletBalance).replace(",", ".")));
  }, [walletBalance, amount]);

  useEffect(() => {
    Promise.allSettled([fetchTonHistory(90), fetchStakingAPY(), fetchTonPrice()]).then(
      ([hist, apyVal, priceData]) => {
        if (hist.status === "fulfilled") {
          setHistory(hist.value);
        }
        if (apyVal.status === "fulfilled") {
          setApy(apyVal.value.apy);
        } else {
          setApy(null);
        }
        setApyLoading(false);
        if (priceData.status === "fulfilled") {
          setCurrentPrice(priceData.value.price);
          setChange24h(priceData.value.change24h);
        }
        setHistoryLoading(false);
      }
    );
  }, []);

  const handleShare = useCallback(async () => {
    if (!results || !shareCardRef.current) return;
    setSharing(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: "#0A0A0F",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = "tonsense-result.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
      const positive = results.diff >= 0;
      const absDiff = Math.abs(results.diff).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const shareText = positive
        ? `I would have earned +$${absDiff} more if I staked my TON ${results.days} days ago! 🚀 Calculate your missed gains → https://tonsense.vercel.app #TON #DeFi #Tonstakers`
        : `Even staking couldn't save me from this TON dip 😅 But staking still beats just holding! Calculate yours → https://tonsense.vercel.app #TON #DeFi`;
      await navigator.clipboard.writeText(shareText);
      setToast("Image downloaded + text copied! Paste in Telegram 🚀");
    } catch {
      setToast("Download ready! Copy the text manually.");
    } finally {
      setSharing(false);
    }
  }, [results]);

  const handleShareTelegram = useCallback(() => {
    if (!results) return;
    const absDiff = Math.abs(results.diff).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const text = results.diff >= 0
      ? `I would have earned +$${absDiff} more by staking ${results.tonAmount} TON ${results.days} days ago! 💎 Calculate yours on TonSense`
      : `TON staking still beats just holding! Calculate your potential returns 💎`;
    const url = `https://t.me/share/url?url=${encodeURIComponent("https://tonsense.app")}&text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }, [results]);

  function calculate() {
    const ton = parseFloat(amount);
    if (!ton || ton <= 0 || history.length === 0 || apy === null) return;
    const heldUSDT = ton * currentPrice;
    const stakedTON = ton * (1 + (apy / 100) * (period / 365));
    const stakedUSDT = stakedTON * currentPrice;
    const diff = stakedUSDT - heldUSDT;
    setResults({ heldUSDT, stakedUSDT, diff, tonAmount: ton, days: period });
  }

  const chartData = history.length > 0 ? history.slice(-period) : [];

  return (
    <div className="space-y-4">
      {/* Off-screen share card */}
      {results && (
        <ShareCard
          ref={shareCardRef}
          heldUSDT={results.heldUSDT}
          stakedUSDT={results.stakedUSDT}
          diff={results.diff}
          tonAmount={results.tonAmount}
          days={results.days}
        />
      )}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      {/* Input card */}
      <div className="rounded-2xl p-6 space-y-5" style={glass}>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
            TON Amount
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 1000"
            className="w-full rounded-xl px-4 py-3 text-white text-sm font-medium transition-all outline-none placeholder:text-white/20"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            onFocus={(e) => (e.currentTarget.style.boxShadow = "0 0 0 2px rgba(0,152,234,0.35)")}
            onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
          />
          {!!walletBalance && (
            <>
              <button
                onClick={() => setAmount(walletBalance.toString())}
                className="flex items-center gap-1.5 text-xs mt-2 px-3 py-1.5 rounded-lg transition-all"
                style={{
                  background: "rgba(0,152,234,0.1)",
                  border: "1px solid rgba(0,152,234,0.2)",
                  color: "#0098EA",
                }}
              >
                <span>💎</span>
                <span>Use wallet balance: <strong>{walletBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TON</strong></span>
              </button>
              <div className="flex gap-2 mt-2">
                {([25, 50, 75, 100] as const).map((pct) => (
                  <button
                    key={pct}
                    onClick={() => {
                      const val = parseFloat((walletBalance * pct / 100).toFixed(2));
                      setAmount(String(val).replace(",", "."));
                    }}
                    className="flex-1 font-semibold transition-all hover:opacity-80"
                    style={{
                      background: "rgba(0,152,234,0.08)",
                      border: "1px solid rgba(0,152,234,0.2)",
                      color: "rgba(0,152,234,0.8)",
                      borderRadius: 8,
                      fontSize: 11,
                      padding: "4px 0",
                    }}
                  >
                    {pct === 100 ? "MAX" : `${pct}%`}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
            Time Period
          </label>
          <div className="grid grid-cols-5 gap-1 sm:gap-2">
            {PERIODS.map((p) => {
              const active = period === p.value;
              return (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className="flex-1 min-w-0 py-1.5 px-0 rounded-xl font-semibold transition-all duration-200 text-center"
                  style={{ ...(active ? { background: "linear-gradient(135deg, #0098EA, #0077BB)", boxShadow: "0 2px 14px rgba(0,152,234,0.4)", color: "#fff" } : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)" }), fontSize: 11 }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        <div
          className="flex items-center justify-between rounded-xl px-4 py-3"
          style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}
        >
          <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
            Staking APY (tsTON)
          </span>
          {apyLoading ? (
            <div className="h-6 w-16 rounded-md bg-white/10 animate-pulse flex-shrink-0" />
          ) : apy === null ? (
            <span className="text-sm font-semibold flex-shrink-0" style={{ color: "#F87171" }}>
              Unavailable
            </span>
          ) : (
            <span className="text-base font-bold flex-shrink-0" style={{ color: "#22C55E" }}>
              {apy.toFixed(1)}%
            </span>
          )}
        </div>

        <button
          onClick={calculate}
          disabled={!amount || parseFloat(amount) <= 0 || historyLoading || apyLoading || apy === null}
          className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: "linear-gradient(135deg, #0098EA 0%, #0077BB 100%)",
            boxShadow: "0 4px 30px rgba(0,152,234,0.35)",
          }}
          onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.transform = "scale(1.01)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          {historyLoading || apyLoading ? "Loading data…" : apy === null ? "APY unavailable" : "Calculate"}
        </button>
      </div>

      {/* Results */}
      {results && apy !== null && (
        <div className="space-y-4">
          <p className="text-base sm:text-xl font-bold text-white px-1">
            If you had staked{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #0098EA, #0077BB)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {results.tonAmount.toLocaleString()} TON
            </span>{" "}
            {results.days} days ago&hellip;
          </p>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
            <ResultCard label="Just Held" value={`$${fmt2(results.heldUSDT)}`} />
            <ResultCard
              label="Staked in tsTON"
              value={`$${fmt2(results.stakedUSDT)}`}
              accent="blue"
            />
            <ResultCard
              label="Difference"
              value={`${results.diff >= 0 ? "🚀 +" : ""}$${fmt2(Math.abs(results.diff))}`}
              accent={results.diff >= 0 ? "green" : "red"}
            />
          </div>

          {/* AI Analysis */}
          <AIAnalysis
            tonPrice={currentPrice}
            change24h={change24h}
            apy={apy}
            userAmount={results.tonAmount}
            mode="whatif"
          />

          {/* Action buttons */}
          <div className="flex gap-2">
            <TxButton
              label="💎 Stake on Tonstakers"
              amountTon={results.tonAmount}
              buildTx={() => buildStakeTx(parseFloat(amount))}
              simulationData={{
                send: amount,
                receive: (parseFloat(amount) * 0.909).toFixed(3),
                receiveToken: "tsTON",
                fee: "0.003",
              }}
              onSuccess={() => setToast("Staking tx sent!")}
              onError={(e) => setToast("Error: " + e.message)}
              className="flex-1"
            />
            <a
              href="https://app.ston.fi/swap?ft=TON&tt=tsTON"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.01]"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.75)",
              }}
            >
              ⚡ Swap on Ston.fi →
            </a>
          </div>

          {/* Share buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              disabled={sharing}
              className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backdropFilter: "blur(12px)",
                background: "rgba(124,58,237,0.15)",
                border: "1px solid rgba(124,58,237,0.3)",
                color: "rgba(255,255,255,0.8)",
              }}
              onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.boxShadow = "0 0 24px rgba(124,58,237,0.3)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
            >
              {sharing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
                  Generating…
                </>
              ) : (
                "📤 Share Your Result"
              )}
            </button>
            <button
              onClick={handleShareTelegram}
              className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, #0098EA, #229ED9)",
                color: "#fff",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.19 13.913l-2.965-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.963.646z"/>
              </svg>
              Share to Telegram
            </button>
          </div>

          {/* Chart */}
          <div className="rounded-2xl p-5" style={glass}>
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>
              TON Price — Last {period} days
            </p>
            {historyLoading ? (
              <div className="h-[200px] flex items-center justify-center">
                <div
                  className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: "rgba(0,152,234,0.3)", borderTopColor: "#0098EA" }}
                />
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
                No price data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="tonPriceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0098EA" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#0098EA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${v.toFixed(2)}`}
                    width={52}
                  />
                  <Tooltip
                    contentStyle={{
                      backdropFilter: "blur(16px)",
                      WebkitBackdropFilter: "blur(16px)",
                      background: "rgba(15,15,25,0.85)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 10,
                      color: "#fff",
                      fontSize: 12,
                    }}
                    formatter={(v) => [`$${Number(v).toFixed(4)}`, "TON"]}
                    labelStyle={{ color: "rgba(255,255,255,0.45)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#0098EA"
                    strokeWidth={2.5}
                    fill="url(#tonPriceGradient)"
                    dot={false}
                    activeDot={{ r: 4, fill: "#0098EA", strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ResultCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "blue" | "green" | "red";
}) {
  const accentStyles = {
    blue: {
      background: "rgba(0,152,234,0.08)",
      border: "1px solid rgba(0,152,234,0.3)",
      color: "#0098EA",
      boxShadow: "0 0 30px rgba(0,152,234,0.15)",
    },
    green: {
      background: "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.08))",
      border: "1px solid rgba(34,197,94,0.4)",
      color: "#22C55E",
      boxShadow: "0 0 20px rgba(34,197,94,0.15)",
    },
    red: {
      background: "rgba(239,68,68,0.08)",
      border: "1px solid rgba(239,68,68,0.3)",
      color: "#EF4444",
      boxShadow: "0 0 30px rgba(239,68,68,0.15)",
    },
    none: {
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      color: "#fff",
      boxShadow: "none",
    },
  };
  const s = accentStyles[accent ?? "none"];

  const icons: Record<string, string> = {
    "Staked in tsTON": "💎",
    "Difference": "⚡",
  };

  return (
    <div
      className="rounded-2xl p-2.5 sm:p-4 min-w-0 overflow-hidden"
      style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", background: s.background, border: s.border, boxShadow: s.boxShadow }}
    >
      <p className="text-[9px] sm:text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>
        {icons[label] ? `${icons[label]} ` : ""}{label}
      </p>
      <p className="text-base sm:text-2xl font-black whitespace-nowrap leading-tight" style={{ color: s.color }}>
        {value}
      </p>
    </div>
  );
}
