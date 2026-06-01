"use client";

import { useState, useEffect, useRef } from "react";
import { useTonConnectUI, useTonAddress, useTonWallet } from "@tonconnect/ui-react";
import { DEX, pTON } from "@ston-fi/sdk";
import { TonClient } from "@ton/ton";
import { toNano } from "@ton/core";
import { useTonBalance } from "@/hooks/useTonBalance";
import { TONSENSE_REFERRAL_ADDRESS } from "@/lib/referral";

// ── Token list ────────────────────────────────────────────────────────────────

interface Token {
  symbol: string;
  display_name: string;
  contract_address: string;
  decimals: number;
  kind: string;
  image_url: string;
}

const TOKENS: Token[] = [
  { symbol: "TON",   display_name: "Toncoin",         contract_address: "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c",   decimals: 9, kind: "Ton",    image_url: "https://assets.ston.fi/images/EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c/image.png" },
  { symbol: "USDT",  display_name: "Tether USD",       contract_address: "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs", decimals: 6, kind: "Jetton", image_url: "https://assets.ston.fi/images/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs/image.png" },
  { symbol: "USDC",  display_name: "USD Coin",         contract_address: "EQC61aVMaYWNMNFMDFKHHsAiAWiNDjzfA0KwUyc5UUQBE1Vq", decimals: 6, kind: "Jetton", image_url: "https://assets.ston.fi/images/EQC61aVMaYWNMNFMDFKHHsAiAWiNDjzfA0KwUyc5UUQBE1Vq/image.png" },
  { symbol: "tsTON", display_name: "Tonstakers TON",   contract_address: "EQC98_qAmNEptmzSMQMHMgMKUFSf14sHBSKhHCnIBFqRoGS6",  decimals: 9, kind: "Jetton", image_url: "https://assets.ston.fi/images/EQC98_qAmNEptmzSMQMHMgMKUFSf14sHBSKhHCnIBFqRoGS6/image.png" },
  { symbol: "NOT",   display_name: "Notcoin",          contract_address: "EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT",   decimals: 9, kind: "Jetton", image_url: "https://assets.ston.fi/images/EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT/image.png" },
  { symbol: "SCALE", display_name: "Ston.fi",          contract_address: "EQBlqsm144Dq6SjbPI4jjZvA1hqTIP3CvHovbIfW_t-SCALE",   decimals: 9, kind: "Jetton", image_url: "https://assets.ston.fi/images/EQBlqsm144Dq6SjbPI4jjZvA1hqTIP3CvHovbIfW_t-SCALE/image.png" },
];

// ── TokenIcon ─────────────────────────────────────────────────────────────────

function TokenIcon({ token, size }: { token: Token; size: number }) {
  return (
    <img
      src={token.image_url}
      alt={token.symbol}
      width={size}
      height={size}
      style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0, width: size, height: size }}
      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
    />
  );
}

// ── TokenPicker modal ─────────────────────────────────────────────────────────

interface TokenPickerProps {
  exclude: Token;
  selected: Token;
  onSelect: (t: Token) => void;
  onClose: () => void;
}

function TokenPicker({ exclude, selected, onSelect, onClose }: TokenPickerProps) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%", maxWidth: 340, maxHeight: 400, overflowY: "auto",
          borderRadius: 20,
          background: "#0d0d1a",
          border: "1px solid rgba(255,255,255,0.14)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.85)",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
            Select Token
          </p>
        </div>

        {TOKENS.filter(t => t.contract_address !== exclude.contract_address).map((t, i, arr) => {
          const isSelected = t.contract_address === selected.contract_address;
          return (
            <button
              key={t.contract_address}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px", cursor: "pointer",
                background: isSelected ? "rgba(0,152,234,0.1)" : "transparent",
                border: "none",
                borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                textAlign: "left",
              }}
              onClick={() => onSelect(t)}
              onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isSelected ? "rgba(0,152,234,0.1)" : "transparent"; }}
            >
              <TokenIcon token={t} size={36} />
              <div style={{ flex: 1 }}>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{t.symbol}</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{t.display_name}</div>
              </div>
              {isSelected && (
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#0098EA", flexShrink: 0 }} />
              )}
            </button>
          );
        })}
      </div>
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
  const [pickerFor, setPickerFor] = useState<"from" | "to" | null>(null);

  const [simState, setSimState] = useState<SimState>("idle");
  const [simData,  setSimData]  = useState<SimResult | null>(null);
  const [txState,  setTxState]  = useState<TxState>("idle");
  const [errMsg,   setErrMsg]   = useState("");

  const [showPreview, setShowPreview] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Preload token images so the picker has no load flash
  useEffect(() => {
    TOKENS.forEach(t => {
      if (t.image_url) { const img = new Image(); img.src = t.image_url; }
    });
  }, []);

  // Fetch TON price for USD estimates
  useEffect(() => {
    fetch("/api/ton-price")
      .then(r => r.json())
      .then(d => setTonPrice(d.price ?? 0))
      .catch(() => {});
  }, []);

  async function runSimulate() {
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
  }, [fromAmt, fromToken.contract_address, toToken.contract_address]);

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
    if (!walletAddress || !simData) return;
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
          referralAddress:  TONSENSE_REFERRAL_ADDRESS,
        });
      } else if (toToken.kind === "Ton") {
        const offerUnits = BigInt(Math.round(parseFloat(fromAmt) * 10 ** fromToken.decimals));
        txParams = await router.getSwapJettonToTonTxParams({
          userWalletAddress:  walletAddress,
          offerJettonAddress: fromToken.contract_address,
          offerAmount:        offerUnits,
          proxyTon,
          minAskAmount:       minAsk,
          referralAddress:    TONSENSE_REFERRAL_ADDRESS,
        });
      } else {
        const offerUnits = BigInt(Math.round(parseFloat(fromAmt) * 10 ** fromToken.decimals));
        txParams = await router.getSwapJettonToJettonTxParams({
          userWalletAddress:  walletAddress,
          offerJettonAddress: fromToken.contract_address,
          offerAmount:        offerUnits,
          askJettonAddress:   toToken.contract_address,
          minAskAmount:       minAsk,
          referralAddress:    TONSENSE_REFERRAL_ADDRESS,
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

  // ── Derived values ─────────────────────────────────────────────────────────

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
    if (toToken.symbol.toUpperCase().includes("USD")) return `≈ $${n.toFixed(2)}`;
    if (tonPrice && (toToken.kind === "Ton" || toToken.symbol.toUpperCase() === "TSTON"))
      return `≈ $${(n * tonPrice).toFixed(2)}`;
    return "";
  })();

  const showFromBalance = wallet && tonBalance !== null && fromToken.kind === "Ton";

  // ── Token selector button ──────────────────────────────────────────────────

  function TokenButton({ token, side }: { token: Token; side: "from" | "to" }) {
    return (
      <button
        onClick={() => setPickerFor(side)}
        className="flex items-center gap-2 rounded-xl flex-shrink-0"
        style={{ padding: "8px 12px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
      >
        <TokenIcon token={token} size={24} />
        <span style={{ fontWeight: 600, fontSize: 14 }}>{token.symbol}</span>
        <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>▾</span>
      </button>
    );
  }

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
        <div className="rounded-2xl" style={{ ...glass, padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <TokenButton token={fromToken} side="from" />
            <input
              type="number"
              placeholder="0"
              min="0"
              value={fromAmt}
              onChange={e => setFromAmt(e.target.value)}
              style={{
                flex: 1, minWidth: 0,
                background: "transparent", border: "none", outline: "none",
                textAlign: "right", fontSize: 24, fontWeight: 700, color: "#fff",
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
              color: "#0098EA", fontSize: 18,
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
            <TokenButton token={toToken} side="to" />
            <div style={{
              flex: 1, minWidth: 0, textAlign: "right",
              fontSize: 24, fontWeight: 700,
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

        {/* ── No liquidity ──────────────────────────────────────────────────── */}
        {simState === "error" && fromAmt && (
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textAlign: "center" }}>
            No liquidity for this pair
          </p>
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
            {simState === "loading" ? "Fetching rate…" : `Swap ${fromToken.symbol} → ${toToken.symbol}`}
          </button>
        )}
      </div>

      {/* ── Token picker modal ───────────────────────────────────────────────── */}
      {pickerFor !== null && (
        <TokenPicker
          exclude={pickerFor === "from" ? toToken : fromToken}
          selected={pickerFor === "from" ? fromToken : toToken}
          onSelect={t => {
            if (pickerFor === "from") {
              setFromToken(t);
            } else {
              setToToken(t);
            }
            setSimData(null);
            setToAmt("");
            setSimState("idle");
            setPickerFor(null);
          }}
          onClose={() => setPickerFor(null)}
        />
      )}

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
