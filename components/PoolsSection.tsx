"use client";

import { useEffect, useState } from "react";

interface PoolRow {
  sym0: string;
  sym1: string;
  tvlUsd: number;
  apy: string;
}

interface Props {
  onSwapPair?: (fromSymbol: string, toSymbol: string) => void;
}

let cache: PoolRow[] | null = null;

function fmtTvl(usd: number): string {
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
  if (usd >= 1_000)     return `$${(usd / 1_000).toFixed(0)}K`;
  return `$${usd.toFixed(0)}`;
}

function fmtApy(val: unknown): string {
  const n = parseFloat(String(val ?? ""));
  if (!Number.isFinite(n) || n <= 0) return "—";
  return n < 2 ? `${(n * 100).toFixed(1)}%` : `${n.toFixed(1)}%`;
}

export default function PoolsSection({ onSwapPair }: Props) {
  const [pools, setPools] = useState<PoolRow[] | null>(cache);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (cache !== null) return;

    fetch("/api/pools")
      .then(async r => {
        const data = await r.json() as Record<string, unknown>;
        if (!r.ok) throw new Error(String(data.error ?? `HTTP ${r.status}`));

        console.log("[PoolsSection] keys:", Object.keys(data));
        const list = (data.pool_list ?? []) as Record<string, unknown>[];
        console.log("[PoolsSection] first pool:", JSON.stringify((data.pool_list as Record<string, unknown>[])?.[0]));

        const mapped: PoolRow[] = list
          .map(p => ({
            sym0:   String(p.token0_symbol ?? ""),
            sym1:   String(p.token1_symbol ?? ""),
            tvlUsd: parseFloat(String(p.lp_total_supply_usd ?? "0")),
            apy:    fmtApy(p.apy_30d),
          }))
          .filter(r => r.sym0 && r.sym1 && r.tvlUsd > 50_000);

        const best = new Map<string, PoolRow>();
        for (const r of mapped) {
          const key = [r.sym0, r.sym1].sort().join("/");
          const prev = best.get(key);
          if (!prev || r.tvlUsd > prev.tvlUsd) best.set(key, r);
        }

        const rows = [...best.values()].sort((a, b) => b.tvlUsd - a.tvlUsd).slice(0, 5);
        cache = rows;
        setPools(rows);
      })
      .catch(err => {
        console.error("[PoolsSection] fetch failed:", err);
        setFetchError(String(err));
      });
  }, []);

  // Debug error state — visible red message
  if (fetchError) {
    return (
      <div className="rounded-2xl px-4 py-4" style={{ border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.06)" }}>
        <p className="text-xs font-semibold" style={{ color: "#EF4444" }}>Pools fetch failed: {fetchError}</p>
      </div>
    );
  }

  if (!pools || pools.length === 0) return null;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>
          Top STON.fi Pools
        </span>
        <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.18)" }}>
          Powered by STON.fi
        </span>
      </div>

      {/* Rows */}
      {pools.map((pool, i) => (
        <div
          key={i}
          className="flex items-center px-4 py-2.5 gap-3"
          style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : undefined }}
        >
          <span className="flex-1 text-sm font-semibold text-white">
            {pool.sym0} / {pool.sym1}
          </span>
          <span className="text-xs tabular-nums" style={{ color: "rgba(255,255,255,0.35)", minWidth: 52, textAlign: "right" }}>
            {fmtTvl(pool.tvlUsd)}
          </span>
          <span className="text-xs font-semibold tabular-nums" style={{ color: "#22C55E", minWidth: 52, textAlign: "right" }}>
            {pool.apy}
          </span>
          <button
            onClick={() => onSwapPair?.(pool.sym0, pool.sym1)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all hover:scale-[1.04] active:scale-95"
            style={{
              background: "rgba(0,152,234,0.1)",
              border: "1px solid rgba(0,152,234,0.22)",
              color: "#0098EA",
              whiteSpace: "nowrap",
            }}
          >
            Swap →
          </button>
        </div>
      ))}
    </div>
  );
}
