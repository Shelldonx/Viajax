import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AppProviders from "@/components/providers/AppProviders";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Viajax — Creator Marketplace on Solana",
  description: "Open-source marketplace for creators to sell low-ticket digital products. Only 3% fee, payouts in USDC on Solana Mainnet, AI-powered content creation with GPT-4o.",
  keywords: ["digital products", "marketplace", "creators", "Solana", "USDC", "low ticket", "AI"],
  openGraph: {
    title: "Viajax — Creator Marketplace on Solana",
    description: "Sell your digital products with only 3% fee. Get paid in USDC.",
    url: "https://viajax.es",
    siteName: "Viajax",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-gray-950 text-white">
        <AppProviders>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </AppProviders>
      </body>
    </html>
  );
}
