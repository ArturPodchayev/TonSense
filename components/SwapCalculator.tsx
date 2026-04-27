"use client";

import { useState, useEffect, useRef } from "react";
import { useTonConnectUI, useTonAddress, useTonWallet } from "@tonconnect/ui-react";
import { DEX, pTON } from "@ston-fi/sdk";
import { TonClient } from "@ton/ton";
import { toNano } from "@ton/core";
import { useTonBalance } from "@/hooks/useTonBalance";

// ── Token list ────────────────────────────────────────────────────────────────

const TOKENS = [
  { symbol: "TON",   name: "Toncoin",         address: "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c",   decimals: 9, logo: "💎" },
  { symbol: "tsTON", name: "Tonstakers TON",   address: "EQC98_qAmNEptUtPc7W6xdHh_ZHrBUFpw5Ft_IzNU20QAJav", decimals: 9, logo: "🔷" },
  { symbol: "stTON", name: "Bemo Staked TON",  address: "EQDNhy-nxYFgUqzfUzImBEP67JqsyMIcyk2S5_RwNNEYku0k", decimals: 9, logo: "🔹" },
  { symbol: "USDT",  name: "Tether USD",       address: "EQDGXX6RPjzl0N6GQUyTDbFaCvcG2ocnakLA6To1iPooWZES", decimals: 6, logo: "💵" },
  { symbol: "USDC",  name: "USD Coin",         address: "EQB19ctZOjEGUmMq184j8WuwILyaXMF2TqL_RYURfHQNJjp3", decimals: 6, logo: "🔵" },
] as const;

type Token = typeof TOKENS[number];

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

// ── Component ─────────────────────────────────────────────────────────────────

export default function SwapCalculator() {
  const [tonConnectUI] = useTonConnectUI();
  const wallet         = useTonWallet();
  const walletAddress  = useTonAddress();
  const tonBalance     = useTonBalance();

  const [fromToken, setFromToken] = useState<Token>(TOKENS[0]);
  const [toToken,   setToToken]   = useState<Token>(TOKENS[1]);
  const [fromAmt,   setFromAmt]   = useState("");
  const [toAmt,     setToAmt]     = useState("");
  const [tonPrice,  setTonPrice]  = useState(0);

  const [simState, setSimState] = useState<SimState>("idle");
  const [simData,  setSimData]  = useState<SimResult | null>(null);
  const [txState,  setTxState]  = useState<TxState>("idle");
  const [errMsg,   setErrMsg]   = useState("");

  const [showPreview,   setShowPreview]   = useState(false);
  const [fromDropOpen,  setFromDropOpen]  = useState(false);
  const [toDropOpen,    setToDropOpen]    = useState(false);
  const [fromSearch,    setFromSearch]    = useState("");
  const [toSearch,      setToSearch]      = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Debounced simulate
  useEffect(() => {
    const amt = parseFloat(fromAmt);
    if (!fromAmt || isNaN(amt) || amt <= 0) {
      setToAmt(""); setSimData(null); setSimState("idle");
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(runSimulate, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromAmt, fromToken.address, toToken.address]);

  async function runSimulate() {
    setSimState("loading");
    try {
      const units = BigInt(Math.round(parseFloat(fromAmt) * 10 ** fromToken.decimals)).toString();
      const params = new URLSearchParams({
        offer_address: fromToken.address,
        ask_address:   toToken.address,
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

  function flipTokens() {
    const prevFrom = fromToken;
    const prevTo   = toToken;
    setFromToken(prevTo);
    setToToken(prevFrom);
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
    const amt = parseFloat(fromAmt);
    if (!fromAmt || isNaN(amt) || amt <= 0 || !simData) return;

    if (fromToken.symbol === "TON" && amt < 0.1) {
      setErrMsg("Minimum amount is 0.1 TON");
      setTxState("error");
      setTimeout(() => setTxState("idle"), 3000);
      return;
    }
    if (fromToken.symbol === "TON" && tonBalance !== null && amt > tonBalance) {
      setErrMsg("Insufficient balance");
      setTxState("error");
      setTimeout(() => setTxState("idle"), 3000);
      return;
    }
    setShowPreview(true);
  }

  async function handleConfirm() {
    if (!walletAddress || !simData) return;
    setShowPreview(false);
    setTxState("sending");

    try {
      const client   = getClient();
      const router   = client.open(DEX.v1.Router.create(simData.router_address || ROUTER_V1));
      const proxyTon = new pTON.v1(PTON_V1);
      const minAsk   = BigInt(simData.min_ask_units);

      let txParams;
      if (fromToken.symbol === "TON") {
        txParams = await router.getSwapTonToJettonTxParams({
          userWalletAddress: walletAddress,
          proxyTon,
          offerAmount:      toNano(fromAmt),
          askJettonAddress: toToken.address,
          minAskAmount:     minAsk,
        });
      } else if (toToken.symbol === "TON") {
        const offerUnits = BigInt(Math.round(parseFloat(fromAmt) * 10 ** fromToken.decimals));
        txParams = await router.getSwapJettonToTonTxParams({
          userWalletAddress:  walletAddress,
          offerJettonAddress: fromToken.address,
          offerAmount:        offerUnits,
          proxyTon,
          minAskAmount:       minAsk,
        });
      } else {
        const offerUnits = BigInt(Math.round(parseFloat(fromAmt) * 10 ** fromToken.decimals));
        txParams = await router.getSwapJettonToJettonTxParams({
          userWalletAddress:  walletAddress,
          offerJettonAddress: fromToken.address,
          offerAmount:        offerUnits,
          askJettonAddress:   toToken.address,
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

  // Derived values
  const fromFiltered = TOKENS.filter(t =>
    t.symbol !== toToken.symbol &&
    (t.symbol.toLowerCase().includes(fromSearch.toLowerCase()) ||
     t.name.toLowerCase().includes(fromSearch.toLowerCase()))
  );
  const toFiltered = TOKENS.filter(t =>
    t.symbol !== fromToken.symbol &&
    (t.symbol.toLowerCase().includes(toSearch.toLowerCase()) ||
     t.name.toLowerCase().includes(toSearch.toLowerCase()))
  );

  const computedRate = simData && fromAmt
    ? parseFloat(simData.ask_units) / 10 ** toToken.decimals / parseFloat(fromAmt)
    : null;
  const rateStr = computedRate !== null
    ? `1 ${fromToken.symbol} = ${computedRate.toFixed(6)} ${toToken.symbol}`
    : null;

  const feeStr = simData
    ? `${(parseFloat(simData.fee_percent) * 100).toFixed(3)}%`
    : "~0.15%";

  const minReceived = simData
    ? (parseFloat(simData.min_ask_units) / 10 ** toToken.decimals).toFixed(toToken.decimals === 6 ? 4 : 6)
    : "0";

  const toUsd = (() => {
    const n = parseFloat(toAmt || "0");
    if (!n) return "";
    if (toToken.symbol === "USDT" || toToken.symbol === "USDC") return `≈ $${n.toFixed(2)}`;
    if (tonPrice && (toToken.symbol === "TON" || toToken.symbol === "tsTON" || toToken.symbol === "stTON"))
      return `≈ $${(n * tonPrice).toFixed(2)}`;
    return "";
  })();

  const showFromBalance = wallet && tonBalance !== null && fromToken.symbol === "TON";

  // ── Success state ────────────────────────────────────────────────────────────

  if (txState === "success") {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ ...glass, borderColor: "rgba(34,197,94,0.25)", background: "rgba(34,197,94,0.04)" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <p style={{ color: "#22C55E", fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Swap sent!</p>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginBottom: 20 }}>
          Check your wallet for {toToken.symbol}
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
        <div className="rounded-2xl p-4" style={glass}>
          <div className="flex justify-between items-center mb-3">
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>You send</span>
            {showFromBalance && (
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>
                Balance: {tonBalance!.toFixed(2)} TON
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* From token selector */}
            <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => { setFromDropOpen(v => !v); setToDropOpen(false); }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", minWidth: 112 }}
              >
                <span style={{ fontSize: 18 }}>{fromToken.logo}</span>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{fromToken.symbol}</span>
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, marginLeft: "auto" }}>▾</span>
              </button>

              {fromDropOpen && (
                <div className="absolute top-full left-0 mt-1 z-50 w-56 rounded-2xl overflow-hidden" style={{ ...glass, boxShadow: "0 8px 40px rgba(0,0,0,0.6)" }}>
                  <div className="p-2">
                    <input
                      autoFocus
                      className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
                      placeholder="Search token..."
                      value={fromSearch}
                      onChange={e => setFromSearch(e.target.value)}
                    />
                  </div>
                  {fromFiltered.map(t => (
                    <button
                      key={t.symbol}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
                      style={{ background: t.symbol === fromToken.symbol ? "rgba(0,152,234,0.1)" : "transparent" }}
                      onClick={() => { setFromToken(t); setFromDropOpen(false); setFromSearch(""); setSimData(null); setToAmt(""); setSimState("idle"); }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = t.symbol === fromToken.symbol ? "rgba(0,152,234,0.1)" : "transparent"; }}
                    >
                      <span style={{ fontSize: 20 }}>{t.logo}</span>
                      <div>
                        <div style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>{t.symbol}</div>
                        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{t.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Amount input */}
            <input
              type="number"
              className="flex-1 bg-transparent outline-none text-right font-bold"
              style={{ color: "#fff", fontSize: 26 }}
              placeholder="0"
              min="0"
              value={fromAmt}
              onChange={e => setFromAmt(e.target.value)}
            />
          </div>

          {/* Presets (25 / 50 / 75 / MAX) */}
          {showFromBalance && (
            <div className="flex gap-2 mt-3">
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
        </div>

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
        <div className="rounded-2xl p-4" style={glass}>
          <div className="flex justify-between items-center mb-3">
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>You receive</span>
            {simState === "loading" && (
              <span className="flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>
                <span className="w-3 h-3 border border-white/30 border-t-white/70 rounded-full animate-spin inline-block" />
                fetching rate…
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* To token selector */}
            <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => { setToDropOpen(v => !v); setFromDropOpen(false); }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", minWidth: 112 }}
              >
                <span style={{ fontSize: 18 }}>{toToken.logo}</span>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{toToken.symbol}</span>
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, marginLeft: "auto" }}>▾</span>
              </button>

              {toDropOpen && (
                <div className="absolute top-full left-0 mt-1 z-50 w-56 rounded-2xl overflow-hidden" style={{ ...glass, boxShadow: "0 8px 40px rgba(0,0,0,0.6)" }}>
                  <div className="p-2">
                    <input
                      autoFocus
                      className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
                      placeholder="Search token..."
                      value={toSearch}
                      onChange={e => setToSearch(e.target.value)}
                    />
                  </div>
                  {toFiltered.map(t => (
                    <button
                      key={t.symbol}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
                      style={{ background: t.symbol === toToken.symbol ? "rgba(0,152,234,0.1)" : "transparent" }}
                      onClick={() => { setToToken(t); setToDropOpen(false); setToSearch(""); setSimData(null); setToAmt(""); setSimState("idle"); }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = t.symbol === toToken.symbol ? "rgba(0,152,234,0.1)" : "transparent"; }}
                    >
                      <span style={{ fontSize: 20 }}>{t.logo}</span>
                      <div>
                        <div style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>{t.symbol}</div>
                        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{t.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Output (read-only) */}
            <div className="flex-1 text-right">
              <div style={{ fontSize: 26, fontWeight: 700, color: simState === "ready" ? "#22C55E" : "rgba(255,255,255,0.2)" }}>
                {toAmt || "0"}
              </div>
              {toUsd && simState === "ready" && (
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 2 }}>{toUsd}</div>
              )}
            </div>
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
            disabled={!fromAmt || simState !== "ready"}
            className="w-full py-4 rounded-2xl text-sm font-semibold transition-all hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{
              background: "linear-gradient(135deg, #0098EA, #0077BB)",
              boxShadow: "0 4px 20px rgba(0,152,234,0.3)",
              color: "#fff",
            }}
          >
            {simState === "loading"
              ? "Fetching rate…"
              : `Swap ${fromToken.symbol} → ${toToken.symbol}`}
          </button>
        )}
      </div>

      {/* ── Preview modal ────────────────────────────────────────────────────── */}
      {showPreview && simData && (
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
                { label: "You send",        value: `${fromAmt} ${fromToken.symbol}`,  color: "#fff"                    },
                { label: "You receive",     value: `~${toAmt} ${toToken.symbol}`,     color: "#22C55E"                 },
                { label: "Exchange rate",   value: rateStr ?? "—",                    color: "rgba(255,255,255,0.65)"  },
                { label: "Min received",    value: `${minReceived} ${toToken.symbol}`, color: "rgba(255,255,255,0.5)"  },
                { label: "Ston.fi fee",     value: feeStr,                            color: "rgba(255,255,255,0.5)"  },
                { label: "Network fee",     value: "~0.1 TON",                        color: "rgba(255,255,255,0.5)"  },
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
