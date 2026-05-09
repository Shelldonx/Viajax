"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Button from "@/components/ui/Button";
import { Wallet, Check, ArrowLeft } from "lucide-react";
import { truncateAddress, formatUsdc } from "@/lib/utils";

interface WalletCheckoutProps {
  orderId: string;
  amountUsdc: number;
  productTitle: string;
  onSuccess: () => void;
  onBack: () => void;
}

export default function WalletCheckout({ orderId, amountUsdc, productTitle, onSuccess, onBack }: WalletCheckoutProps) {
  const { publicKey, connected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePay() {
    if (!publicKey) return;
    setError("");
    setLoading(true);

    try {
      // Verificar pagamento com wallet via API
      const res = await fetch("/api/checkout/verify-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          walletAddress: publicKey.toBase58(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Verification error");
      }

      onSuccess();
    } catch (erro) {
      setError((erro as Error).message || "Error processing payment. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">Pay with Solana wallet</h3>
        <p className="text-sm text-gray-500">{productTitle}</p>
      </div>

      {!connected ? (
        <div className="flex flex-col items-center gap-4 py-6">
          <Wallet className="h-12 w-12 text-gray-600" />
          <p className="text-sm text-gray-400">Connect your wallet to pay</p>
          <WalletMultiButton className="!bg-teal-500 !rounded-xl !font-semibold hover:!bg-teal-600" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 p-3">
            <Check className="h-4 w-4 text-green-400" />
            <span className="text-sm text-green-400">
              Wallet: {truncateAddress(publicKey?.toBase58() || "")}
            </span>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-center">
            <p className="text-sm text-gray-500">Total to pay</p>
            <p className="text-2xl font-bold text-teal-400">{formatUsdc(amountUsdc)} USDC</p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <Button fullWidth size="lg" loading={loading} onClick={handlePay}>
            Pay {formatUsdc(amountUsdc)} USDC via Jupiter
          </Button>
        </div>
      )}

      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to card payment
      </button>
    </div>
  );
}
