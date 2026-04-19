import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import TonProvider from "@/providers/TonProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "TonSense — TON Staking Calculator",
  description: "See what you missed. Plan what's next. AI-powered DeFi analytics for TON blockchain.",
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: "TonSense — TON Staking Calculator",
    description: "See what you missed. Plan what's next.",
    url: "https://tonsense.vercel.app",
    siteName: "TonSense",
    images: [{ url: "/logo.png", width: 1200, height: 630 }],
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
        <link rel="icon" href="/logo.png?v=2" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className="min-h-screen bg-[#0A0A0F] text-white antialiased">
        <TonProvider>{children}</TonProvider>
      </body>
    </html>
  );
}
