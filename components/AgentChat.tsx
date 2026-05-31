"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { fetchTonPrice, fetchStakingAPY } from "@/lib/api";
import { useTonBalance } from "@/hooks/useTonBalance";
import { useTonAddress } from "@tonconnect/ui-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Should I stake my TON right now?",
  "What is tsTON and how does it work?",
  "Compare Tonstakers vs DeDust yields",
];

const glass = {
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
} as const;

export default function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [tonPrice, setTonPrice] = useState<number>(3.24);
  const [change24h, setChange24h] = useState<number>(0);
  const [apy, setApy] = useState<number | null>(null);
  const walletBalance = useTonBalance();
  const walletAddress = useTonAddress();
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    Promise.allSettled([fetchTonPrice(), fetchStakingAPY()]).then(([priceData, apyVal]) => {
      if (priceData.status === "fulfilled") {
        setTonPrice(priceData.value.price);
        setChange24h(priceData.value.change24h);
      }
      if (apyVal.status === "fulfilled") {
        setApy(apyVal.value.apy);
      } else {
        setApy(null);
      }
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: "user", content: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setLoading(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next,
          context: { tonPrice, change24h, apy, walletBalance, walletAddress },
        }),
      });
      const data = await res.json();
      setMessages([...next, { role: "assistant", content: data.message }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading, tonPrice, change24h, apy, walletBalance, walletAddress]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  const isPositive = change24h >= 0;
  const hasMessages = messages.length > 0;

  return (
    <div className="space-y-4">
      {/* Context badges */}
      <div className="flex flex-wrap gap-2">
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: "rgba(0,152,234,0.1)", border: "1px solid rgba(0,152,234,0.2)", color: "#0098EA" }}
        >
          TON ${tonPrice.toFixed(4)}
          <span style={{ color: isPositive ? "#22C55E" : "#EF4444" }}>
            {isPositive ? "▲" : "▼"}{Math.abs(change24h).toFixed(2)}%
          </span>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#22C55E" }}
        >
          APY {apy === null ? "—" : `${apy.toFixed(1)}%`}
        </div>
        {walletBalance != null && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", color: "#A78BFA" }}
          >
            {walletBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TON
          </div>
        )}
      </div>

      {/* Chat window */}
      <div className="rounded-2xl overflow-hidden" style={glass}>
        <div className="h-[420px] overflow-y-auto p-4 space-y-4 flex flex-col">

          {/* Empty state */}
          {!hasMessages && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-6">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden"
                style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(0,152,234,0.2))", border: "1px solid rgba(124,58,237,0.3)" }}
              >
                <Image src="/logo.png" alt="TonSense" width={48} height={48} style={{ borderRadius: 14 }} unoptimized />
              </div>
              <div>
                <p className="text-sm font-semibold text-white mb-1">TonSenseAI Agent</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Ask anything about TON DeFi, staking, or your portfolio</p>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 overflow-hidden"
                  style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(0,152,234,0.3))", border: "1px solid rgba(124,58,237,0.3)" }}
                >
                  <Image src="/logo.png" alt="TonSense" width={28} height={28} style={{ borderRadius: 10 }} unoptimized />
                </div>
              )}
              <div
                className="max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
                style={
                  msg.role === "user"
                    ? { background: "linear-gradient(135deg, #0098EA, #0077BB)", color: "#fff", borderBottomRightRadius: 6 }
                    : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.9)", borderBottomLeftRadius: 6 }
                }
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex gap-2.5 justify-start">
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 overflow-hidden"
                style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(0,152,234,0.3))", border: "1px solid rgba(124,58,237,0.3)" }}
              >
                <Image src="/logo.png" alt="TonSense" width={28} height={28} style={{ borderRadius: 10 }} unoptimized />
              </div>
              <div
                className="px-4 py-3 rounded-2xl flex items-center gap-1"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderBottomLeftRadius: 6 }}
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Suggestions — always visible, horizontal scroll */}
        <div className="px-3 pt-2 pb-1 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all hover:scale-[1.02]"
              style={{
                background: "rgba(0,152,234,0.08)",
                border: "1px solid rgba(0,152,234,0.2)",
                color: "rgba(255,255,255,0.6)",
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input */}
        <div
          className="px-3 pb-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div
            className="flex items-end gap-2 mt-3 px-3 py-2 rounded-xl"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask about TON DeFi…"
              rows={1}
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 outline-none resize-none leading-relaxed"
              style={{ maxHeight: 120 }}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30"
              style={{ background: "linear-gradient(135deg, #7C3AED, #0098EA)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <p className="text-[10px] mt-1.5 text-center" style={{ color: "rgba(255,255,255,0.2)" }}>
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
