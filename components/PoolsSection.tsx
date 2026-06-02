"use client";

import { useEffect, useState } from "react";

interface Pool {
  token0_symbol: string;
  token1_symbol: string;
  lp_total_supply_usd: string;
  apy_1d: string;
  apy_7d: string;
  apy_30d: string;
}

interface Props {
  onSwapPair?: (fromSymbol: string, toSymbol: string) => void;
}

function fmtTvl(usd: number): string {
  if (usd >= 1_000_000_000) return `$${(usd / 1_000_000_000).toFixed(1)}B`;
  if (usd >= 1_000_000)     return `$${(usd / 1_000_000).toFixed(1)}M`;
  if (usd >= 1_000)         return `$${(usd / 1_000).toFixed(0)}K`;
  return `$${usd.toFixed(0)}`;
}

function fmtApy(val: string | undefined): string {
  if (!val) return "—";
  const n = parseFloat(val);
  if (!Number.isFinite(n) || n <= 0) return "—";
  return `${n.toFixed(2)}%`;
}

const glass = {
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
} as const;

const PULSE = { background: "rgba(255,255,255,0.07)" } as const;
const ROW_DIVIDER = { borderTop: "1px solid rgba(255,255,255,0.04)" } as const;

export default function PoolsSection({ onSwapPair }: Props) {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://api.ston.fi/v1/pools")
      .then(r => r.json())
      .then((data: unknown) => {
        const obj = data as Record<string, unknown>;
        const list = (Array.isArray(data) ? data : (obj.pool_list ?? obj.pools ?? [])) as Pool[];
        const filtered = list
          .filter(p => parseFloat(p.lp_total_supply_usd) >= 10_000)
          .sort((a, b) => parseFloat(b.lp_total_supply_usd) - parseFloat(a.lp_total_supply_usd))
          .slice(0, 8);
        setPools(filtered);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Silent fail — render nothing if fetch completed with no usable data
  if (!loading && pools.length === 0) return null;

  return (
    <div className="rounded-2xl overflow-hidden" style={glass}>

      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          Top STON.fi Pools
        </span>
        <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
          Powered by STON.fi
        </span>
      </div>

      {/* Column labels */}
      <div className="flex items-center px-4 pt-2.5 pb-1 gap-2">
        <span className="flex-1 text-[9px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.2)" }}>
          Pair
        </span>
        <span className="text-[9px] font-semibold uppercase tracking-widest text-right" style={{ color: "rgba(255,255,255,0.2)", width: 72 }}>
          TVL
        </span>
        <span className="text-[9px] font-semibold uppercase tracking-widest text-right" style={{ color: "rgba(255,255,255,0.2)", width: 64 }}>
          APY 30d
        </span>
        <span style={{ width: 66 }} />
      </div>

      {/* Skeleton */}
      {loading && [0, 1, 2].map(i => (
        <div key={i} className="flex items-center px-4 py-3 gap-2" style={ROW_DIVIDER}>
          <div className="flex-1 h-3.5 rounded-full animate-pulse" style={PULSE} />
          <div className="h-3.5 rounded-full animate-pulse" style={{ ...PULSE, width: 72 }} />
          <div className="h-3.5 rounded-full animate-pulse" style={{ ...PULSE, width: 64 }} />
          <div className="h-7 rounded-lg animate-pulse" style={{ ...PULSE, width: 66 }} />
        </div>
      ))}

      {/* Pool rows */}
      {!loading && pools.map((pool, i) => (
        <div key={i} className="flex items-center px-4 py-3 gap-2" style={ROW_DIVIDER}>
          <span className="flex-1 text-sm font-semibold text-white">
            {pool.token0_symbol} / {pool.token1_symbol}
          </span>
          <span
            className="text-xs font-medium text-right"
            style={{ color: "rgba(255,255,255,0.45)", width: 72 }}
          >
            {fmtTvl(parseFloat(pool.lp_total_supply_usd))}
          </span>
          <span
            className="text-xs font-semibold text-right"
            style={{ color: "#22C55E", width: 64 }}
          >
            {fmtApy(pool.apy_30d || pool.apy_7d || pool.apy_1d)}
          </span>
          <div style={{ width: 66, display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => onSwapPair?.(pool.token0_symbol, pool.token1_symbol)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all hover:scale-[1.04] active:scale-95"
              style={{
                background: "rgba(0,152,234,0.1)",
                border: "1px solid rgba(0,152,234,0.25)",
                color: "#0098EA",
              }}
            >
              Swap →
            </button>
          </div>
        </div>
      ))}

    </div>
  );
}
