"use client";

import { TonConnectButton, useTonAddress, useTonWallet } from "@tonconnect/ui-react";
import { useEffect, useState } from "react";

export default function WalletButton() {
  const [mounted, setMounted] = useState(false);
  const wallet = useTonWallet();
  const address = useTonAddress();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!address) {
      setBalance(null);
      return;
    }
    fetch(`https://tonapi.io/v2/accounts/${address}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.balance) {
          const ton = Math.floor(parseInt(data.balance) / 1e7) / 100;
          setBalance(ton);
        }
      })
      .catch(() => setBalance(null));
  }, [address]);

  if (!mounted) return null;

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {wallet && balance !== null && (
        <>
          {/* Desktop */}
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
            style={{
              background: "rgba(0,152,234,0.1)",
              border: "1px solid rgba(0,152,234,0.2)",
            }}
          >
            <span className="text-white/50 text-xs">Balance</span>
            <span className="text-[#0098EA] font-bold">{balance.toFixed(2)} TON</span>
          </div>
        </>
      )}
      <TonConnectButton />
    </div>
  );
}
