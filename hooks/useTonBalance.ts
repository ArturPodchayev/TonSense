"use client";

import { useTonAddress } from "@tonconnect/ui-react";
import { useEffect, useState } from "react";

export function useTonBalance() {
  const address = useTonAddress();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!address) return;

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

  return address ? balance : null;
}
