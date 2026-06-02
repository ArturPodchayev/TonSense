"use client";

import { useEffect, useState } from "react";
import { TOKENS } from "@/lib/tokens";

// Build a lookup: contract_address → symbol
const ADDR_TO_SYMBOL = new Map(TOKENS.map(t => [t.contract_address, t.symbol]));

interface RawPool {
  token0_address: string;
  token1_address: string;
  lp_total_supply_usd: string;
  apy_1d: string;
  apy_7d: string;
  apy_30d: string;
}

interface PoolRow {
  sym0: string;
  sym1: string;
  tvlUsd: number;
  apy: string;
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
  return `${(n * 100).toFixed(1)}%`;  // API returns decimal (0.206 = 20.6%)
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
  const [pools, setPools] = useState<PoolRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://api.ston.fi/v1/pools")
      .then(r => r.json())
      .then((data: unknown) => {
        const obj = data as Record<string, unknown>;
        const list = (Array.isArray(data) ? data : (obj.pool_list ?? obj.pools ?? [])) as RawPool[];
        const rows: PoolRow[] = list
          .map(p => ({
            sym0:   ADDR_TO_SYMBOL.get(p.token0_address) ?? "",
            sym1:   ADDR_TO_SYMBOL.get(p.token1_address) ?? "",
            tvlUsd: parseFloat(p.lp_total_supply_usd),
            apy:    fmtApy(p.apy_30d || p.apy_7d || p.apy_1d),
          }))
          .filter(r => r.sym0 && r.sym1 && r.tvlUsd >= 10_000)
          .sort((a, b) => b.tvlUsd - a.tvlUsd)
          .slice(0, 5);
        setPools(rows);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
            {pool.sym0} / {pool.sym1}
          </span>
          <span
            className="text-xs font-medium text-right"
            style={{ color: "rgba(255,255,255,0.45)", width: 72 }}
          >
            {fmtTvl(pool.tvlUsd)}
          </span>
          <span
            className="text-xs font-semibold text-right"
            style={{ color: "#22C55E", width: 64 }}
          >
            {pool.apy}
          </span>
          <div style={{ width: 66, display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => onSwapPair?.(pool.sym0, pool.sym1)}
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
