"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useTonConnectUI } from "@tonconnect/ui-react";

const STORAGE_KEY = "tonsense_onboarded";
const TOTAL_SLIDES = 6;

const FEATURES = [
  { icon: "📊", title: "Dashboard", desc: "Live TON price & your balance in one place" },
  { icon: "⏱", title: "What If",   desc: "See what you missed by not staking" },
  { icon: "🤖", title: "AI Agent", desc: "Ask anything, get answers with real numbers" },
  { icon: "⚡", title: "Swap",      desc: "Convert TON to tsTON in one tap" },
  { icon: "📅", title: "DCA",       desc: "Plan your investment strategy" },
  { icon: "🔔", title: "Alerts",    desc: "Get notified when price hits your target" },
];

const STEPS = [
  { num: "1", icon: "🔗", title: "Connect your TON wallet", desc: "Tonkeeper or any TON wallet" },
  { num: "2", icon: "📊", title: "Check your Dashboard",    desc: "See live data instantly" },
  { num: "3", icon: "⏱", title: "Try What If",             desc: "Enter any amount and see what you missed" },
];

export default function OnboardingModal() {
  const [visible, setVisible] = useState(false);
  const [slide, setSlide] = useState(0);
  const [tonConnectUI] = useTonConnectUI();
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  function close() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  function next() { if (slide < TOTAL_SLIDES - 1) setSlide(s => s + 1); }
  function back() { if (slide > 0) setSlide(s => s - 1); }

  function handleConnectWallet() {
    close();
    tonConnectUI.openModal();
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (delta > 50) next();
    else if (delta < -50) back();
    touchStartX.current = null;
  }

  if (!visible) return null;

  const isLast = slide === TOTAL_SLIDES - 1;

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#0a0f1e", display: "flex", flexDirection: "column", fontFamily: "inherit" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar */}
      <div style={{ padding: "16px 20px 10px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", letterSpacing: "0.05em" }}>
            {slide + 1} / {TOTAL_SLIDES}
          </span>
          <button
            onClick={close}
            style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.35)", fontSize: 13, cursor: "pointer", padding: "4px 8px", borderRadius: 8, fontFamily: "inherit" }}
          >
            Skip
          </button>
        </div>
        <div style={{ height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${((slide + 1) / TOTAL_SLIDES) * 100}%`,
            background: "linear-gradient(90deg, #0098EA, #1a8fff)",
            borderRadius: 2,
            transition: "width 0.35s cubic-bezier(0.4,0,0.2,1)",
          }} />
        </div>
      </div>

      {/* Slide viewport */}
      <div style={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
        <div style={{
          display: "flex",
          height: "100%",
          transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
          transform: `translateX(-${slide * 100}%)`,
        }}>
          <SlideWrap>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
              <Image src="/logo.png" alt="TonSense" width={72} height={72} unoptimized style={{ borderRadius: 16 }} />
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", margin: "0 0 8px", textAlign: "center", letterSpacing: "-0.5px" }}>
              Welcome to TonSense 💎
            </h1>
            <p style={{ fontSize: 15, color: "#0098EA", fontWeight: 600, margin: "0 0 20px", textAlign: "center" }}>
              Your personal TON DeFi assistant
            </p>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.65, margin: 0, textAlign: "center", maxWidth: 300 }}>
              Before we start — let&apos;s make sure you understand how to make your crypto work for you. Takes 1 minute.
            </p>
          </SlideWrap>

          <SlideWrap>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 14px", textAlign: "center" }}>
              What is TON? 🔷
            </h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.65, margin: "0 0 24px", textAlign: "center" }}>
              TON is a cryptocurrency built by the Telegram team. Like dollars in a bank, you can hold TON in a digital wallet. But unlike a bank account — most people let it sit idle, earning nothing.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ padding: "18px 14px", borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
                <div style={{ fontSize: 30, marginBottom: 10 }}>💤</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.65)", marginBottom: 6 }}>Just holding</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", lineHeight: 1.45 }}>Your TON sits. Does nothing.</div>
              </div>
              <div style={{ padding: "18px 14px", borderRadius: 14, background: "rgba(0,152,234,0.08)", border: "1px solid rgba(0,152,234,0.25)", textAlign: "center" }}>
                <div style={{ fontSize: 30, marginBottom: 10 }}>📈</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0098EA", marginBottom: 6 }}>Staking</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.45 }}>Your TON earns ~4% yearly</div>
              </div>
            </div>
          </SlideWrap>

          <SlideWrap>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 14px", textAlign: "center" }}>
              What is Staking? 🏦
            </h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.65, margin: "0 0 24px", textAlign: "center" }}>
              Staking = putting your TON in a savings pool. You deposit TON → receive tsTON tokens → tsTON grows in value every day → you withdraw more TON than you put in.
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
              {(["TON", "→", "Staking Pool", "→", "tsTON", "→", "More TON"] as const).map((item, i) =>
                item === "→" ? (
                  <span key={i} style={{ color: "rgba(255,255,255,0.25)", fontSize: 14 }}>→</span>
                ) : (
                  <span key={i} style={{
                    padding: "6px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                    background: (i === 0 || i === 6) ? "rgba(0,152,234,0.12)" : "rgba(255,255,255,0.06)",
                    border: `1px solid ${(i === 0 || i === 6) ? "rgba(0,152,234,0.3)" : "rgba(255,255,255,0.1)"}`,
                    color: (i === 0 || i === 6) ? "#0098EA" : "rgba(255,255,255,0.65)",
                  }}>
                    {item}
                  </span>
                )
              )}
            </div>
            <div style={{ padding: "16px", borderRadius: 14, background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)", textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>Example</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#22C55E" }}>
                100 TON staked for 1 year = ~104 TON
              </div>
            </div>
          </SlideWrap>

          <SlideWrap>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 10px", textAlign: "center" }}>
              How TonSense helps you 🧠
            </h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, margin: "0 0 18px", textAlign: "center" }}>
              TonSense shows you exactly what you&apos;re missing and helps you act on it.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {FEATURES.map(({ icon, title, desc }) => (
                <div key={title} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{icon}</span>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{title}</span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginLeft: 6 }}>— {desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </SlideWrap>

          <SlideWrap>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 24px", textAlign: "center" }}>
              3 steps to get started 🚀
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              {STEPS.map(({ num, icon, title, desc }) => (
                <div key={num} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "16px", borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #0098EA, #0077BB)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                    {num}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 3 }}>{icon} {title}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", textAlign: "center", margin: 0, lineHeight: 1.5 }}>
              No registration. No email. Just connect and go.
            </p>
          </SlideWrap>

          <SlideWrap>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
              <Image src="/logo.png" alt="TonSense" width={72} height={72} unoptimized style={{ borderRadius: 16 }} />
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#fff", margin: "0 0 10px", textAlign: "center", letterSpacing: "-0.5px" }}>
              Ready? Let&apos;s go! 💎
            </h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", margin: "0 0 32px", textAlign: "center", lineHeight: 1.5, maxWidth: 290 }}>
              Connect your wallet to unlock personalized insights
            </p>
            <button
              onClick={handleConnectWallet}
              style={{ width: "100%", padding: "15px", borderRadius: 14, background: "linear-gradient(135deg, #0098EA, #0077BB)", border: "none", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 10, boxShadow: "0 4px 24px rgba(0,152,234,0.4)", fontFamily: "inherit" }}
            >
              Connect Wallet
            </button>
            <button
              onClick={close}
              style={{ width: "100%", padding: "14px", borderRadius: 14, background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)", fontSize: 15, fontWeight: 500, cursor: "pointer", marginBottom: 18, fontFamily: "inherit" }}
            >
              Explore without wallet →
            </button>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.22)", margin: 0, textAlign: "center" }}>
              You can connect your wallet anytime later
            </p>
          </SlideWrap>
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{ padding: "12px 20px 32px", flexShrink: 0 }}>
        {slide === 0 ? (
          <button
            onClick={next}
            style={{ width: "100%", padding: "15px", borderRadius: 14, background: "linear-gradient(135deg, #0098EA, #0077BB)", border: "none", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 24px rgba(0,152,234,0.35)", fontFamily: "inherit" }}
          >
            Let&apos;s go →
          </button>
        ) : isLast ? (
          <div style={{ textAlign: "center" }}>
            <button
              onClick={back}
              style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 13, cursor: "pointer", padding: "4px 8px", fontFamily: "inherit" }}
            >
              ← Back
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={back}
              style={{ flex: 1, padding: "13px", borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: "pointer", border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "rgba(255,255,255,0.5)", fontFamily: "inherit" }}
            >
              ← Back
            </button>
            <button
              onClick={next}
              style={{ flex: 2, padding: "13px", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", border: "none", background: "#0098EA", color: "#fff", fontFamily: "inherit" }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SlideWrap({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minWidth: "100%",
      height: "100%",
      overflowY: "auto",
      padding: "8px 24px 16px",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}>
      {/* margin:"auto 0" centers vertically when content is shorter than the viewport;
          collapses to 0 automatically when content overflows so scroll still works */}
      <div style={{ width: "100%", maxWidth: 440, margin: "auto 0" }}>
        {children}
      </div>
    </div>
  );
}
