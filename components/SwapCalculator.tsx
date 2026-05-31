"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useTonConnectUI, useTonAddress, useTonWallet } from "@tonconnect/ui-react";
import { DEX, pTON } from "@ston-fi/sdk";
import { TonClient } from "@ton/ton";
import { toNano } from "@ton/core";
import { useTonBalance } from "@/hooks/useTonBalance";

// ── Token shape from STON.fi assets API ───────────────────────────────────────

interface Token {
  contract_address: string;
  symbol: string;
  display_name: string;
  image_url: string | null;
  decimals: number;
  kind: string;
}

interface StonAssetsResponse {
  asset_list: Array<Token & { deprecated?: boolean }>;
}

// ── TokenIcon ─────────────────────────────────────────────────────────────────

function TokenIcon({ token, size }: { token: Token; size: number }) {
  if (token.image_url) {
    return (
      <img
        src={token.image_url}
        alt={token.symbol}
        width={size}
        height={size}
        style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "rgba(0,152,234,0.2)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: Math.round(size * 0.45), fontWeight: 700, color: "#0098EA", flexShrink: 0,
    }}>
      {token.symbol[0]}
    </div>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ROUTER_V1 = "EQB3ncyBUTjZUA5EnFKR5_EnOMI9V1tTEAAPaiU71gc4TiUt";
const PTON_V1   = "EQCM3B12QK1e4yZSf8GtBRT0aLMNyEsBc_DhVfRRtOEffLez";

// ── Shared styles ─────────────────────────────────────────────────────────────

const glass = {
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
} as const;

// ── Types ─────────────────────────────────────────────────────────────────────

interface SimResult {
  ask_units: string;
  min_ask_units: string;
  swap_rate: string;
  fee_percent: string;
  router_address: string;
}

type SimState = "idle" | "loading" | "ready" | "error";
type TxState  = "idle" | "sending" | "success" | "error";

// ── Lazy TonClient singleton ──────────────────────────────────────────────────

let _client: TonClient | null = null;
function getClient() {
  if (!_client) _client = new TonClient({ endpoint: "https://toncenter.com/api/v2/jsonRPC" });
  return _client;
}

// ── TokenDropdown ─────────────────────────────────────────────────────────────

interface TokenDropdownProps {
  tokens: Token[];
  selected: Token | null;
  onChange: (t: Token) => void;
  search: string;
  onSearchChange: (v: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

function TokenDropdown({ tokens, selected, onChange, search, onSearchChange, isOpen, onToggle }: TokenDropdownProps) {
  return (
    <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
      <button
        onClick={onToggle}
        className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", minWidth: 100 }}
      >
        {selected ? (
          <>
            <TokenIcon token={selected} size={20} />
            <span style={{ fontWeight: 600, fontSize: 14 }}>{selected.symbol}</span>
          </>
        ) : (
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Loading…</span>
        )}
        <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, marginLeft: 6 }}>▾</span>
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-1 z-50 w-64 rounded-2xl"
          style={{ ...glass, boxShadow: "0 8px 40px rgba(0,0,0,0.6)", maxHeight: 320, overflowY: "auto" }}
        >
          <div
            className="p-2 sticky top-0"
            style={{ background: "rgba(8,8,16,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <input
              autoFocus
              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
              placeholder="Search token…"
              value={search}
              onChange={e => onSearchChange(e.target.value)}
            />
          </div>
          {tokens.length === 0 && (
            <div style={{ padding: "14px 16px", color: "rgba(255,255,255,0.3)", fontSize: 13, textAlign: "center" }}>
              No tokens found
            </div>
          )}
          {tokens.map(t => (
            <button
              key={t.contract_address}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
              style={{ background: t.contract_address === selected?.contract_address ? "rgba(0,152,234,0.1)" : "transparent" }}
              onClick={() => onChange(t)}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = t.contract_address === selected?.contract_address ? "rgba(0,152,234,0.1)" : "transparent"; }}
            >
              <TokenIcon token={t} size={28} />
              <div>
                <div style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>{t.symbol}</div>
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{t.display_name}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SwapCalculator() {
  const [tonConnectUI] = useTonConnectUI();
  const wallet         = useTonWallet();
  const walletAddress  = useTonAddress();
  const tonBalance     = useTonBalance();

  const [assets,    setAssets]    = useState<Token[]>([]);
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken,   setToToken]   = useState<Token | null>(null);
  const [fromAmt,   setFromAmt]   = useState("");
  const [toAmt,     setToAmt]     = useState("");
  const [tonPrice,  setTonPrice]  = useState(0);

  const [simState, setSimState] = useState<SimState>("idle");
  const [simData,  setSimData]  = useState<SimResult | null>(null);
  const [txState,  setTxState]  = useState<TxState>("idle");
  const [errMsg,   setErrMsg]   = useState("");

  const [showPreview,  setShowPreview]  = useState(false);
  const [fromDropOpen, setFromDropOpen] = useState(false);
  const [toDropOpen,   setToDropOpen]   = useState(false);
  const [fromSearch,   setFromSearch]   = useState("");
  const [toSearch,     setToSearch]     = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch STON.fi assets on mount
  useEffect(() => {
    fetch("https://api.ston.fi/v1/assets")
      .then(r => r.json())
      .then((d: StonAssetsResponse) => {
        const list = (d.asset_list ?? [])
          .filter(a => (a.kind === "Jetton" || a.kind === "Ton") && !a.deprecated)
          .sort((a, b) => {
            if (a.kind === "Ton") return -1;
            if (b.kind === "Ton") return 1;
            return a.symbol.localeCompare(b.symbol);
          });
        setAssets(list);
        setFromToken(list.find(a => a.kind === "Ton") ?? list[0] ?? null);
        setToToken(list.find(a => a.symbol === "USDT") ?? list[1] ?? null);
      })
      .catch(() => {});
  }, []);

  // Fetch TON price for USD estimates
  useEffect(() => {
    fetch("/api/ton-price")
      .then(r => r.json())
      .then(d => setTonPrice(d.price ?? 0))
      .catch(() => {});
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function close() { setFromDropOpen(false); setToDropOpen(false); }
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  async function runSimulate() {
    if (!fromToken || !toToken) return;
    setSimState("loading");
    try {
      const units = BigInt(Math.round(parseFloat(fromAmt) * 10 ** fromToken.decimals)).toString();
      const params = new URLSearchParams({
        offer_address:      fromToken.contract_address,
        ask_address:        toToken.contract_address,
        units,
        slippage_tolerance: "0.05",
      });
      const res = await fetch(`https://api.ston.fi/v1/swap/simulate?${params}`, { method: "POST" });
      if (!res.ok) throw new Error("simulate failed");
      const data: SimResult = await res.json();
      setSimData(data);
      const out = parseFloat(data.ask_units) / 10 ** toToken.decimals;
      setToAmt(out.toFixed(toToken.decimals === 6 ? 4 : 6));
      setSimState("ready");
    } catch {
      setSimData(null); setToAmt(""); setSimState("error");
    }
  }

  // Debounced simulate
  useEffect(() => {
    const amt = parseFloat(fromAmt);
    if (!fromAmt || isNaN(amt) || amt <= 0) {
      void Promise.resolve().then(() => {
        setToAmt("");
        setSimData(null);
        setSimState("idle");
      });
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void runSimulate(), 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromAmt, fromToken?.contract_address, toToken?.contract_address]);

  function flipTokens() {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmt(toAmt);
    setToAmt(fromAmt);
    setSimData(null);
    setSimState("idle");
  }

  function applyPreset(pct: number) {
    if (tonBalance === null) return;
    const val = pct === 100 ? tonBalance : tonBalance * pct / 100;
    setFromAmt(val.toFixed(2));
  }

  function handleSwapClick() {
    if (!fromToken || !toToken) return;
    const amt = parseFloat(fromAmt);
    if (!fromAmt || isNaN(amt) || amt <= 0 || !simData) return;

    if (fromToken.kind === "Ton" && amt < 0.1) {
      setErrMsg("Minimum amount is 0.1 TON");
      setTxState("error");
      setTimeout(() => setTxState("idle"), 3000);
      return;
    }
    if (fromToken.kind === "Ton" && tonBalance !== null && amt > tonBalance) {
      setErrMsg("Insufficient balance");
      setTxState("error");
      setTimeout(() => setTxState("idle"), 3000);
      return;
    }
    setShowPreview(true);
  }

  async function handleConfirm() {
    if (!walletAddress || !simData || !fromToken || !toToken) return;
    setShowPreview(false);
    setTxState("sending");

    try {
      const client   = getClient();
      const router   = client.open(DEX.v1.Router.create(simData.router_address || ROUTER_V1));
      const proxyTon = new pTON.v1(PTON_V1);
      const minAsk   = BigInt(simData.min_ask_units);

      let txParams;
      if (fromToken.kind === "Ton") {
        txParams = await router.getSwapTonToJettonTxParams({
          userWalletAddress: walletAddress,
          proxyTon,
          offerAmount:      toNano(fromAmt),
          askJettonAddress: toToken.contract_address,
          minAskAmount:     minAsk,
        });
      } else if (toToken.kind === "Ton") {
        const offerUnits = BigInt(Math.round(parseFloat(fromAmt) * 10 ** fromToken.decimals));
        txParams = await router.getSwapJettonToTonTxParams({
          userWalletAddress:  walletAddress,
          offerJettonAddress: fromToken.contract_address,
          offerAmount:        offerUnits,
          proxyTon,
          minAskAmount:       minAsk,
        });
      } else {
        const offerUnits = BigInt(Math.round(parseFloat(fromAmt) * 10 ** fromToken.decimals));
        txParams = await router.getSwapJettonToJettonTxParams({
          userWalletAddress:  walletAddress,
          offerJettonAddress: fromToken.contract_address,
          offerAmount:        offerUnits,
          askJettonAddress:   toToken.contract_address,
          minAskAmount:       minAsk,
        });
      }

      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [{
          address: txParams.to.toString(),
          amount:  txParams.value.toString(),
          payload: txParams.body?.toBoc().toString("base64"),
        }],
      });

      setTxState("success");
    } catch (e) {
      console.error(e);
      setErrMsg("Transaction failed. Try again.");
      setTxState("error");
      setTimeout(() => setTxState("idle"), 4000);
    }
  }

  // ── Derived values ────────────────────────────────────────────────────────────

  const fromFiltered = useMemo(() =>
    assets
      .filter(t =>
        t.contract_address !== toToken?.contract_address &&
        (t.symbol.toLowerCase().includes(fromSearch.toLowerCase()) ||
         t.display_name.toLowerCase().includes(fromSearch.toLowerCase()))
      )
      .slice(0, 50),
    [assets, toToken?.contract_address, fromSearch]
  );

  const toFiltered = useMemo(() =>
    assets
      .filter(t =>
        t.contract_address !== fromToken?.contract_address &&
        (t.symbol.toLowerCase().includes(toSearch.toLowerCase()) ||
         t.display_name.toLowerCase().includes(toSearch.toLowerCase()))
      )
      .slice(0, 50),
    [assets, fromToken?.contract_address, toSearch]
  );

  const computedRate = simData && fromAmt && fromToken && toToken
    ? parseFloat(simData.ask_units) / 10 ** toToken.decimals / parseFloat(fromAmt)
    : null;
  const rateStr = computedRate !== null && fromToken && toToken
    ? `1 ${fromToken.symbol} = ${computedRate.toFixed(6)} ${toToken.symbol}`
    : null;

  const feeStr = simData
    ? `${(parseFloat(simData.fee_percent) * 100).toFixed(3)}%`
    : "~0.15%";

  const minReceived = simData && toToken
    ? (parseFloat(simData.min_ask_units) / 10 ** toToken.decimals).toFixed(toToken.decimals === 6 ? 4 : 6)
    : "0";

  const toUsd = (() => {
    if (!toToken) return "";
    const n = parseFloat(toAmt || "0");
    if (!n) return "";
    if (toToken.symbol.toUpperCase().includes("USD")) return `≈ $${n.toFixed(2)}`;
    if (tonPrice && (toToken.kind === "Ton" || toToken.symbol.toUpperCase() === "TSTON" || toToken.symbol.toUpperCase() === "STTON"))
      return `≈ $${(n * tonPrice).toFixed(2)}`;
    return "";
  })();

  const showFromBalance = wallet && tonBalance !== null && fromToken?.kind === "Ton";

  // ── Success state ────────────────────────────────────────────────────────────

  if (txState === "success") {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ ...glass, borderColor: "rgba(34,197,94,0.25)", background: "rgba(34,197,94,0.04)" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <p style={{ color: "#22C55E", fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Swap sent!</p>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginBottom: 20 }}>
          Check your wallet for {toToken?.symbol}
        </p>
        <button
          onClick={() => { setTxState("idle"); setFromAmt(""); setToAmt(""); setSimData(null); setSimState("idle"); }}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "#22C55E" }}
        >
          Swap again
        </button>
      </div>
    );
  }

  // ── Main UI ──────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="space-y-3">

        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2.5 mb-1">
            <span style={{ fontSize: 24 }}>⚡</span>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 20 }}>Swap</span>
          </div>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>Powered by Ston.fi</p>
        </div>

        {/* ── From card ─────────────────────────────────────────────────────── */}
        <div className="rounded-2xl" style={{ ...glass, padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <TokenDropdown
              tokens={fromFiltered}
              selected={fromToken}
              onChange={t => { setFromToken(t); setFromDropOpen(false); setFromSearch(""); setSimData(null); setToAmt(""); setSimState("idle"); }}
              search={fromSearch}
              onSearchChange={setFromSearch}
              isOpen={fromDropOpen}
              onToggle={() => { setFromDropOpen(v => !v); setToDropOpen(false); }}
            />

            <input
              type="number"
              placeholder="0"
              min="0"
              value={fromAmt}
              onChange={e => setFromAmt(e.target.value)}
              style={{
                flex: 1,
                minWidth: 0,
                background: "transparent",
                border: "none",
                outline: "none",
                textAlign: "right",
                fontSize: 24,
                fontWeight: 700,
                color: "#fff",
              }}
            />
          </div>

          {showFromBalance && (
            <div style={{ marginTop: 6, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
              Balance: {tonBalance!.toFixed(2)} TON
            </div>
          )}
        </div>

        {/* ── Presets ───────────────────────────────────────────────────────── */}
        {showFromBalance && (
          <div className="flex gap-2">
            {([25, 50, 75, 100] as const).map(pct => (
              <button
                key={pct}
                onClick={() => applyPreset(pct)}
                className="flex-1 py-1 rounded-lg text-xs font-medium transition-colors"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
              >
                {pct === 100 ? "MAX" : `${pct}%`}
              </button>
            ))}
          </div>
        )}

        {/* ── Flip button ───────────────────────────────────────────────────── */}
        <div className="flex justify-center">
          <button
            onClick={flipTokens}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(0,152,234,0.12)",
              border: "1px solid rgba(0,152,234,0.3)",
              color: "#0098EA",
              fontSize: 18,
              transition: "transform 0.25s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "rotate(180deg) scale(1.1)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "none"; }}
          >
            ↕
          </button>
        </div>

        {/* ── To card ───────────────────────────────────────────────────────── */}
        <div className="rounded-2xl" style={{ ...glass, padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <TokenDropdown
              tokens={toFiltered}
              selected={toToken}
              onChange={t => { setToToken(t); setToDropOpen(false); setToSearch(""); setSimData(null); setToAmt(""); setSimState("idle"); }}
              search={toSearch}
              onSearchChange={setToSearch}
              isOpen={toDropOpen}
              onToggle={() => { setToDropOpen(v => !v); setFromDropOpen(false); }}
            />

            <div style={{
              flex: 1,
              minWidth: 0,
              textAlign: "right",
              fontSize: 24,
              fontWeight: 700,
              color: simState === "ready" ? "#22C55E" : "rgba(255,255,255,0.2)",
            }}>
              {toAmt || "0"}
            </div>
          </div>

          <div style={{ marginTop: 6, minHeight: 16, fontSize: 11, color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: 4 }}>
            {simState === "loading" ? (
              <>
                <span className="w-3 h-3 border border-white/30 border-t-white/70 rounded-full animate-spin inline-block" />
                fetching rate…
              </>
            ) : (toUsd && simState === "ready") ? toUsd : null}
          </div>
        </div>

        {/* ── Rate row ──────────────────────────────────────────────────────── */}
        {simState === "ready" && rateStr && (
          <div className="flex justify-between px-1">
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{rateStr}</span>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>Fee: {feeStr}</span>
          </div>
        )}

        {/* ── Rate unavailable ──────────────────────────────────────────────── */}
        {simState === "error" && fromAmt && (
          <div className="rounded-xl p-3 text-center" style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <p style={{ color: "#EF4444", fontSize: 13, marginBottom: 4 }}>Rate unavailable for this pair</p>
            <a
              href="https://app.ston.fi/swap"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#0098EA", fontSize: 12 }}
            >
              Swap manually on Ston.fi →
            </a>
          </div>
        )}

        {/* ── Validation / tx error ─────────────────────────────────────────── */}
        {txState === "error" && (
          <div className="rounded-xl p-3 text-center" style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <p style={{ color: "#EF4444", fontSize: 13 }}>{errMsg}</p>
          </div>
        )}

        {/* ── Swap button ───────────────────────────────────────────────────── */}
        {!wallet ? (
          <button
            disabled
            className="w-full py-4 rounded-2xl text-sm font-semibold opacity-40"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
          >
            Connect wallet to swap
          </button>
        ) : txState === "sending" ? (
          <button
            disabled
            className="w-full py-4 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
            style={{ background: "rgba(0,152,234,0.15)", border: "1px solid rgba(0,152,234,0.3)", color: "rgba(255,255,255,0.7)" }}
          >
            <span className="w-4 h-4 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
            Confirming in wallet…
          </button>
        ) : (
          <button
            onClick={handleSwapClick}
            disabled={!fromAmt || simState !== "ready" || !fromToken || !toToken}
            className="w-full py-4 rounded-2xl text-sm font-semibold transition-all hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{
              background: "linear-gradient(135deg, #0098EA, #0077BB)",
              boxShadow: "0 4px 20px rgba(0,152,234,0.3)",
              color: "#fff",
            }}
          >
            {simState === "loading"
              ? "Fetching rate…"
              : `Swap ${fromToken?.symbol ?? "…"} → ${toToken?.symbol ?? "…"}`}
          </button>
        )}
      </div>

      {/* ── Preview modal ────────────────────────────────────────────────────── */}
      {showPreview && simData && fromToken && toToken && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
          onClick={() => setShowPreview(false)}
        >
          <div
            className="w-full max-w-sm"
            style={{ ...glass, borderRadius: 20, padding: 24, animation: "swapPreviewIn 200ms ease both" }}
            onClick={e => e.stopPropagation()}
          >
            <style>{`
              @keyframes swapPreviewIn {
                from { opacity: 0; transform: translateY(20px); }
                to   { opacity: 1; transform: translateY(0); }
              }
            `}</style>

            <p style={{ color: "#fff", fontWeight: 700, fontSize: 16, marginBottom: 16 }}>⚡ Swap Preview</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "You send",      value: `${fromAmt} ${fromToken.symbol}`,   color: "#fff"                   },
                { label: "You receive",   value: `~${toAmt} ${toToken.symbol}`,      color: "#22C55E"                },
                { label: "Exchange rate", value: rateStr ?? "—",                     color: "rgba(255,255,255,0.65)" },
                { label: "Min received",  value: `${minReceived} ${toToken.symbol}`, color: "rgba(255,255,255,0.5)"  },
                { label: "Ston.fi fee",   value: feeStr,                             color: "rgba(255,255,255,0.5)"  },
                { label: "Network fee",   value: "~0.1 TON",                         color: "rgba(255,255,255,0.5)"  },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}>{label}</span>
                  <span style={{ color, fontSize: 14, fontWeight: 600, maxWidth: "55%", textAlign: "right" }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "16px 0" }} />

            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, textAlign: "center", marginBottom: 16 }}>
              Actual amounts may vary slightly due to price movement
            </p>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.01]"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.75)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.01]"
                style={{ background: "linear-gradient(135deg, #0098EA, #0077BB)", boxShadow: "0 4px 20px rgba(0,152,234,0.3)", color: "#fff" }}
              >
                Confirm & Swap →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
