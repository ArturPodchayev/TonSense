"use client";

import { useState } from "react";
import LiveStats from "@/components/LiveStats";
import WhatIfCalculator from "@/components/WhatIfCalculator";
import FutureROICalculator from "@/components/FutureROICalculator";
import WalletButton from "@/components/WalletButton";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"whatif" | "future">("whatif");

  return (
    <div className="min-h-screen bg-[#080810]">
      <div className="max-w-2xl w-full mx-auto px-3 sm:px-4 py-12">

        {/* Header */}
        <div className="relative mb-8 text-center">
          {/* Desktop wallet button */}
          <div className="hidden md:block absolute right-0 top-0">
            <WalletButton />
          </div>
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-3">
            <img src="/logo.png" alt="TonSense" className="w-10 h-10 object-contain" />
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Ton<span className="text-[#0098EA]">Sense</span>
            </span>
          </div>

          {/* AI badge */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                background: "rgba(0,152,234,0.15)",
                border: "1px solid rgba(0,152,234,0.3)",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full bg-[#0098EA] animate-pulse"
                style={{ boxShadow: "0 0 6px rgba(0,152,234,0.8)" }}
              />
              Powered by AI • Live Data
            </div>
          </div>

          <p className="text-lg" style={{ color: "rgba(255,255,255,0.4)" }}>
            See what you missed. Plan what&apos;s next.
          </p>

          {/* Mobile wallet button */}
          <div className="md:hidden mt-4 flex justify-center">
            <WalletButton />
          </div>
        </div>

        {/* Live Stats */}
        <LiveStats />

        {/* Tab Switcher */}
        <div
          className="flex mt-8 mb-8 p-1 rounded-2xl"
          style={{
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {(["whatif", "future"] as const).map((tab) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 py-2 sm:py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={
                  active
                    ? {
                        background: "linear-gradient(135deg, #0098EA, #0077BB)",
                        boxShadow: "0 4px 20px rgba(0,152,234,0.35)",
                        color: "#fff",
                      }
                    : { color: "rgba(255,255,255,0.4)" }
                }
              >
                {tab === "whatif" ? "What If" : "Future ROI"}
              </button>
            );
          })}
        </div>

        {/* Calculator */}
        {activeTab === "whatif" ? <WhatIfCalculator /> : <FutureROICalculator />}
      </div>
    </div>
  );
}
