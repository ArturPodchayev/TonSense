"use client";

import { useState } from "react";
import Image from "next/image";
import LiveStats from "@/components/LiveStats";
import WhatIfCalculator from "@/components/WhatIfCalculator";
import FutureROICalculator from "@/components/FutureROICalculator";
import WalletButton from "@/components/WalletButton";
import AgentChat from "@/components/AgentChat";
import Profile from "@/components/Profile";
import DCACalculator from "@/components/DCACalculator";
import SwapCalculator from "@/components/SwapCalculator";
import OnboardingModal from "@/components/OnboardingModal";

type Tab = "future" | "whatif" | "agent" | "swap" | "dca" | "profile";

const NAV_ITEMS: { tab: Tab; icon: string; label: string }[] = [
  { tab: "future",  icon: "📈", label: "Dashboard" },
  { tab: "whatif",  icon: "🕐", label: "What If"   },
  { tab: "agent",   icon: "🤖", label: "AI Agent"  },
  { tab: "swap",    icon: "⚡", label: "Swap"       },
  { tab: "dca",     icon: "📅", label: "DCA"        },
  { tab: "profile", icon: "👤", label: "Profile"   },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("future");
  const [swapPrefill, setSwapPrefill] = useState<{ fromSymbol: string; toSymbol: string; amount: string } | null>(null);

  return (
    <div className="min-h-screen bg-[#080810]">
      <OnboardingModal />
      <div className="max-w-2xl mx-auto px-4 pt-6 sm:pt-10 pb-24">

        {/* Header */}
        <div className="mb-8">
          {/* Top row: logo left, wallet right */}
          <div className="flex items-center justify-between mb-4 overflow-hidden">
            {/* Left: logo */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <Image src="/logo.png" alt="TonSense" width={36} height={36} style={{ borderRadius: "8px" }} unoptimized />
              <span className="text-xl sm:text-3xl font-black tracking-tight text-white">
                Ton<span className="text-[#0098EA]">Sense</span>
              </span>
            </div>
            {/* Right: wallet + icons */}
            <div className="flex items-center gap-1.5 min-w-0">
              <WalletButton />
              <a
                href="https://t.me/TonSense_official"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 flex items-center justify-center transition-colors"
                style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.6)",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.19 13.913l-2.965-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.963.646z"/>
                </svg>
              </a>
              <a
                href="https://t.me/+ls8wv93nO9swYjli"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 flex items-center justify-center transition-colors"
                style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.6)",
                  fontWeight: 700, fontSize: 14,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
              >
                ?
              </a>
            </div>
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

        {/* Content */}
        <div className="mt-8">
          {activeTab === "future"  ? <FutureROICalculator /> :
           activeTab === "whatif"  ? <WhatIfCalculator />    :
           activeTab === "agent"   ? (
             <AgentChat onSwapRequest={(from, to, amount) => {
               setSwapPrefill({ fromSymbol: from, toSymbol: to, amount: String(amount) });
               setActiveTab("swap");
             }} />
           ) :
           activeTab === "swap"    ? (
             <SwapCalculator prefill={swapPrefill} onPrefillConsumed={() => setSwapPrefill(null)} />
           ) :
           activeTab === "dca"     ? <DCACalculator />       :
           <Profile />}
        </div>
      </div>

      {/* Bottom Nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          background: "rgba(8,8,16,0.85)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="max-w-2xl mx-auto flex pb-4 pt-2">
          {NAV_ITEMS.map(({ tab, icon, label }) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 flex flex-col items-center gap-0.5 py-1 transition-colors duration-200"
              >
                <span className="text-xl leading-none">{icon}</span>
                <span
                  className="text-[10px] font-medium leading-none"
                  style={{ color: active ? "#0098EA" : "rgba(255,255,255,0.35)" }}
                >
                  {label}
                </span>
                <span
                  className="w-1 h-1 rounded-full mt-0.5 transition-opacity duration-200"
                  style={{
                    background: "#0098EA",
                    opacity: active ? 1 : 0,
                  }}
                />
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
