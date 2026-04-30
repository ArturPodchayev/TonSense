import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import TonProvider from "@/providers/TonProvider";
import TmaProvider from "@/providers/TmaProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "TonSense — TON Staking Calculator",
  description: "See what you missed. Plan what's next. AI-powered DeFi analytics for TON blockchain.",
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: "TonSense — AI-powered TON DeFi Dashboard",
    description: "See what you missed. Plan what's next. Stake, swap, and analyze TON with AI.",
    url: "https://tonsense.app",
    siteName: "TonSense",
    images: [{ url: "https://tonsense.app/api/og", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://tonsense.app/api/og"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="min-h-screen bg-[#0A0A0F] text-white antialiased">
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        <TonProvider>
          <TmaProvider>{children}</TmaProvider>
        </TonProvider>
      </body>
    </html>
  );
}
