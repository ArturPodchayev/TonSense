"use client";

import { useState, useEffect, useCallback } from "react";

const AVATAR_EMOJIS = ['🦁','🐯','🦊','🐺','🦝','🐻','🐼','🦄','🐲','🦅','🦋','🐬','🦈','🦍','🤖','👾','🛸','⚡','🔥','🌊','🎯','💀','🎭','🧠','👁️'];

function getWalletEmoji(address: string): string {
  if (!address) return '👤';
  const code = address.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_EMOJIS[code % AVATAR_EMOJIS.length];
}
import { TonConnectButton, useTonAddress } from "@tonconnect/ui-react";
import { useTonBalance } from "@/hooks/useTonBalance";
import { fetchTonPrice, fetchStakingAPY } from "@/lib/api";

const glass = {
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
} as const;

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function timeAgo(timestamp: number) {
  const s = Math.floor(Date.now() / 1000 - timestamp);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

interface TxEvent {
  event_id: string;
  timestamp: number;
  actions: Array<{
    type: string;
    simple_preview?: { description: string; value?: string };
  }>;
}

export default function Profile() {
  const [mounted, setMounted] = useState(false);
  const address = useTonAddress();
  const balance = useTonBalance();
  const [tonPrice, setTonPrice] = useState(3.24);
  const [apy, setApy] = useState(18.7);
  const [txs, setTxs] = useState<TxEvent[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [firstSeen, setFirstSeen] = useState<string | null>(null);
  const [calcCount, setCalcCount] = useState(0);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    Promise.all([fetchTonPrice(), fetchStakingAPY()]).then(([p, a]) => {
      setTonPrice(p.price);
      setApy(a);
    });
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const seen = localStorage.getItem("tonsense_first_seen");
    if (seen) {
      setFirstSeen(new Date(parseInt(seen)).toLocaleDateString("en-US", { month: "short", year: "numeric" }));
    }
    setCalcCount(parseInt(localStorage.getItem("tonsense_calc_count") ?? "0"));
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !address) return;
    if (!localStorage.getItem("tonsense_first_seen")) {
      localStorage.setItem("tonsense_first_seen", Date.now().toString());
      setFirstSeen(new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }));
    }
  }, [mounted, address]);

  useEffect(() => {
    if (!address) { setTxs([]); return; }
    setTxLoading(true);
    fetch(`https://tonapi.io/v2/accounts/${address}/events?limit=5`)
      .then(r => r.json())
      .then(d => setTxs(d.events ?? []))
      .catch(() => setTxs([]))
      .finally(() => setTxLoading(false));
  }, [address]);

  const copyAddress = useCallback(async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [address]);

  if (!mounted) return null;

  const usdtValue = balance != null ? balance * tonPrice : null;
  const fmt2 = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (!address) {
    return (
      <div className="rounded-2xl p-10 flex flex-col items-center gap-5 text-center" style={glass}>
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
          style={{ background: "rgba(0,152,234,0.1)", border: "1px solid rgba(0,152,234,0.2)", boxShadow: "0 0 30px rgba(0,152,234,0.15)" }}
        >
          👤
        </div>
        <div>
          <p className="text-white font-semibold mb-1">Connect your wallet to view profile</p>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            See your balance, transactions, and portfolio overview
          </p>
        </div>
        <TonConnectButton />
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* 1. Wallet Identity Card */}
      <div className="rounded-2xl p-5" style={glass}>
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{
              background: "rgba(0,152,234,0.12)",
              border: "1px solid rgba(0,152,234,0.3)",
              boxShadow: "0 0 24px rgba(0,152,234,0.25)",
            }}
          >
            {getWalletEmoji(address)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-white font-bold text-sm sm:text-base truncate">{shortenAddress(address)}</p>
              <button
                onClick={copyAddress}
                className="flex-shrink-0 p-1 rounded-md transition-all"
                style={{
                  background: copied ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)",
                  border: `1px solid ${copied ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.1)"}`,
                }}
              >
                {copied ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse"
                style={{ boxShadow: "0 0 6px rgba(34,197,94,0.7)" }}
              />
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>TON Mainnet</span>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <p className="text-lg sm:text-xl font-black text-white leading-none mb-1">
              {balance != null ? fmt2(balance) : "—"} <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>TON</span>
            </p>
            {usdtValue != null && (
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>≈ ${fmt2(usdtValue)}</p>
            )}
          </div>
        </div>
      </div>

      {/* 2. Portfolio Overview */}
      <div className="rounded-2xl p-5 space-y-4" style={glass}>
        <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>
          Portfolio Overview
        </p>
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div>
            <p className="text-[9px] sm:text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
              TON Balance
            </p>
            <p className="text-sm sm:text-base font-black text-white">
              {balance != null ? fmt2(balance) : "—"}
            </p>
          </div>
          <div>
            <p className="text-[9px] sm:text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
              USDT Value
            </p>
            <p className="text-sm sm:text-base font-black" style={{ color: "#0098EA" }}>
              {usdtValue != null ? `$${fmt2(usdtValue)}` : "—"}
            </p>
          </div>
          <div>
            <p className="text-[9px] sm:text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
              tsTON APY
            </p>
            <p className="text-sm sm:text-base font-black" style={{ color: "#22C55E" }}>
              {apy.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Staked vs held bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>Staked</p>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>0%</p>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full w-0" style={{ background: "linear-gradient(90deg, #0098EA, #22C55E)" }} />
          </div>
          <p className="text-[10px] mt-1.5" style={{ color: "rgba(255,255,255,0.25)" }}>No active stakes yet</p>
        </div>
      </div>

      {/* 3. Transaction History */}
      <div className="rounded-2xl overflow-hidden" style={glass}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>
            Recent Transactions
          </p>
        </div>

        {txLoading ? (
          <div>
            {[1, 2, 3].map(i => (
              <div key={i} className="px-5 py-3.5 flex items-center gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div className="w-8 h-8 rounded-xl animate-pulse flex-shrink-0" style={{ background: "rgba(255,255,255,0.07)" }} />
                <div className="flex-1 space-y-2">
                  <div className="h-3 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.07)", width: "55%" }} />
                  <div className="h-2.5 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.05)", width: "30%" }} />
                </div>
                <div className="h-3 w-14 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.07)" }} />
              </div>
            ))}
          </div>
        ) : txs.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
            No transactions yet
          </div>
        ) : (
          <div>
            {txs.map((event, idx) => {
              const action = event.actions[0];
              if (!action) return null;
              const desc = action.simple_preview?.description ?? action.type;
              const value = action.simple_preview?.value;
              const isIn = desc.toLowerCase().startsWith("received");
              return (
                <div
                  key={event.event_id}
                  className="px-5 py-3.5 flex items-center gap-3"
                  style={idx < txs.length - 1 ? { borderBottom: "1px solid rgba(255,255,255,0.04)" } : {}}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 font-bold"
                    style={{
                      background: isIn ? "rgba(34,197,94,0.1)" : "rgba(0,152,234,0.1)",
                      border: `1px solid ${isIn ? "rgba(34,197,94,0.2)" : "rgba(0,152,234,0.2)"}`,
                      color: isIn ? "#22C55E" : "#0098EA",
                    }}
                  >
                    {isIn ? "↓" : "↑"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{desc}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{timeAgo(event.timestamp)}</p>
                  </div>
                  {value && (
                    <p
                      className="text-xs font-semibold flex-shrink-0"
                      style={{ color: isIn ? "#22C55E" : "rgba(255,255,255,0.6)" }}
                    >
                      {isIn ? "+" : ""}{value}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Account Stats */}
      <div className="rounded-2xl p-5" style={glass}>
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>
          Account Stats
        </p>
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div>
            <p className="text-[9px] sm:text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
              Member Since
            </p>
            <p className="text-sm font-bold text-white">{firstSeen ?? "—"}</p>
          </div>
          <div>
            <p className="text-[9px] sm:text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
              Calculations
            </p>
            <p className="text-sm font-bold text-white">{calcCount}</p>
          </div>
          <div>
            <p className="text-[9px] sm:text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
              Network
            </p>
            <p className="text-sm font-bold" style={{ color: "#22C55E" }}>Mainnet</p>
          </div>
        </div>
      </div>

      {/* 5. Support & Community */}
      <div className="rounded-2xl overflow-hidden" style={glass}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>
            Support &amp; Community
          </p>
        </div>
        {[
          { icon: "📢", label: "TonSense Channel",  url: "https://t.me/TonSense_official"        },
          { icon: "💬", label: "Support Chat",       url: "https://t.me/+ls8wv93nO9swYjli"       },
          { icon: "🤖", label: "Telegram Bot",       url: "https://t.me/Ton_Sense_bot"           },
        ].map(({ icon, label, url }, idx, arr) => (
          <button
            key={label}
            className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors"
            style={idx < arr.length - 1 ? { borderBottom: "1px solid rgba(255,255,255,0.04)" } : {}}
            onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <span style={{ fontSize: 18 }}>{icon}</span>
            <span className="flex-1 text-sm font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>{label}</span>
            <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 14 }}>›</span>
          </button>
        ))}
      </div>

    </div>
  );
}
