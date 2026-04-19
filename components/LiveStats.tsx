"use client";

import { useEffect, useState } from "react";
import { fetchTonPrice, fetchStakingAPY } from "@/lib/api";

export default function LiveStats() {
  const [price, setPrice] = useState<number | null>(null);
  const [change24h, setChange24h] = useState<number>(0);
  const [apy, setApy] = useState<number | null>(null);

  async function refresh() {
    const [priceData, apyValue] = await Promise.all([
      fetchTonPrice(),
      fetchStakingAPY(),
    ]);
    setPrice(priceData.price);
    setChange24h(priceData.change24h);
    setApy(apyValue);
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
  }, []);

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
      <div className="grid grid-cols-3">

        {/* TON Price */}
        <div className="px-5 py-5">
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
              <p className="text-3xl font-black text-white leading-none mb-2">
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

        {/* Divider */}
        <div className="relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-10" style={{ background: "rgba(255,255,255,0.1)" }} />

          {/* Staking APY */}
          <div className="px-5 py-5">
            <p className="text-[10px] font-semibold tracking-widest uppercase mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
              Staking APY
            </p>
            {apy === null ? (
              <div className="space-y-2">
                <div className="h-7 w-16 rounded-md bg-white/10 animate-pulse" />
                <div className="h-4 w-20 rounded-md bg-white/10 animate-pulse" />
              </div>
            ) : (
              <>
                <p className="text-3xl font-black leading-none mb-2" style={{ color: "#22C55E" }}>
                  {apy.toFixed(1)}%
                </p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>tsTON annual</p>
              </>
            )}
          </div>
        </div>

        {/* Divider + Network */}
        <div className="relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-10" style={{ background: "rgba(255,255,255,0.1)" }} />
          <div className="px-5 py-5">
            <p className="text-[10px] font-semibold tracking-widest uppercase mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
              Network
            </p>
            <p className="text-3xl font-black text-white leading-none mb-2">TON</p>
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
    </div>
  );
}
