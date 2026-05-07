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
  description: "Marketplace open source para creators venderem eBooks digitais. Taxa de apenas 3%, payouts em USDC na Solana Mainnet, AI para criar conteúdo com GPT-4o.",
  keywords: ["eBooks", "marketplace", "creators", "Solana", "USDC", "digital products"],
  openGraph: {
    title: "Viajax — Creator Marketplace on Solana",
    description: "Vende os teus eBooks com taxa de apenas 3%. Recebe em USDC.",
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
      lang="pt"
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
