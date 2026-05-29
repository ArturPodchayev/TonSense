"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchTonPrice, fetchStakingAPY, type StakingApyData } from "@/lib/api";

function formatAgeLabel(asOf: string): string {
  const deltaMs = Date.now() - new Date(asOf).getTime();
  if (!Number.isFinite(deltaMs) || deltaMs < 0) return "Updated just now";
  const seconds = Math.floor(deltaMs / 1000);
  if (seconds < 60) return "Updated just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Updated ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `Updated ${hours}h ago`;
}

export default function LiveStats() {
  const [price, setPrice] = useState<number | null>(null);
  const [change24h, setChange24h] = useState<number>(0);
  const [apyData, setApyData] = useState<StakingApyData | null>(null);
  const [apyLoading, setApyLoading] = useState(true);
  const [apyError, setApyError] = useState<string | null>(null);

  const loadStats = useCallback((showApyLoading: boolean) => {
    Promise.allSettled([fetchTonPrice(), fetchStakingAPY()]).then(([priceData, apyResult]) => {
      if (priceData.status === "fulfilled") {
        setPrice(priceData.value.price);
        setChange24h(priceData.value.change24h);
      }

      if (apyResult.status === "fulfilled") {
        setApyData(apyResult.value);
        setApyError(null);
      } else {
        setApyData(null);
        setApyError(
          apyResult.reason instanceof Error ? apyResult.reason.message : "Unavailable"
        );
      }

      if (showApyLoading) {
        setApyLoading(false);
      }
    });
  }, []);

  const retryApy = useCallback(() => {
    setApyLoading(true);
    loadStats(true);
  }, [loadStats]);

  useEffect(() => {
    loadStats(true);
    const id = setInterval(() => loadStats(false), 60_000);
    return () => clearInterval(id);
  }, [loadStats]);

  const isPositive = change24h >= 0;

  return (
    <div
      className="rounded-2xl"
      style={{
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 0 60px rgba(0,152,234,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3">

        {/* TON Price */}
        <div className="px-3 py-2.5 sm:px-5 sm:py-4">
          <p className="text-[10px] font-semibold tracking-widest uppercase mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
            TON Price
          </p>
          {price === null ? (
            <div className="space-y-2">
              <div className="h-7 w-24 rounded-md bg-white/10 animate-pulse" />
              <div className="h-4 w-12 rounded-md bg-white/10 animate-pulse" />
            </div>
          ) : (
            <>
              <p className="text-xl sm:text-3xl font-black text-white leading-none mb-2">
                ${price.toFixed(4)}
              </p>
              <span
                className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: isPositive ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                  color: isPositive ? "#22C55E" : "#EF4444",
                  border: `1px solid ${isPositive ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
                }}
              >
                {isPositive ? "▲" : "▼"} {Math.abs(change24h).toFixed(2)}%
              </span>
            </>
          )}
        </div>

        {/* Staking APY */}
        <div className="relative px-3 py-2.5 sm:px-5 sm:py-4">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-10" style={{ background: "rgba(255,255,255,0.1)" }} />
          <p className="text-[10px] font-semibold tracking-widest uppercase mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
            Staking APY
          </p>
          {apyLoading ? (
            <div className="space-y-2">
              <div className="h-7 w-16 rounded-md bg-white/10 animate-pulse" />
              <div className="h-4 w-20 rounded-md bg-white/10 animate-pulse" />
            </div>
          ) : apyError || !apyData ? (
            <div className="space-y-2">
              <p className="text-lg sm:text-2xl font-black leading-none" style={{ color: "#F87171" }}>
                —
              </p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                APY unavailable
              </p>
              <button
                onClick={retryApy}
                className="text-[11px] font-semibold px-2 py-0.5 rounded-md transition-colors"
                style={{
                  color: "rgba(255,255,255,0.8)",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <p className="text-xl sm:text-3xl font-black leading-none mb-2" style={{ color: "#22C55E" }}>
                {apyData.apy.toFixed(1)}%
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                  tsTON annual
                </p>
                {apyData.source === "cache" && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{
                      color: "#FDE68A",
                      background: "rgba(253,230,138,0.08)",
                      border: "1px solid rgba(253,230,138,0.25)",
                    }}
                  >
                    Cached
                  </span>
                )}
              </div>
              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
                {formatAgeLabel(apyData.asOf)}
              </p>
            </>
          )}
        </div>

        {/* Network — hidden on mobile */}
        <div className="relative hidden sm:block px-5 py-4">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-10" style={{ background: "rgba(255,255,255,0.1)" }} />
          <p className="text-[10px] font-semibold tracking-widest uppercase mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
            Network
          </p>
          <p className="text-lg sm:text-3xl font-black text-white leading-none mb-2">TON</p>
          <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse"
              style={{ boxShadow: "0 0 6px rgba(34,197,94,0.7)" }}
            />
            Mainnet
          </span>
        </div>

      </div>
    </div>
  );
}
