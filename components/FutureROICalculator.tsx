"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { fetchStakingAPY, fetchTonPrice } from "@/lib/api";
import AIAnalysis from "@/components/AIAnalysis";

const PERIOD_OPTIONS = [
  { label: "1 month", months: 1, color: "#0098EA" },
  { label: "3 months", months: 3, color: "#22C55E" },
  { label: "6 months", months: 6, color: "#F59E0B" },
  { label: "12 months", months: 12, color: "#A855F7" },
];

interface ForecastRow {
  label: string;
  months: number;
  initial: number;
  earnedTON: number;
  earnedUSDT: number;
  total: number;
}

function buildChartData(
  tonAmount: number,
  currentPrice: number,
  apyDecimal: number,
  selectedMonths: number[],
  inTON: boolean
): Record<string, number | string>[] {
  const maxMonths = Math.max(...selectedMonths);
  const points = maxMonths * 4;
  const holdingValue = inTON ? tonAmount : tonAmount * currentPrice;

  return Array.from({ length: points + 1 }, (_, i) => {
    const t = i / 4;
    const row: Record<string, number | string> = {
      month: t === 0 ? "Now" : `${t.toFixed(1)}m`,
      holding: holdingValue,
    };
    for (const m of selectedMonths) {
      if (t <= m) {
        const stakedTON = tonAmount * (1 + apyDecimal * (t / 12));
        row[`${m}mo`] = parseFloat(
          (inTON ? stakedTON : stakedTON * currentPrice).toFixed(2)
        );
      }
    }
    return row;
  });
}

const glass = {
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
} as const;

const fmt2 = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function FutureROICalculator() {
  const [amount, setAmount] = useState<string>("");
  const [selectedPeriods, setSelectedPeriods] = useState<number[]>([1, 3, 12]);
  const [showResults, setShowResults] = useState(false);
  const [apy, setApy] = useState<number>(4.2);
  const [currentPrice, setCurrentPrice] = useState<number>(1.33);
  const [change24h, setChange24h] = useState<number>(0);
  const [inTON, setInTON] = useState(false);

  useEffect(() => {
    Promise.all([fetchStakingAPY(), fetchTonPrice()]).then(([apyVal, priceData]) => {
      setApy(apyVal);
      setCurrentPrice(priceData.price);
      setChange24h(priceData.change24h);
    });
  }, []);

  function togglePeriod(months: number) {
    setSelectedPeriods((prev) =>
      prev.includes(months)
        ? prev.length > 1
          ? prev.filter((m) => m !== months)
          : prev
        : [...prev, months]
    );
    setShowResults(false);
  }

  const ton = parseFloat(amount);
  const isValid = ton > 0 && !isNaN(ton);
  const apyDecimal = apy / 100;

  const forecastRows: ForecastRow[] = PERIOD_OPTIONS.filter((p) =>
    selectedPeriods.includes(p.months)
  ).map((p) => {
    const earnedTON = ton * apyDecimal * (p.months / 12);
    const totalTON = ton + earnedTON;
    return {
      label: p.label,
      months: p.months,
      initial: ton * currentPrice,
      earnedTON,
      earnedUSDT: earnedTON * currentPrice,
      total: totalTON * currentPrice,
    };
  });

  const chartData =
    isValid && showResults
      ? buildChartData(ton, currentPrice, apyDecimal, selectedPeriods, inTON)
      : [];

  return (
    <div className="space-y-4">
      {/* Input card */}
      <div className="rounded-2xl p-6 space-y-5" style={glass}>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
            TON Amount to Stake
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setShowResults(false);
            }}
            placeholder="e.g. 5000"
            className="w-full rounded-xl px-4 py-3 text-white text-sm font-medium transition-all outline-none placeholder:text-white/20"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            onFocus={(e) => (e.currentTarget.style.boxShadow = "0 0 0 2px rgba(0,152,234,0.35)")}
            onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
            Forecast Periods
          </label>
          <div className="flex flex-wrap gap-2">
            {PERIOD_OPTIONS.map((p) => {
              const active = selectedPeriods.includes(p.months);
              return (
                <button
                  key={p.months}
                  onClick={() => togglePeriod(p.months)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={
                    active
                      ? {
                          backgroundColor: p.color + "18",
                          border: `1px solid ${p.color}50`,
                          color: p.color,
                          boxShadow: `0 2px 12px ${p.color}20`,
                        }
                      : {
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: "rgba(255,255,255,0.4)",
                        }
                  }
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: active ? p.color : "rgba(255,255,255,0.25)" }}
                  />
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
            Current APY
          </span>
          <span className="text-base font-bold" style={{ color: "#22C55E" }}>
            {apy.toFixed(1)}%
          </span>
        </div>

        <button
          onClick={() => setShowResults(true)}
          disabled={!isValid}
          className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: "linear-gradient(135deg, #0098EA 0%, #0077BB 100%)",
            boxShadow: "0 4px 30px rgba(0,152,234,0.35)",
          }}
          onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.transform = "scale(1.01)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          Show Forecast
        </button>
      </div>

      {/* Results */}
      {showResults && isValid && (
        <div className="space-y-4">
          {/* Chart */}
          <div className="rounded-2xl p-5" style={glass}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>
                Portfolio Value Over Time ({inTON ? "TON" : "USDT"})
              </p>
              <div
                className="flex p-0.5 rounded-lg text-xs font-semibold"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                {[false, true].map((isTon) => (
                  <button
                    key={String(isTon)}
                    onClick={() => setInTON(isTon)}
                    className="px-3 py-1 rounded-md transition-all duration-150"
                    style={
                      inTON === isTon
                        ? { background: "linear-gradient(135deg, #0098EA, #0077BB)", color: "#fff" }
                        : { color: "rgba(255,255,255,0.4)" }
                    }
                  >
                    {isTon ? "TON" : "USDT"}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.max(1, Math.floor(chartData.length / 8))}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) =>
                    inTON ? `${(v as number).toLocaleString()} TON` : `$${(v as number).toLocaleString()}`
                  }
                  width={inTON ? 80 : 68}
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
                    inTON
                      ? `${Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TON`
                      : `$${Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    name as string,
                  ]}
                  labelStyle={{ color: "rgba(255,255,255,0.45)" }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: "rgba(255,255,255,0.4)", paddingTop: 8 }} />
                <Line
                  type="monotone"
                  dataKey="holding"
                  name="Just Holding"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={{ r: 3 }}
                />
                {PERIOD_OPTIONS.filter((p) => selectedPeriods.includes(p.months)).map((p) => (
                  <Line
                    key={p.months}
                    type="monotone"
                    dataKey={`${p.months}mo`}
                    name={p.label}
                    stroke={p.color}
                    strokeWidth={2.5}
                    dot={false}
                    connectNulls={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* AI Analysis */}
          <AIAnalysis
            tonPrice={currentPrice}
            change24h={change24h}
            apy={apy}
            userAmount={ton}
            mode="future"
          />

          {/* Table */}
          <div className="rounded-2xl overflow-hidden" style={glass}>
            <div className="grid grid-cols-5 px-5 py-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <span>Period</span>
              <span className="text-right">Initial</span>
              <span className="text-right">Earned (TON)</span>
              <span className="text-right">Earned (USDT)</span>
              <span className="text-right">Total</span>
            </div>
            {forecastRows.map((row, i) => {
              const color = PERIOD_OPTIONS.find((p) => p.months === row.months)?.color ?? "#fff";
              return (
                <div
                  key={row.months}
                  className="grid grid-cols-5 px-5 py-4 text-sm"
                  style={i < forecastRows.length - 1 ? { borderBottom: "1px solid rgba(255,255,255,0.05)" } : {}}
                >
                  <span className="font-semibold" style={{ color }}>{row.label}</span>
                  <span className="text-right" style={{ color: "rgba(255,255,255,0.45)" }}>
                    ${fmt2(row.initial)}
                  </span>
                  <span className="text-right text-white">+{row.earnedTON.toFixed(2)}</span>
                  <span className="text-right" style={{ color: "#22C55E" }}>
                    +${fmt2(row.earnedUSDT)}
                  </span>
                  <span className="text-right font-bold text-white">${fmt2(row.total)}</span>
                </div>
              );
            })}
          </div>

          {/* Ston.fi CTA */}
          <a
            href="https://t.me/stonfiFAQbot/trade?startapp=swap-TON-EQC98_qAmNEptUtPc7W6xdHh_ZHrBUFpw5Ft_IzNU20QAJav"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.01]"
            style={{
              background: "linear-gradient(135deg, rgba(0,152,234,0.15), rgba(0,152,234,0.05))",
              border: "1px solid rgba(0,152,234,0.3)",
              color: "#0098EA",
            }}
          >
            ⚡ Swap TON → tsTON on Ston.fi →
          </a>
        </div>
      )}
    </div>
  );
}
