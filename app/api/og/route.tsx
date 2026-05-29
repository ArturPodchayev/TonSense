import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#0a0f1e",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 80px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Subtle glow accent */}
        <div
          style={{
            position: "absolute",
            top: -120,
            left: -80,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "rgba(0,152,234,0.08)",
            display: "flex",
          }}
        />

        {/* Left side */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {/* Logo + name row */}
          <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 28 }}>
            <img
              src="https://tonsense.app/logo.png"
              width={100}
              height={100}
              style={{ borderRadius: 20 }}
            />
            <span style={{ fontSize: 64, fontWeight: 900, color: "#ffffff", letterSpacing: "-2px" }}>
              Ton<span style={{ color: "#0098EA" }}>Sense</span>
            </span>
          </div>

          {/* Subtitle */}
          <p style={{ fontSize: 28, color: "rgba(255,255,255,0.5)", margin: 0, fontWeight: 400 }}>
            AI-powered DeFi dashboard for TON
          </p>

          {/* Tagline */}
          <p style={{ fontSize: 22, color: "rgba(255,255,255,0.3)", margin: "16px 0 0", fontWeight: 400 }}>
            See what you missed. Plan what&apos;s next.
          </p>
        </div>

        {/* Right side */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-end" }}>
          {[
            { icon: "📊", label: "Staking ROI Calculator" },
            { icon: "🤖", label: "AI DeFi Agent" },
            { icon: "⚡", label: "Swap via Ston.fi" },
          ].map(({ icon, label }) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "16px 28px",
                borderRadius: 16,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                minWidth: 300,
              }}
            >
              <span style={{ fontSize: 28 }}>{icon}</span>
              <span style={{ fontSize: 20, color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>
                {label}
              </span>
            </div>
          ))}

          {/* Domain */}
          <p style={{ fontSize: 22, color: "#1a8fff", fontWeight: 700, margin: "8px 0 0" }}>
            tonsense.app
          </p>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
