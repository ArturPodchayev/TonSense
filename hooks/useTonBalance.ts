"use client";

import { useTonAddress } from "@tonconnect/ui-react";
import { useEffect, useState } from "react";

export function useTonBalance() {
  const address = useTonAddress();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!address) {
      setBalance(null);
      return;
    }
    fetch(`https://tonapi.io/v2/accounts/${address}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.balance) {
          const ton = parseFloat((parseInt(data.balance) / 1e9).toFixed(2));
          setBalance(ton);
        }
      })
      .catch(() => setBalance(null));
  }, [address]);

  return balance;
}
