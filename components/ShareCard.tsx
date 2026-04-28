"use client";

import { forwardRef } from "react";

interface Props {
  heldUSDT: number;
  stakedUSDT: number;
  diff: number;
  tonAmount: number;
  days: number;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const ShareCard = forwardRef<HTMLDivElement, Props>(
  ({ heldUSDT, stakedUSDT, diff, tonAmount, days }, ref) => {
    const positive = diff >= 0;
    const absDiff = Math.abs(diff);
    const headline = positive
      ? `I would have earned +$${fmt(absDiff)} more by staking! 🚀`
      : `Even staking couldn't save me from this dip 😅`;

    return (
      <div
        ref={ref}
        style={{
          position: "absolute",
          left: -9999,
          top: 0,
          width: 600,
          background: "#0A0A0F",
          borderRadius: 20,
          padding: "36px 40px 32px",
          fontFamily: "Inter, system-ui, sans-serif",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>
              Ton<span style={{ color: "#0098EA" }}>Sense</span>
            </span>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#0098EA", display: "inline-block", marginTop: 2 }} />
          </div>
          <span style={{ fontSize: 12, color: "#6B7280" }}>tonsense.app</span>
        </div>

        {/* Headline */}
        <div style={{
          background: positive ? "rgba(0,152,234,0.1)" : "rgba(239,68,68,0.08)",
          border: `1px solid ${positive ? "rgba(0,152,234,0.25)" : "rgba(239,68,68,0.2)"}`,
          borderRadius: 14,
          padding: "20px 24px",
          marginBottom: 24,
        }}>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff", lineHeight: 1.35 }}>
            {headline}
          </p>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "#6B7280" }}>
            {tonAmount.toLocaleString()} TON · {days} days ago
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 28 }}>
          <StatBox label="Just Held" value={`$${fmt(heldUSDT)}`} color="#fff" />
          <StatBox label="Staked in tsTON" value={`$${fmt(stakedUSDT)}`} color="#22C55E" accent />
          <StatBox
            label="Difference"
            value={`${diff >= 0 ? "+" : "-"}$${fmt(absDiff)}`}
            color={positive ? "#22C55E" : "#EF4444"}
          />
        </div>

        {/* Footer */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 20,
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}>
          <span style={{ fontSize: 13, color: "#6B7280" }}>
            Calculate yours →
          </span>
          <span style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#0098EA",
            background: "rgba(0,152,234,0.1)",
            border: "1px solid rgba(0,152,234,0.2)",
            borderRadius: 8,
            padding: "4px 12px",
          }}>
            tonsense.app
          </span>
        </div>
      </div>
    );
  }
);

ShareCard.displayName = "ShareCard";
export default ShareCard;

function StatBox({ label, value, color, accent }: { label: string; value: string; color: string; accent?: boolean }) {
  return (
    <div style={{
      background: accent ? "rgba(34,197,94,0.07)" : "#13131A",
      border: `1px solid ${accent ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.06)"}`,
      borderRadius: 12,
      padding: "14px 16px",
    }}>
      <p style={{ margin: "0 0 6px", fontSize: 11, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color }}>
        {value}
      </p>
    </div>
  );
}
