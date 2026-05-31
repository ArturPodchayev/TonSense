"use client";

import { useState, useEffect, useRef } from "react";
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
import { useTonBalance } from "@/hooks/useTonBalance";
import AIAnalysis from "@/components/AIAnalysis";
import Toast from "@/components/Toast";
import TxButton from "@/components/TxButton";
import { buildStakeTx } from "@/lib/transactions";

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
      const tClamped = Math.min(t, m);
      const stakedTON = tonAmount * (1 + apyDecimal * (tClamped / 12));
      row[`${m}mo`] = parseFloat(
        (inTON ? stakedTON : stakedTON * currentPrice).toFixed(2)
      );
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
  const [debouncedAmount, setDebouncedAmount] = useState<string>("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedPeriods, setSelectedPeriods] = useState<number[]>([1, 3, 12]);
  const [periodHint, setPeriodHint] = useState(false);
  const walletBalance = useTonBalance();
  const [apy, setApy] = useState<number | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(1.33);
  const [change24h, setChange24h] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [inTON, setInTON] = useState(false);
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
      if (priceData.status === "fulfilled") {
        setCurrentPrice(priceData.value.price);
        setChange24h(priceData.value.change24h);
      }
      setIsLoading(false);
    });
  }, []);

  function togglePeriod(months: number) {
    if (!amount || parseFloat(amount) <= 0) {
      setPeriodHint(true);
      setTimeout(() => setPeriodHint(false), 3000);
      return;
    }
    setSelectedPeriods((prev) =>
      prev.includes(months)
        ? prev.length > 1
          ? prev.filter((m) => m !== months)
          : prev
        : [...prev, months]
    );
  }

  const ton = parseFloat(debouncedAmount);
  const isValid = ton > 0 && !isNaN(ton);
  const canProject = isValid && apy !== null;

  let forecastRows: ForecastRow[] = [];
  let chartData: Record<string, number | string>[] = [];

  if (canProject) {
    const apyDecimal = apy / 100;
    forecastRows = PERIOD_OPTIONS.filter((p) => selectedPeriods.includes(p.months)).map((p) => {
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
    chartData = buildChartData(ton, currentPrice, apyDecimal, selectedPeriods, inTON);
  }

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      {/* Input card */}
      <div className="rounded-2xl p-6 space-y-5" style={glass}>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            TON Amount to Stake
          </label>
          <p className="text-[11px] mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>
            Enter how many TON coins you want to earn rewards on
          </p>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 100 TON"
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
          <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            Forecast Periods
          </label>
          <p className="text-[11px] mb-3" style={{ color: "rgba(255,255,255,0.25)" }}>
            We&apos;ll calculate how much you&apos;d earn over this time period
          </p>
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
          {periodHint && (
            <p className="text-[11px] mt-2 px-3 py-2 rounded-lg" style={{ background: "rgba(0,152,234,0.08)", border: "1px solid rgba(0,152,234,0.2)", color: "rgba(0,152,234,0.8)" }}>
              Enter your TON amount above to see results
            </p>
          )}
        </div>

        <div
          className="flex items-center justify-between rounded-xl px-4 py-3"
          style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}
        >
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
              Current APY
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" }}>
              Annual Percentage Yield — your yearly earnings rate
            </span>
          </div>
          {isLoading ? (
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
            <div className="overflow-x-auto">
              <div className="min-w-full">
                <div className="grid grid-cols-3 sm:grid-cols-5 px-4 sm:px-5 py-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <span>Period</span>
                  <span className="text-right hidden sm:block">Initial</span>
                  <span className="text-right hidden sm:block">Earned (TON)</span>
                  <span className="text-right">Earned (USDT)</span>
                  <span className="text-right">Total</span>
                </div>
                {forecastRows.map((row, i) => {
                  const color = PERIOD_OPTIONS.find((p) => p.months === row.months)?.color ?? "#fff";
                  return (
                    <div
                      key={row.months}
                      className="grid grid-cols-3 sm:grid-cols-5 px-4 sm:px-5 py-4"
                      style={i < forecastRows.length - 1 ? { borderBottom: "1px solid rgba(255,255,255,0.05)" } : {}}
                    >
                      <span className="text-xs sm:text-sm font-semibold" style={{ color }}>{row.label}</span>
                      <span className="text-right text-xs sm:text-sm hidden sm:block" style={{ color: "rgba(255,255,255,0.45)" }}>
                        ${fmt2(row.initial)}
                      </span>
                      <span className="text-right text-xs sm:text-sm text-white hidden sm:block">+{row.earnedTON.toFixed(2)}</span>
                      <span className="text-right text-xs sm:text-sm" style={{ color: "#22C55E" }}>
                        +${fmt2(row.earnedUSDT)}
                      </span>
                      <span className="text-right text-xs sm:text-sm font-bold text-white">${fmt2(row.total)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <TxButton
              label="💎 Stake on Tonstakers"
              amountTon={ton}
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
        </div>
      )}
    </div>
  );
}
