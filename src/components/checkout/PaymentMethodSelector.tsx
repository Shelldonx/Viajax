"use client";

import { useState } from "react";
import CardCheckout from "./CardCheckout";
import WalletCheckout from "./WalletCheckout";
import { ChevronRight, CreditCard, Lock, ArrowLeft } from "lucide-react";

interface PaymentMethodSelectorProps {
  amount: number;
  amountUsdc: number;
  productTitle: string;
  productId: string;
  onSuccess: (orderId: string) => void;
}

export default function PaymentMethodSelector({
  amount,
  amountUsdc,
  productTitle,
  productId,
  onSuccess,
}: PaymentMethodSelectorProps) {
  const [mode, setMode] = useState<"card" | "wallet">("card");
  const [email, setEmail] = useState("");

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/50 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/80 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Secure Payment</h3>
            <p className="text-sm text-gray-400">{productTitle}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-teal-400">${Number(amount).toFixed(2)}</p>
            <p className="text-xs text-gray-500">USDC</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {mode === "card" ? (
          <>
            {/* Email field */}
            <div className="mb-5">
              <label htmlFor="buyer-email" className="mb-1.5 block text-sm font-medium text-gray-300">
                Email address
              </label>
              <input
                id="buyer-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-xl border border-gray-700 bg-gray-800/50 px-4 py-2.5 text-sm text-white placeholder-gray-500 transition-colors focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50"
              />
              <p className="mt-1 text-xs text-gray-600">We&apos;ll send your purchase receipt here</p>
            </div>

            {/* Card checkout */}
            <CardCheckout
              amount={amount}
              productTitle={productTitle}
              productId={productId}
              buyerEmail={email}
              onSuccess={onSuccess}
            />

            {/* Security badge */}
            <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-600">
              <Lock className="h-3 w-3" />
              <span>Secure payment via Crossmint — powered by Solana</span>
            </div>

            {/* Crypto option */}
            <div className="mt-6 border-t border-gray-800 pt-5">
              <button
                onClick={() => setMode("wallet")}
                className="flex w-full items-center justify-center gap-1 text-sm text-gray-500 transition-colors hover:text-teal-400"
              >
                Have a Solana wallet?{" "}
                <span className="font-medium text-teal-500/70 hover:text-teal-400">
                  Pay with crypto
                </span>
                <ChevronRight className="h-3 w-3 text-teal-500/70" />
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Back button */}
            <button
              onClick={() => setMode("card")}
              className="mb-4 flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <CreditCard className="h-3.5 w-3.5" />
              Back to card payment
            </button>

            {/* Wallet checkout */}
            <WalletCheckout
              amountUsdc={amountUsdc}
              productId={productId}
              productTitle={productTitle}
              onSuccess={onSuccess}
              onBack={() => setMode("card")}
            />
          </>
        )}
      </div>
    </div>
  );
}
