"use client";

import { useState } from "react";
import CardCheckout from "./CardCheckout";
import WalletCheckout from "./WalletCheckout";
import { ChevronRight } from "lucide-react";

interface PaymentMethodSelectorProps {
  orderId: string;
  amount: number;
  amountUsdc: number;
  productTitle: string;
  onSuccess: () => void;
}

export default function PaymentMethodSelector({
  orderId,
  amount,
  amountUsdc,
  productTitle,
  onSuccess,
}: PaymentMethodSelectorProps) {
  const [showCrypto, setShowCrypto] = useState(false);

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
      {!showCrypto ? (
        <>
          {/* Checkout com cartão — default, sem menção a crypto */}
          <CardCheckout
            orderId={orderId}
            amount={amount}
            productTitle={productTitle}
            onSuccess={onSuccess}
          />

          {/* Separador discreto + link crypto */}
          <div className="mt-8 border-t border-gray-800 pt-6">
            <button
              onClick={() => setShowCrypto(true)}
              className="flex w-full items-center justify-center gap-1 text-sm text-gray-600 transition-colors hover:text-teal-400"
            >
              Tens uma carteira Solana?{" "}
              <span className="font-medium text-teal-500/70 hover:text-teal-400">
                Pagar com crypto
              </span>
              <ChevronRight className="h-3 w-3 text-teal-500/70" />
            </button>
          </div>
        </>
      ) : (
        /* Checkout com carteira Solana */
        <WalletCheckout
          orderId={orderId}
          amountUsdc={amountUsdc}
          productTitle={productTitle}
          onSuccess={onSuccess}
          onBack={() => setShowCrypto(false)}
        />
      )}
    </div>
  );
}
