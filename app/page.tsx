"use client";

import { useState } from "react";
import LiveStats from "@/components/LiveStats";
import WhatIfCalculator from "@/components/WhatIfCalculator";
import FutureROICalculator from "@/components/FutureROICalculator";
import WalletButton from "@/components/WalletButton";
import AgentChat from "@/components/AgentChat";
import Profile from "@/components/Profile";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"whatif" | "future" | "agent" | "profile">("whatif");

  return (
    <div className="min-h-screen bg-[#080810]">
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10">

        {/* Header */}
        <div className="mb-8">
          {/* Top row: logo left, wallet right */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <img src="/logo.png" alt="TonSense" className="w-7 h-7 sm:w-9 sm:h-9 object-contain" />
              <span className="text-xl sm:text-3xl font-black tracking-tight text-white">
                Ton<span className="text-[#0098EA]">Sense</span>
              </span>
            </div>
            <WalletButton />
          </div>

          {/* Center: badge + tagline */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
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
                Powered by TonSenseAI
              </div>
            </div>
            <p className="text-lg" style={{ color: "rgba(255,255,255,0.4)" }}>
              See what you missed. Plan what&apos;s next.
            </p>
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
          {(["whatif", "future", "agent", "profile"] as const).map((tab) => {
            const active = activeTab === tab;
            const label =
              tab === "whatif" ? "What If" :
              tab === "future" ? "Future ROI" :
              tab === "agent" ? "🤖 AI" :
              "👤 Profile";
            const activeStyle =
              tab === "agent"
                ? { background: "linear-gradient(135deg, #7C3AED, #0098EA)", boxShadow: "0 4px 20px rgba(124,58,237,0.35)", color: "#fff" }
                : { background: "linear-gradient(135deg, #0098EA, #0077BB)", boxShadow: "0 4px 20px rgba(0,152,234,0.35)", color: "#fff" };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200"
                style={active ? activeStyle : { color: "rgba(255,255,255,0.4)" }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {activeTab === "whatif" ? <WhatIfCalculator /> :
         activeTab === "future" ? <FutureROICalculator /> :
         activeTab === "agent" ? <AgentChat /> :
         <Profile />}
      </div>
    </div>
  );
}
