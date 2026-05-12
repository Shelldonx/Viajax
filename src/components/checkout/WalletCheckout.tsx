"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Wallet, Check, Loader2, Copy, ExternalLink } from "lucide-react";
import { truncateAddress, formatUsdc } from "@/lib/utils";

interface WalletCheckoutProps {
  amountUsdc: number;
  productId: string;
  productTitle: string;
  onSuccess: (orderId: string) => void;
  onBack: () => void;
}

const PLATFORM_WALLET = process.env.NEXT_PUBLIC_PLATFORM_WALLET || "FMfitdfABAD4Vgbw7G81TKyf5xX8VjSLEGEZ6Ei52Qwm";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export default function WalletCheckout({ amountUsdc, productId, productTitle, onSuccess, onBack }: WalletCheckoutProps) {
  const { publicKey, connected } = useWallet();
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [txSignature, setTxSignature] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleVerifyPayment() {
    if (!txSignature) {
      setError("Please enter the transaction signature");
      return;
    }

    setVerifying(true);
    setError("");

    try {
      // Create order first
      const createRes = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          buyerEmail: publicKey?.toBase58() || "",
          paymentMethod: "wallet",
        }),
      });

      if (!createRes.ok) throw new Error("Error creating order");
      const createData = await createRes.json();
      const viajaxOrderId = createData.orderId;

      // Verify the transaction
      const res = await fetch("/api/checkout/verify-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: viajaxOrderId,
          txSignature: txSignature.trim(),
          walletAddress: publicKey?.toBase58() || "",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Verification failed");
      }

      onSuccess(viajaxOrderId);
    } catch (err) {
      setError((err as Error).message || "Error verifying payment");
      setVerifying(false);
    }
  }

  function copyAddress() {
    navigator.clipboard.writeText(PLATFORM_WALLET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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
      <div className="mb-2">
        <h3 className="text-lg font-semibold text-white">Pay with Solana Wallet</h3>
        <p className="mt-1 text-sm text-gray-400">
          Send USDC directly — no swap needed if you already have USDC.
        </p>
      </div>

      {!connected ? (
        <div className="flex flex-col items-center gap-4 py-6">
          <Wallet className="h-12 w-12 text-gray-600" />
          <p className="text-sm text-gray-400">Connect Phantom or Solflare Wallet</p>
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

          {/* Payment instructions */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">Send exactly</p>
              <p className="text-3xl font-bold text-teal-400 mt-1">{formatUsdc(amountUsdc)} USDC</p>
              <p className="text-xs text-gray-600 mt-1">to the address below</p>
            </div>

            {/* Wallet address */}
            <div className="rounded-lg bg-gray-950 p-3">
              <div className="flex items-center justify-between gap-2">
                <code className="text-xs text-gray-300 break-all flex-1">{PLATFORM_WALLET}</code>
                <button
                  onClick={copyAddress}
                  className="p-2 text-gray-500 hover:text-white transition-colors"
                  title="Copy address"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              {copied && <p className="text-xs text-green-400 mt-2">Address copied!</p>}
            </div>

            {/* USDC Mint info */}
            <div className="rounded-lg bg-gray-950 p-3">
              <p className="text-xs text-gray-500 mb-1">Make sure you send USDC on Solana Mainnet:</p>
              <div className="flex items-center justify-between gap-2">
                <code className="text-xs text-gray-300 break-all flex-1">{USDC_MINT}</code>
                <a
                  href={`https://solscan.io/token/${USDC_MINT}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-500 hover:text-white transition-colors"
                  title="View on Solscan"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Steps */}
            <ol className="text-xs text-gray-400 space-y-2 list-decimal list-inside">
              <li>Open your wallet (Phantom/Solflare)</li>
              <li>Send <span className="text-teal-400">{formatUsdc(amountUsdc)} USDC</span> to the address above</li>
              <li>Make sure it's on Solana Mainnet</li>
              <li>Copy the transaction signature after sending</li>
              <li>Paste it below and click Verify</li>
            </ol>
          </div>

          {/* Transaction signature input */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Transaction Signature
            </label>
            <input
              type="text"
              value={txSignature}
              onChange={(e) => setTxSignature(e.target.value)}
              placeholder="Paste your transaction signature here..."
              className="w-full rounded-xl border border-gray-700 bg-gray-800/50 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            onClick={handleVerifyPayment}
            disabled={!txSignature || verifying}
            className="w-full rounded-xl bg-teal-500 px-4 py-3 text-sm font-medium text-white hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {verifying ? "Verifying..." : "Verify Payment"}
          </button>
        </div>
      )}
    </div>
  );
}
