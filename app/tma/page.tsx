"use client";

import { useState } from "react";
import LiveStats from "@/components/LiveStats";
import WhatIfCalculator from "@/components/WhatIfCalculator";
import FutureROICalculator from "@/components/FutureROICalculator";
import AgentChat from "@/components/AgentChat";
import Profile from "@/components/Profile";
import DCACalculator from "@/components/DCACalculator";

type Tab = "future" | "whatif" | "agent" | "dca" | "profile";

const NAV_ITEMS: { tab: Tab; icon: string; label: string }[] = [
  { tab: "future",  icon: "📈", label: "Dashboard" },
  { tab: "whatif",  icon: "🕐", label: "What If"   },
  { tab: "agent",   icon: "🤖", label: "AI Agent"  },
  { tab: "dca",     icon: "📅", label: "DCA"        },
  { tab: "profile", icon: "👤", label: "Profile"   },
];

export default function TmaPage() {
  const [activeTab, setActiveTab] = useState<Tab>("future");

  return (
    // 100dvh tracks Telegram's dynamic viewport correctly on iOS/Android
    <div className="min-h-[100dvh] bg-[#080810]">
      <div className="max-w-2xl mx-auto px-4 py-5 pb-24">

        {/* Header — compact for mobile Telegram viewport */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="TonSense" className="w-7 h-7 object-contain" />
              <span className="text-xl font-black tracking-tight text-white">
                Ton<span className="text-[#0098EA]">Sense</span>
              </span>
            </div>
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
              TonSenseAI
            </div>
          </div>
        </div>

        <LiveStats />

        <div className="mt-6">
          {activeTab === "future"  ? <FutureROICalculator /> :
           activeTab === "whatif"  ? <WhatIfCalculator />    :
           activeTab === "agent"   ? <AgentChat />           :
           activeTab === "dca"     ? <DCACalculator />       :
           <Profile />}
        </div>
      </div>

      {/* Bottom Nav — uses safe-area-inset-bottom for iPhone home bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          background: "rgba(8,8,16,0.90)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        }}
      >
        <div className="max-w-2xl mx-auto flex pt-2">
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
                  style={{ background: "#0098EA", opacity: active ? 1 : 0 }}
                />
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
