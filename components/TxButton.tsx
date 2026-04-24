"use client";

import { useState } from "react";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";

interface TxData {
  validUntil: number;
  messages: Array<{ address: string; amount: string; payload?: string }>;
}

interface SimulationData {
  send: string;
  receive: string;
  receiveToken: string;
  fee: string;
}

interface TxButtonProps {
  label: string;
  amountTon: number;
  buildTx: () => TxData;
  simulationData?: SimulationData;
  onSuccess?: () => void;
  onError?: (e: Error) => void;
  disabled?: boolean;
  className?: string;
}

type Status = "idle" | "loading" | "success" | "error";

export default function TxButton({
  label,
  amountTon,
  buildTx,
  simulationData,
  onSuccess,
  onError,
  disabled,
  className = "",
}: TxButtonProps) {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("Failed. Try again");
  const [showSim, setShowSim] = useState(false);

  if (!wallet) {
    return (
      <button
        disabled
        className={`flex items-center justify-center py-3 rounded-xl text-sm font-semibold opacity-40 cursor-not-allowed ${className}`}
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "rgba(255,255,255,0.5)",
        }}
      >
        Connect wallet first
      </button>
    );
  }

  async function sendTx() {
    let txData: TxData;
    try {
      txData = buildTx();
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Invalid transaction");
      setErrorMsg(err.message);
      setStatus("error");
      onError?.(err);
      setTimeout(() => setStatus("idle"), 3000);
      return;
    }

    setStatus("loading");
    try {
      await tonConnectUI.sendTransaction(txData);
      setStatus("success");
      onSuccess?.();
      setTimeout(() => setStatus("idle"), 3000);
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Transaction failed");
      setErrorMsg("Failed. Try again");
      setStatus("error");
      onError?.(err);
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  function handleClick() {
    if (disabled || status === "loading") return;
    if (simulationData) {
      setShowSim(true);
    } else {
      sendTx();
    }
  }

  function handleConfirm() {
    setShowSim(false);
    sendTx();
  }

  if (status === "success") {
    return (
      <button
        disabled
        className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold ${className}`}
        style={{
          background: "rgba(34,197,94,0.15)",
          border: "1px solid rgba(34,197,94,0.4)",
          color: "#22C55E",
        }}
      >
        Transaction sent! ✓
      </button>
    );
  }

  if (status === "error") {
    return (
      <button
        disabled
        className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold ${className}`}
        style={{
          background: "rgba(239,68,68,0.12)",
          border: "1px solid rgba(239,68,68,0.35)",
          color: "#EF4444",
        }}
      >
        {errorMsg}
      </button>
    );
  }

  if (status === "loading") {
    return (
      <button
        disabled
        className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold ${className}`}
        style={{
          background: "rgba(0,152,234,0.15)",
          border: "1px solid rgba(0,152,234,0.3)",
          color: "rgba(255,255,255,0.7)",
        }}
      >
        <span className="w-4 h-4 border-2 border-white/30 border-t-white/80 rounded-full animate-spin flex-shrink-0" />
        Confirming in wallet...
      </button>
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 ${className}`}
        style={{
          background: "linear-gradient(135deg, #0098EA, #0077BB)",
          boxShadow: "0 4px 20px rgba(0,152,234,0.3)",
          color: "#fff",
        }}
      >
        {label}
      </button>

      {showSim && simulationData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowSim(false)}
        >
          <div
            className="w-full max-w-sm"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 20,
              padding: 24,
              animation: "txSimIn 200ms ease both",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <style>{`
              @keyframes txSimIn {
                from { opacity: 0; transform: translateY(20px); }
                to   { opacity: 1; transform: translateY(0); }
              }
            `}</style>

            <p style={{ color: "#fff", fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
              Transaction Preview
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>📤 You send</span>
                <span style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>
                  {simulationData.send} TON
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>📥 You receive</span>
                <span style={{ color: "#22C55E", fontSize: 14, fontWeight: 600 }}>
                  ~{simulationData.receive} {simulationData.receiveToken}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>⛽ Network fee</span>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
                  ~{simulationData.fee} TON
                </span>
              </div>
            </div>

            <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "16px 0" }} />

            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, textAlign: "center", marginBottom: 16 }}>
              Actual amounts may vary slightly
            </p>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setShowSim(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.01]"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.75)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.01]"
                style={{
                  background: "linear-gradient(135deg, #0098EA, #0077BB)",
                  boxShadow: "0 4px 20px rgba(0,152,234,0.3)",
                  color: "#fff",
                }}
              >
                Confirm & Open Wallet
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
