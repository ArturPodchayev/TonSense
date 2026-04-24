"use client";

import { useState } from "react";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";

interface TxData {
  validUntil: number;
  messages: Array<{ address: string; amount: string; payload?: string }>;
}

interface TxButtonProps {
  label: string;
  amountTon: number;
  buildTx: () => TxData;
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
  onSuccess,
  onError,
  disabled,
  className = "",
}: TxButtonProps) {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("Failed. Try again");

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

  async function handleClick() {
    if (disabled || status === "loading") return;

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
  );
}
