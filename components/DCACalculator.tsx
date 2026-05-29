"use client";

import { useState, useEffect, useRef } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { fetchStakingAPY, fetchTonPrice } from "@/lib/api";
import { useTonBalance } from "@/hooks/useTonBalance";
import Toast from "@/components/Toast";
import TxButton from "@/components/TxButton";
import { buildSwapTx } from "@/lib/transactions";

const FREQUENCIES = [
  { label: "Daily",   purchasesPerMonth: 30 },
  { label: "Weekly",  purchasesPerMonth: 4  },
  { label: "Monthly", purchasesPerMonth: 1  },
] as const;

type Frequency = (typeof FREQUENCIES)[number]["label"];

const DURATIONS = [3, 6, 12, 24] as const;
type Duration = (typeof DURATIONS)[number];

const glass = {
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
} as const;

const fmt2 = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function buildChartData(
  monthlyAmount: number,
  totalTon: number,
  durationMonths: number,
  currentPrice: number,
  monthlyAPY: number
): { month: string; dca: number; lumpsum: number }[] {
  const data = [];
  let dcaTon = 0;
  for (let m = 0; m <= durationMonths; m++) {
    if (m > 0) {
      dcaTon = dcaTon * (1 + monthlyAPY) + monthlyAmount;
    }
    data.push({
      month: m === 0 ? "Now" : `${m}m`,
      dca: parseFloat((dcaTon * currentPrice).toFixed(2)),
      lumpsum: parseFloat((totalTon * Math.pow(1 + monthlyAPY, m) * currentPrice).toFixed(2)),
    });
  }
  return data;
}

export default function DCACalculator() {
  const [amount, setAmount] = useState("");
  const [debouncedAmount, setDebouncedAmount] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [frequency, setFrequency] = useState<Frequency>("Weekly");
  const [duration, setDuration] = useState<Duration>(12);
  const walletBalance = useTonBalance();
  const [apy, setApy] = useState<number | null>(null);
  const [apyLoading, setApyLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState(3.24);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedAmount(amount), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [amount]);

  useEffect(() => {
    if (!walletBalance || amount) return;
    void Promise.resolve().then(() => setAmount(String(walletBalance).replace(",", ".")));
  }, [walletBalance, amount]);

  useEffect(() => {
    Promise.allSettled([fetchStakingAPY(), fetchTonPrice()]).then(([apyVal, priceData]) => {
      if (apyVal.status === "fulfilled") {
        setApy(apyVal.value.apy);
      } else {
        setApy(null);
      }
      setApyLoading(false);
      if (priceData.status === "fulfilled") {
        setCurrentPrice(priceData.value.price);
      }
    });
  }, []);

  const ton = parseFloat(debouncedAmount);
  const isValid = ton > 0 && !isNaN(ton);
  const canProject = isValid && apy !== null;

  const { purchasesPerMonth } = FREQUENCIES.find((f) => f.label === frequency)!;
  const totalPurchases = purchasesPerMonth * duration;
  const monthlyAmount = canProject ? ton * purchasesPerMonth : 0;
  const totalTon = canProject ? ton * totalPurchases : 0;
  const monthlyAPY = canProject ? apy / 100 / 12 : 0;

  let dcaFinalTon = 0;
  if (canProject) {
    for (let m = 1; m <= duration; m++) {
      dcaFinalTon = dcaFinalTon * (1 + monthlyAPY) + monthlyAmount;
    }
  }
  const totalInvestedUSDT = canProject ? totalTon * currentPrice : 0;
  const dcaFinalUSDT = canProject ? dcaFinalTon * currentPrice : 0;
  const earnedTON = canProject ? dcaFinalTon - totalTon : 0;
  const earnedUSDT = canProject ? earnedTON * currentPrice : 0;

  const lumpFinalTon = canProject ? totalTon * Math.pow(1 + monthlyAPY, duration) : 0;
  const lumpFinalUSDT = canProject ? lumpFinalTon * currentPrice : 0;
  const lumpVsDCA = canProject ? lumpFinalUSDT - dcaFinalUSDT : 0;

  const chartData = canProject
    ? buildChartData(monthlyAmount, totalTon, duration, currentPrice, monthlyAPY)
    : [];

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      {/* Input card */}
      <div className="rounded-2xl p-6 space-y-5" style={glass}>

        {/* Amount */}
        <div>
          <label
            className="block text-[11px] font-semibold uppercase tracking-widest mb-2"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            Amount per Purchase (TON)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 100"
            className="w-full rounded-xl px-4 py-3 text-white text-sm font-medium transition-all outline-none placeholder:text-white/20"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            onFocus={(e) => (e.currentTarget.style.boxShadow = "0 0 0 2px rgba(0,152,234,0.35)")}
            onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
          />
          {!!walletBalance && (
            <>
              <button
                onClick={() => setAmount(walletBalance.toString())}
                className="flex items-center gap-1.5 text-xs mt-2 px-3 py-1.5 rounded-lg transition-all"
                style={{ background: "rgba(0,152,234,0.1)", border: "1px solid rgba(0,152,234,0.2)", color: "#0098EA" }}
              >
                <span>💎</span>
                <span>
                  Use wallet balance:{" "}
                  <strong>
                    {walletBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TON
                  </strong>
                </span>
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

        {/* Frequency */}
        <div>
          <label
            className="block text-[11px] font-semibold uppercase tracking-widest mb-3"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            Purchase Frequency
          </label>
          <div className="flex gap-2">
            {FREQUENCIES.map(({ label }) => {
              const active = frequency === label;
              return (
                <button
                  key={label}
                  onClick={() => setFrequency(label)}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={
                    active
                      ? { background: "linear-gradient(135deg, #0098EA, #0077BB)", boxShadow: "0 2px 14px rgba(0,152,234,0.4)", color: "#fff" }
                      : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)" }
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label
            className="block text-[11px] font-semibold uppercase tracking-widest mb-3"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            Duration
          </label>
          <div className="flex gap-2">
            {DURATIONS.map((d) => {
              const active = duration === d;
              return (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={
                    active
                      ? { background: "linear-gradient(135deg, #A855F7, #7C3AED)", boxShadow: "0 2px 14px rgba(168,85,247,0.35)", color: "#fff" }
                      : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)" }
                  }
                >
                  {d}m
                </button>
              );
            })}
          </div>
          <p className="text-[10px] mt-2" style={{ color: "rgba(255,255,255,0.25)" }}>
            Starting from today · Using current market data
          </p>
        </div>

        {/* APY badge */}
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
      </div>

      {/* Results */}
      {canProject && (
        <div className="space-y-4">

          {/* Summary headline */}
          <p className="text-base font-bold text-white px-1">
            Buying{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #0098EA, #0077BB)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {ton.toLocaleString()} TON
            </span>{" "}
            {frequency.toLowerCase()} for {duration} months&hellip;
          </p>

          {/* 3 result cards */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
            <DCACard
              label="Total Invested"
              value={`$${fmt2(totalInvestedUSDT)}`}
            />
            <DCACard
              label="Earned (tsTON)"
              value={`+${earnedTON.toFixed(2)}`}
              sub={`+$${fmt2(earnedUSDT)}`}
              accent="green"
            />
            <DCACard
              label="Final Value"
              value={`$${fmt2(dcaFinalUSDT)}`}
              accent="blue"
            />
          </div>

          {/* vs Lump Sum */}
          <div
            className="rounded-xl px-4 py-3 flex items-center justify-between"
            style={{ background: "rgba(168,85,247,0.07)", border: "1px solid rgba(168,85,247,0.2)" }}
          >
            <div>
              <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>
                vs Lump Sum (same total)
              </p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                Invest all at once, stake entire duration
              </p>
            </div>
            <div className="text-right flex-shrink-0 ml-3">
              <p className="text-sm font-bold" style={{ color: "#A855F7" }}>
                ${fmt2(lumpFinalUSDT)}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: lumpVsDCA >= 0 ? "rgba(239,68,68,0.8)" : "#22C55E" }}>
                {lumpVsDCA >= 0 ? "+" : ""}{fmt2(lumpVsDCA)} vs DCA
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="rounded-2xl p-5" style={glass}>
            <p
              className="text-[11px] font-semibold uppercase tracking-widest mb-4"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              Portfolio Growth (USDT)
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="dcaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0098EA" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#0098EA" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="lumpGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A855F7" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#A855F7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.max(0, Math.floor(chartData.length / 7) - 1)}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${(v as number).toLocaleString()}`}
                  width={68}
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
                  formatter={(v, name) => [
                    `$${Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    name as string,
                  ]}
                  labelStyle={{ color: "rgba(255,255,255,0.45)" }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, color: "rgba(255,255,255,0.4)", paddingTop: 8 }}
                />
                <Area
                  type="monotone"
                  dataKey="lumpsum"
                  name="Lump Sum"
                  stroke="#A855F7"
                  strokeWidth={2}
                  fill="url(#lumpGradient)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
                <Area
                  type="monotone"
                  dataKey="dca"
                  name="DCA Strategy"
                  stroke="#0098EA"
                  strokeWidth={2.5}
                  fill="url(#dcaGradient)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <a
              href="https://app.tonstakers.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.01]"
              style={{
                background: "linear-gradient(135deg, #0098EA, #0077BB)",
                boxShadow: "0 4px 20px rgba(0,152,234,0.3)",
                color: "#fff",
              }}
            >
              💎 Start DCA on Tonstakers
            </a>
            <TxButton
              label="⚡ Swap TON first"
              amountTon={ton}
              buildTx={() => buildSwapTx(ton)}
              onSuccess={() => setToast("Swap tx sent!")}
              onError={(e) => setToast("Error: " + e.message)}
              className="flex-1"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function DCACard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "blue" | "green";
}) {
  const styles = {
    blue: {
      background: "rgba(0,152,234,0.08)",
      border: "1px solid rgba(0,152,234,0.3)",
      color: "#0098EA",
      boxShadow: "0 0 30px rgba(0,152,234,0.12)",
    },
    green: {
      background: "rgba(34,197,94,0.08)",
      border: "1px solid rgba(34,197,94,0.3)",
      color: "#22C55E",
      boxShadow: "0 0 20px rgba(34,197,94,0.1)",
    },
    none: {
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      color: "#fff",
      boxShadow: "none",
    },
  };
  const s = styles[accent ?? "none"];

  return (
    <div
      className="rounded-2xl p-2.5 sm:p-4 min-w-0 overflow-hidden"
      style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", ...s }}
    >
      <p
        className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest mb-1.5"
        style={{ color: "rgba(255,255,255,0.35)" }}
      >
        {label}
      </p>
      <p
        className="text-sm sm:text-lg font-black whitespace-nowrap leading-tight"
        style={{ color: s.color }}
      >
        {value}
      </p>
      {sub && (
        <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
          {sub}
        </p>
      )}
    </div>
  );
}
