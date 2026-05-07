"use client";

import { useState } from "react";

const FAQS: { q: string; a: string }[] = [
  {
    q: "What is TON?",
    a: "TON (The Open Network) is a cryptocurrency built by the Telegram team. It's a digital currency you can hold, send, and earn rewards on — similar to putting money in a savings account.",
  },
  {
    q: "What is staking?",
    a: "Staking means putting your TON into a savings pool to earn rewards. You deposit TON, receive tsTON tokens in return, and those tokens grow in value over time. Current rate: ~4.2% APY. You can unstake anytime.",
  },
  {
    q: "What is tsTON?",
    a: "tsTON is a liquid staking token from Tonstakers. When you stake TON, you receive tsTON. It automatically grows in value as staking rewards accumulate. 1 tsTON = slightly more than 1 TON, and the ratio increases every day.",
  },
  {
    q: "What is APY?",
    a: "APY (Annual Percentage Yield) is your yearly earnings rate. 4.2% APY means if you stake 100 TON today, in one year you'll have approximately 104.2 TON. The rate updates in real time from Tonstakers.",
  },
  {
    q: "Is staking safe?",
    a: "Staking via Tonstakers is one of the most established protocols on TON. However, all crypto carries risk — smart contract risk, price volatility, and protocol risk. Never stake more than you can afford to lose.",
  },
  {
    q: "How do I connect my wallet?",
    a: "Click 'Connect Wallet' at the top of the screen. TonSense supports Tonkeeper, MyTonWallet, and all TON Connect compatible wallets. No registration or email required.",
  },
  {
    q: "What is the What If calculator?",
    a: "It shows you how much you would have earned if you had staked your TON X days ago. Enter any amount, pick a timeframe, and see the exact dollar difference between holding and staking.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  function toggle(i: number) {
    setOpen(prev => (prev === i ? null : i));
  }

  return (
    <div>
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "rgba(255,255,255,0.35)",
          marginBottom: 12,
        }}
      >
        Frequently Asked Questions
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {FAQS.map(({ q, a }, i) => {
          const isOpen = open === i;
          return (
            <div
              key={i}
              style={{
                borderRadius: 14,
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${isOpen ? "rgba(0,152,234,0.25)" : "rgba(255,255,255,0.08)"}`,
                overflow: "hidden",
                transition: "border-color 0.2s ease",
              }}
            >
              <button
                onClick={() => toggle(i)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: 16,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "inherit",
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: isOpen ? "#fff" : "rgba(255,255,255,0.85)",
                    lineHeight: 1.4,
                  }}
                >
                  {q}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: isOpen ? "#0098EA" : "rgba(255,255,255,0.35)",
                    flexShrink: 0,
                    transition: "transform 0.25s ease, color 0.2s ease",
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    display: "inline-block",
                  }}
                >
                  ▼
                </span>
              </button>

              <div
                style={{
                  maxHeight: isOpen ? 400 : 0,
                  overflow: "hidden",
                  transition: "max-height 0.3s ease",
                }}
              >
                <p
                  style={{
                    fontSize: 14,
                    color: "rgba(255,255,255,0.5)",
                    lineHeight: 1.65,
                    padding: "0 16px 16px",
                    margin: 0,
                  }}
                >
                  {a}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
