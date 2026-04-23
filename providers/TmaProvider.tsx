"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready(): void;
        expand(): void;
        setHeaderColor(color: string): void;
        setBackgroundColor(color: string): void;
      };
    };
  }
}

export default function TmaProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      tg.setHeaderColor("#080810");
      tg.setBackgroundColor("#080810");
    }
  }, []);

  return <>{children}</>;
}
