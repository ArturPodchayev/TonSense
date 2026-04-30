"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useTonConnectUI } from "@tonconnect/ui-react";

const STORAGE_KEY = "tonsense_onboarded";
const TOTAL_SLIDES = 3;

const features = [
  { icon: "📊", text: "Calculate staking ROI" },
  { icon: "🤖", text: "Ask AI about TON DeFi" },
  { icon: "⚡", text: "Swap tokens via Ston.fi" },
  { icon: "🔔", text: "Get price alerts in Telegram" },
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

  function next() {
    if (slide < TOTAL_SLIDES - 1) setSlide(s => s + 1);
  }

  function back() {
    if (slide > 0) setSlide(s => s - 1);
  }

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

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(10,15,30,0.97)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "inherit",
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides */}
      <div style={{ width: "100%", maxWidth: 400, overflow: "hidden" }}>
        <div
          style={{
            display: "flex",
            transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
            transform: `translateX(-${slide * 100}%)`,
          }}
        >
          {/* Slide 1 — Welcome */}
          <Slide>
            <Image
              src="/logo.png"
              alt="TonSense"
              width={80}
              height={80}
              unoptimized
              style={{ borderRadius: 16, marginBottom: 24 }}
            />
            <h1 style={{
              fontSize: 28, fontWeight: 800, color: "#fff",
              margin: "0 0 12px", textAlign: "center", letterSpacing: "-0.5px",
            }}>
              Welcome to TonSense
            </h1>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.45)", textAlign: "center", margin: 0, lineHeight: 1.5 }}>
              See what you missed. Plan what&apos;s next.
            </p>
          </Slide>

          {/* Slide 2 — Features */}
          <Slide>
            <h2 style={{
              fontSize: 24, fontWeight: 800, color: "#fff",
              margin: "0 0 24px", textAlign: "center",
            }}>
              What you can do
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
              {features.map(({ icon, text }) => (
                <div
                  key={text}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "13px 16px",
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <span style={{ fontSize: 20, lineHeight: 1 }}>{icon}</span>
                  <span style={{ fontSize: 15, color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>{text}</span>
                </div>
              ))}
            </div>
          </Slide>

          {/* Slide 3 — CTA */}
          <Slide>
            <h2 style={{
              fontSize: 24, fontWeight: 800, color: "#fff",
              margin: "0 0 12px", textAlign: "center",
            }}>
              Ready to start?
            </h2>
            <p style={{
              fontSize: 15, color: "rgba(255,255,255,0.45)",
              textAlign: "center", margin: "0 0 32px", lineHeight: 1.5,
            }}>
              Connect wallet to see your balance, transactions & portfolio
            </p>
            <button
              onClick={handleConnectWallet}
              style={{
                width: "100%", padding: "14px", borderRadius: 14,
                background: "linear-gradient(135deg, #0098EA, #1a8fff)",
                border: "none", color: "#fff", fontSize: 15, fontWeight: 700,
                cursor: "pointer", marginBottom: 10,
              }}
            >
              Connect Wallet
            </button>
            <button
              onClick={close}
              style={{
                width: "100%", padding: "14px", borderRadius: 14,
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.55)", fontSize: 15, fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Explore without wallet →
            </button>
          </Slide>
        </div>
      </div>

      {/* Dot indicators */}
      <div style={{ display: "flex", gap: 8, marginTop: 32 }}>
        {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
          <button
            key={i}
            onClick={() => setSlide(i)}
            style={{
              width: i === slide ? 24 : 8,
              height: 8,
              borderRadius: 4,
              border: "none",
              cursor: "pointer",
              padding: 0,
              background: i === slide ? "#0098EA" : "rgba(255,255,255,0.2)",
              transition: "width 0.3s ease, background 0.3s ease",
            }}
          />
        ))}
      </div>

      {/* Nav buttons (slides 1 & 2 only — slide 3 has its own CTAs) */}
      {slide < 2 && (
        <div style={{ display: "flex", gap: 12, marginTop: 24, width: "100%", maxWidth: 400 }}>
          {slide === 0 ? (
            <>
              <NavBtn variant="ghost" onClick={close}>Skip</NavBtn>
              <NavBtn variant="primary" onClick={next}>Next →</NavBtn>
            </>
          ) : (
            <>
              <NavBtn variant="ghost" onClick={back}>← Back</NavBtn>
              <NavBtn variant="primary" onClick={next}>Next →</NavBtn>
            </>
          )}
        </div>
      )}
      {/* Back button on slide 3 */}
      {slide === 2 && (
        <div style={{ marginTop: 16 }}>
          <button
            onClick={back}
            style={{
              background: "transparent", border: "none",
              color: "rgba(255,255,255,0.35)", fontSize: 13,
              cursor: "pointer", padding: "4px 8px",
            }}
          >
            ← Back
          </button>
        </div>
      )}
    </div>
  );
}

function Slide({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minWidth: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}>
      {children}
    </div>
  );
}

function NavBtn({
  variant,
  onClick,
  children,
}: {
  variant: "primary" | "ghost";
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: "13px",
        borderRadius: 12,
        fontSize: 14,
        fontWeight: variant === "primary" ? 700 : 500,
        cursor: "pointer",
        border: variant === "primary" ? "none" : "1px solid rgba(255,255,255,0.15)",
        background: variant === "primary" ? "#0098EA" : "transparent",
        color: variant === "primary" ? "#fff" : "rgba(255,255,255,0.5)",
      }}
    >
      {children}
    </button>
  );
}
