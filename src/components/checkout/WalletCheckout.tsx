"use client";

import { useState, useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Script from "next/script";
import { Wallet, Check, Loader2 } from "lucide-react";
import { truncateAddress, formatUsdc } from "@/lib/utils";

interface WalletCheckoutProps {
  amountUsdc: number;
  productId: string;
  productTitle: string;
  onSuccess: (orderId: string) => void;
  onBack: () => void;
}

export default function WalletCheckout({ amountUsdc, productId, productTitle, onSuccess, onBack }: WalletCheckoutProps) {
  const { publicKey, connected } = useWallet();
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [jupLoaded, setJupLoaded] = useState(false);
  const jupInitialized = useRef(false);
  const orderIdRef = useRef<string | null>(null);

  // Initialize Jupiter Terminal when wallet connects and script is loaded
  useEffect(() => {
    if (!connected || !publicKey || !jupLoaded || jupInitialized.current) return;

    const jupWindow = window as unknown as { Jupiter?: { init: (cfg: Record<string, unknown>) => void } };
    if (!jupWindow.Jupiter) return;

    jupInitialized.current = true;

    const amountMicro = String(Math.floor(amountUsdc * 1_000_000));
    const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

    // Use Helius RPC if available, otherwise fallback to a browser-friendly public RPC
    const rpcEndpoint = process.env.NEXT_PUBLIC_SOLANA_RPC || "https://solana-mainnet.g.alchemy.com/v2/demo";

    jupWindow.Jupiter.init({
      displayMode: "integrated",
      integratedTargetId: "jupiter-terminal-container",
      endpoint: rpcEndpoint,
      strictTokenList: false,
      defaultExplorer: "Solscan",
      formProps: {
        initialOutputMint: USDC_MINT,
        fixedOutputMint: true,
        initialAmount: amountMicro,
      },
      onSuccess: async ({ txid }: { txid: string }) => {
        console.log(`[Jupiter] Swap success: ${txid}`);
        setVerifying(true);
        setError("");
        try {
          // First create the order in our DB
          const createRes = await fetch("/api/checkout/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productId,
              buyerEmail: publicKey.toBase58(),
              paymentMethod: "wallet",
            }),
          });
          if (!createRes.ok) throw new Error("Error creating order");
          const createData = await createRes.json();
          const viajaxOrderId = createData.orderId;
          orderIdRef.current = viajaxOrderId;

          // Then verify the wallet payment
          const res = await fetch("/api/checkout/verify-wallet", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: viajaxOrderId,
              txSignature: txid,
              walletAddress: publicKey.toBase58(),
            }),
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Verification error");
          }
          onSuccess(viajaxOrderId);
        } catch (err) {
          setError((err as Error).message || "Error verifying payment");
          setVerifying(false);
        }
      },
      onSwapError: ({ error: swapError }: { error: string }) => {
        console.error(`[Jupiter] Swap error: ${swapError}`);
        setError(`Swap error: ${swapError}`);
      },
    });
  }, [connected, publicKey, jupLoaded, amountUsdc, productId, onSuccess]);

  // Reset when wallet disconnects
  useEffect(() => {
    if (!connected) {
      jupInitialized.current = false;
    }
  }, [connected]);

  if (verifying) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
        <p className="text-sm font-medium text-white">Verifying payment on Solana Mainnet...</p>
        <p className="text-xs text-gray-500">Confirming your USDC transaction on-chain</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Script
        src="https://terminal.jup.ag/main-v3.js"
        onLoad={() => setJupLoaded(true)}
        strategy="lazyOnload"
      />

      <div className="mb-2">
        <h3 className="text-lg font-semibold text-white">Pay with Solana Wallet</h3>
        <p className="mt-1 text-sm text-gray-400">
          Pay with SOL, USDC, or any token — Jupiter converts automatically.
        </p>
      </div>

      {!connected ? (
        <div className="flex flex-col items-center gap-4 py-6">
          <Wallet className="h-12 w-12 text-gray-600" />
          <p className="text-sm text-gray-400">Connect Phantom, Solflare, or Coinbase Wallet</p>
          <WalletMultiButton className="!bg-teal-500 !rounded-xl !font-semibold hover:!bg-teal-600" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Connected wallet badge */}
          <div className="flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 p-3">
            <Check className="h-4 w-4 text-green-400" />
            <span className="text-sm text-green-400">
              Connected: {truncateAddress(publicKey?.toBase58() || "")}
            </span>
          </div>

          {/* Amount display */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-center">
            <p className="text-sm text-gray-500">Total to pay</p>
            <p className="text-2xl font-bold text-teal-400">{formatUsdc(amountUsdc)} USDC</p>
            <p className="mt-1 text-xs text-gray-600">You can swap from any Solana token</p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Jupiter Terminal Container */}
          <div
            id="jupiter-terminal-container"
            className="min-h-[400px] rounded-xl border border-gray-800 bg-gray-950"
          />
        </div>
      )}
    </div>
  );
}
