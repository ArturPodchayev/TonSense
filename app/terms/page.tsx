import Link from "next/link";

const glass = {
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 16,
  padding: "20px 24px",
} as const;

const sectionTitle: React.CSSProperties = {
  color: "rgba(255,255,255,0.9)",
  fontWeight: 700,
  fontSize: 14,
  marginBottom: 8,
};

const body: React.CSSProperties = {
  color: "rgba(255,255,255,0.5)",
  fontSize: 13,
  lineHeight: 1.7,
};

const divider: React.CSSProperties = {
  borderTop: "1px solid rgba(255,255,255,0.06)",
  margin: "0",
};

export default function TermsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#080810" }}>
      <div style={{ maxWidth: 672, margin: "0 auto", padding: "24px 24px 48px" }}>

        {/* Back button */}
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "rgba(255,255,255,0.4)",
            fontSize: 13,
            textDecoration: "none",
            marginBottom: 28,
          }}
        >
          ← Back to App
        </Link>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ color: "#fff", fontWeight: 800, fontSize: 26, marginBottom: 6 }}>
            Terms of Use
          </h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>Last updated: April 2026</p>
        </div>

        {/* Sections card */}
        <div style={glass}>

          {/* 1 */}
          <div style={{ padding: "4px 0 20px" }}>
            <p style={sectionTitle}>Not Financial Advice</p>
            <p style={body}>
              TonSense is an informational tool only. Nothing on this platform — including calculators,
              projections, AI responses, or market data — constitutes financial, investment, or legal
              advice. All content is provided for educational and illustrative purposes only. Do not
              make financial decisions based solely on information presented here.
            </p>
          </div>

          <div style={divider} />

          {/* 2 */}
          <div style={{ padding: "20px 0" }}>
            <p style={sectionTitle}>No Guarantees</p>
            <p style={body}>
              Past performance and APY projections do not guarantee future results. Cryptocurrency
              markets are volatile and staking yields can change at any time. TonSense makes no
              representations about the accuracy, completeness, or timeliness of any data displayed.
              All figures shown are estimates and may differ from actual outcomes.
            </p>
          </div>

          <div style={divider} />

          {/* 3 */}
          <div style={{ padding: "20px 0" }}>
            <p style={sectionTitle}>Your Responsibility</p>
            <p style={body}>
              You are solely responsible for any transactions you initiate through your connected wallet.
            </p>
            <p style={{ ...body, marginTop: 8 }}>
              You must verify all transaction details — address, amount, and payload — before signing.
              Blockchain transactions are irreversible.
            </p>
            <p style={{ ...body, marginTop: 8 }}>
              You agree to comply with the laws of your jurisdiction regarding cryptocurrency usage,
              trading, and taxation.
            </p>
          </div>

          <div style={divider} />

          {/* 4 */}
          <div style={{ padding: "20px 0" }}>
            <p style={sectionTitle}>On-Chain Transactions</p>
            <p style={body}>
              When you use staking or swap features, TonSense constructs and submits transaction
              payloads to your connected TON wallet for signing. TonSense never holds your private
              keys, seed phrases, or custody of your funds. Once a transaction is signed and
              broadcast to the TON blockchain, it cannot be reversed or refunded by TonSense.
              Always review transaction details carefully in your wallet before confirming.
            </p>
          </div>

          <div style={divider} />

          {/* 5 */}
          <div style={{ padding: "20px 0" }}>
            <p style={sectionTitle}>Third-Party Services</p>
            <p style={body}>
              TonSense integrates with external services including{" "}
              <span style={{ color: "rgba(255,255,255,0.7)" }}>Tonstakers</span> (liquid staking),{" "}
              <span style={{ color: "rgba(255,255,255,0.7)" }}>Ston.fi</span> (DEX swaps), and{" "}
              <span style={{ color: "rgba(255,255,255,0.7)" }}>CoinGecko</span> (market data).
              These are independent platforms governed by their own terms and privacy policies.
              TonSense is not affiliated with, endorsed by, or responsible for the operation,
              security, or availability of any third-party service.
            </p>
          </div>

          <div style={divider} />

          {/* 6 */}
          <div style={{ padding: "20px 0" }}>
            <p style={sectionTitle}>No Warranty</p>
            <p style={body}>
              TonSense is provided &quot;as is&quot; without warranties of any kind, express or implied.
              We do not warrant that the service will be uninterrupted, error-free, or free from
              security vulnerabilities. To the maximum extent permitted by law, TonSense and its
              developers shall not be liable for any direct, indirect, incidental, or consequential
              damages arising from your use of the platform.
            </p>
          </div>

          <div style={divider} />

          {/* 7 */}
          <div style={{ padding: "20px 0 4px" }}>
            <p style={sectionTitle}>Contact</p>
            <p style={body}>
              If you have questions about these terms or need help, reach out through our community:
            </p>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              <a
                href="https://t.me/+ls8wv93nO9swYjli"
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...body, color: "#0098EA", textDecoration: "none" }}
              >
                Support Chat → t.me/+ls8wv93nO9swYjli
              </a>
              <a
                href="https://t.me/TonSense_official"
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...body, color: "#0098EA", textDecoration: "none" }}
              >
                Channel → t.me/TonSense_official
              </a>
            </div>
          </div>

        </div>

        {/* Footer */}
        <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, textAlign: "center", marginTop: 32 }}>
          © 2026 TonSense. Built by Artur Podchaev.
        </p>

      </div>
    </div>
  );
}
