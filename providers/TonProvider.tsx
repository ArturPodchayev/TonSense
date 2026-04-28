"use client";

import { TonConnectUIProvider } from "@tonconnect/ui-react";

export default function TonProvider({ children }: { children: React.ReactNode }) {
  return (
    <TonConnectUIProvider manifestUrl="https://tonsense.app/tonconnect-manifest.json">
      {children}
    </TonConnectUIProvider>
  );
}
