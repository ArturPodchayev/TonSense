"use client";

import { useState, useEffect, useRef } from "react";
import { useTonConnectUI } from "@tonconnect/ui-react";

const STORAGE_KEY = "tonsense_onboarded";
const TOTAL = 6;

// ─── Slide content data ───────────────────────────────────────────────────────

const FEATURES = [
  { icon: "📊", title: "Dashboard", desc: "Live TON price & your balance in one place" },
  { icon: "⏱",  title: "What If",   desc: "See what you missed by not staking" },
  { icon: "🤖", title: "AI Agent",  desc: "Ask anything, get answers with real numbers" },
  { icon: "⚡",  title: "Swap",      desc: "Convert TON to tsTON in one tap" },
  { icon: "📅", title: "DCA",        desc: "Plan your investment strategy" },
  { icon: "🔔", title: "Alerts",     desc: "Get notified when price hits your target" },
];

const STEPS = [
  { num: "1", icon: "🔗", title: "Connect your TON wallet", desc: "Tonkeeper or any TON wallet" },
  { num: "2", icon: "📊", title: "Check your Dashboard",    desc: "See live data instantly" },
  { num: "3", icon: "⏱",  title: "Try What If",            desc: "Enter any amount and see what you missed" },
];

// ─── Shared style tokens ──────────────────────────────────────────────────────

const card: React.CSSProperties = {
  borderRadius: 14,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const muted: React.CSSProperties = { color: "rgba(255,255,255,0.45)", lineHeight: 1.65 };

// ─── Slide components ─────────────────────────────────────────────────────────

function Slide1() {
  return (
    <>
      <img
        src="/logo.png"
        width={80}
        height={80}
        alt="TonSense"
        style={{ borderRadius: 16, margin: "0 auto 24px", display: "block" }}
      />
      <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", margin: "0 0 8px", letterSpacing: "-0.5px" }}>
        Welcome to TonSense 💎
      </h1>
      <p style={{ fontSize: 15, color: "#0098EA", fontWeight: 600, margin: "0 0 20px" }}>
        Your personal TON DeFi assistant
      </p>
      <p style={{ fontSize: 15, ...muted, margin: 0 }}>
        Before we start — let&apos;s make sure you understand how to make your crypto work for you.
        Takes 1 minute.
      </p>
    </>
  );
}

function Slide2() {
  return (
    <>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 16px" }}>
        What is TON? 🔷
      </h2>
      <p style={{ fontSize: 14, ...muted, margin: "0 0 24px" }}>
        TON is a cryptocurrency built by the Telegram team. Like dollars in a bank, you can hold TON
        in a digital wallet. But unlike a bank account — most people let it sit idle, earning nothing.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ ...card, padding: "18px 14px" }}>
          <div style={{ fontSize: 30, marginBottom: 10 }}>💤</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.65)", marginBottom: 6 }}>
            Just holding
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", lineHeight: 1.45 }}>
            Your TON sits. Does nothing.
          </div>
        </div>
        <div style={{ ...card, padding: "18px 14px", background: "rgba(0,152,234,0.08)", border: "1px solid rgba(0,152,234,0.25)" }}>
          <div style={{ fontSize: 30, marginBottom: 10 }}>📈</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0098EA", marginBottom: 6 }}>
            Staking
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.45 }}>
            Your TON earns ~4% yearly
          </div>
        </div>
      </div>
    </>
  );
}

function Slide3() {
  const flow = ["TON", "→", "Staking Pool", "→", "tsTON", "→", "More TON"] as const;
  return (
    <>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 16px" }}>
        What is Staking? 🏦
      </h2>
      <p style={{ fontSize: 14, ...muted, margin: "0 0 24px" }}>
        Staking = putting your TON in a savings pool. You deposit TON → receive tsTON tokens →
        tsTON grows in value every day → you withdraw more TON than you put in.
      </p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
        {flow.map((item, i) =>
          item === "→" ? (
            <span key={i} style={{ color: "rgba(255,255,255,0.25)", fontSize: 14 }}>→</span>
          ) : (
            <span
              key={i}
              style={{
                padding: "6px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: (i === 0 || i === 6) ? "rgba(0,152,234,0.12)" : "rgba(255,255,255,0.06)",
                border: `1px solid ${(i === 0 || i === 6) ? "rgba(0,152,234,0.3)" : "rgba(255,255,255,0.1)"}`,
                color: (i === 0 || i === 6) ? "#0098EA" : "rgba(255,255,255,0.65)",
              }}
            >
              {item}
            </span>
          )
        )}
      </div>
      <div style={{ ...card, padding: 16, background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
          Example
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: "#22C55E" }}>
          100 TON staked for 1 year = ~104 TON
        </div>
      </div>
    </>
  );
}

function Slide4() {
  return (
    <>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 10px" }}>
        How TonSense helps you 🧠
      </h2>
      <p style={{ fontSize: 14, ...muted, margin: "0 0 18px" }}>
        TonSense shows you exactly what you&apos;re missing and helps you act on it.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
        {FEATURES.map(({ icon, title, desc }) => (
          <div
            key={title}
            style={{ ...card, display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", textAlign: "left" }}
          >
            <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{icon}</span>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{title}</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginLeft: 6 }}>— {desc}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Slide5() {
  return (
    <>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 24px" }}>
        3 steps to get started 🚀
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", marginBottom: 24 }}>
        {STEPS.map(({ num, icon, title, desc }) => (
          <div key={num} style={{ ...card, display: "flex", alignItems: "flex-start", gap: 14, padding: 16, textAlign: "left" }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "linear-gradient(135deg, #0098EA, #0077BB)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 800, color: "#fff", flexShrink: 0,
            }}>
              {num}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 3 }}>{icon} {title}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", margin: 0 }}>
        No registration. No email. Just connect and go.
      </p>
    </>
  );
}

function Slide6({ onConnect, onClose }: { onConnect: () => void; onClose: () => void }) {
  return (
    <>
      <img
        src="/logo.png"
        width={80}
        height={80}
        alt="TonSense"
        style={{ borderRadius: 16, margin: "0 auto 24px", display: "block" }}
      />
      <h2 style={{ fontSize: 28, fontWeight: 800, color: "#fff", margin: "0 0 10px", letterSpacing: "-0.5px" }}>
        Ready? Let&apos;s go! 💎
      </h2>
      <p style={{ fontSize: 15, ...muted, margin: "0 0 32px" }}>
        Connect your wallet to unlock personalized insights
      </p>
      <button
        onClick={onConnect}
        style={{
          width: "100%", padding: 15, borderRadius: 14, marginBottom: 10,
          background: "linear-gradient(135deg, #0098EA, #0077BB)",
          border: "none", color: "#fff", fontSize: 15, fontWeight: 700,
          cursor: "pointer", boxShadow: "0 4px 24px rgba(0,152,234,0.4)",
          fontFamily: "inherit",
        }}
      >
        Connect Wallet
      </button>
      <button
        onClick={onClose}
        style={{
          width: "100%", padding: 14, borderRadius: 14, marginBottom: 18,
          background: "transparent", border: "1px solid rgba(255,255,255,0.15)",
          color: "rgba(255,255,255,0.5)", fontSize: 15, fontWeight: 500,
          cursor: "pointer", fontFamily: "inherit",
        }}
      >
        Explore without wallet →
      </button>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.22)", margin: 0 }}>
        You can connect your wallet anytime later
      </p>
    </>
  );
}

// ─── Shared button ────────────────────────────────────────────────────────────

function NavBtn({
  variant,
  onClick,
  children,
  fullWidth,
}: {
  variant: "primary" | "ghost";
  onClick: () => void;
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: fullWidth ? undefined : 1,
        width: fullWidth ? "100%" : undefined,
        padding: 13,
        borderRadius: 12,
        fontSize: 14,
        fontWeight: variant === "primary" ? 700 : 500,
        cursor: "pointer",
        border: variant === "primary" ? "none" : "1px solid rgba(255,255,255,0.15)",
        background: variant === "primary"
          ? "linear-gradient(135deg, #0098EA, #0077BB)"
          : "transparent",
        color: variant === "primary" ? "#fff" : "rgba(255,255,255,0.5)",
        fontFamily: "inherit",
        boxShadow: variant === "primary" ? "0 4px 20px rgba(0,152,234,0.3)" : "none",
      }}
    >
      {children}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function OnboardingModal() {
  const [visible, setVisible] = useState(false);
  const [slide, setSlide] = useState(0);
  const [tonConnectUI] = useTonConnectUI();
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      void Promise.resolve().then(() => setVisible(true));
    }
  }, []);

  function close() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  function next() { if (slide < TOTAL - 1) setSlide(s => s + 1); }
  function back() { if (slide > 0) setSlide(s => s - 1); }

  function connectWallet() {
    close();
    tonConnectUI.openModal();
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStart.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStart.current === null) return;
    const delta = touchStart.current - e.changedTouches[0].clientX;
    if (delta > 50) next();
    else if (delta < -50) back();
    touchStart.current = null;
  }

  if (!visible) return null;

  const isLast = slide === TOTAL - 1;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "#0a0f1e",
        display: "flex", flexDirection: "column",
        fontFamily: "inherit",
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── TOP BAR ── */}
      <div style={{
        height: 60, flexShrink: 0,
        padding: "0 20px",
        display: "flex", flexDirection: "column", justifyContent: "center", gap: 8,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", letterSpacing: "0.05em" }}>
            {slide + 1} / {TOTAL}
          </span>
          <button
            onClick={close}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", fontSize: 13, cursor: "pointer", fontFamily: "inherit", padding: "4px 0" }}
          >
            Skip
          </button>
        </div>
        <div style={{ height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${((slide + 1) / TOTAL) * 100}%`,
            background: "linear-gradient(90deg, #0098EA, #1a8fff)",
            borderRadius: 2,
            transition: "width 0.35s cubic-bezier(0.4,0,0.2,1)",
          }} />
        </div>
      </div>

      {/* ── MIDDLE CONTENT ── */}
      <div style={{
        flex: 1, overflowY: "auto",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: 24, textAlign: "center",
      }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          {slide === 0 && <Slide1 />}
          {slide === 1 && <Slide2 />}
          {slide === 2 && <Slide3 />}
          {slide === 3 && <Slide4 />}
          {slide === 4 && <Slide5 />}
          {slide === 5 && <Slide6 onConnect={connectWallet} onClose={close} />}
        </div>
      </div>

      {/* ── BOTTOM BAR ── */}
      <div style={{
        height: 100, flexShrink: 0,
        padding: "16px 20px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        {slide === 0 ? (
          <NavBtn variant="primary" onClick={next} fullWidth>Let&apos;s go →</NavBtn>
        ) : isLast ? (
          <div style={{ flex: 1, textAlign: "center" }}>
            <button
              onClick={back}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
            >
              ← Back
            </button>
          </div>
        ) : (
          <>
            <NavBtn variant="ghost" onClick={back}>← Back</NavBtn>
            <NavBtn variant="primary" onClick={next}>Next →</NavBtn>
          </>
        )}
      </div>
    </div>
  );
}
