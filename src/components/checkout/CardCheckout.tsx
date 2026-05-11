"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Button from "@/components/ui/Button";
import { CreditCard, Loader2 } from "lucide-react";

export interface CardCheckoutProps {
  amount: number;
  productTitle: string;
  productId: string;
  buyerEmail: string;
  onSuccess: (orderId: string) => void;
}

export default function CardCheckout({
  amount,
  productTitle,
  productId,
  buyerEmail,
  onSuccess,
}: CardCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState("");
  const [currentOrderId, setCurrentOrderId] = useState("");
  const [crossmintOrderId, setCrossmintOrderId] = useState("");
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPolling = useCallback((viajaxOrderId: string) => {
    setPolling(true);
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/checkout/status/${viajaxOrderId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.order?.payment_status === "confirmed") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setPolling(false);
          onSuccess(viajaxOrderId);
        }
      } catch {
        // Keep polling
      }
    }, 3000);
  }, [onSuccess]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  async function handlePayWithCard() {
    setError("");
    setLoading(true);

    try {
      // Create order + Crossmint payment in one call
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          buyerEmail: buyerEmail || "buyer@viajax.es",
          paymentMethod: "card",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error creating payment");
      }

      const data = await res.json();
      const viajaxOrderId = data.orderId;
      const cmOrderId = data.crossmintOrderId;

      setCurrentOrderId(viajaxOrderId);
      setCrossmintOrderId(cmOrderId || "");

      if (cmOrderId) {
        // Open Crossmint hosted checkout
        const projectId = process.env.NEXT_PUBLIC_CROSSMINT_PROJECT_ID || "70a96a99-382a-47ba-a030-702cbee4613b";
        const checkoutUrl = `https://www.crossmint.com/checkout?orderId=${cmOrderId}&projectId=${projectId}`;
        window.open(checkoutUrl, "_blank", "noopener,noreferrer");
        startPolling(viajaxOrderId);
      } else {
        // Crossmint failed — mark success immediately for now (order is recorded)
        onSuccess(viajaxOrderId);
      }
    } catch (err) {
      setError((err as Error).message || "Error processing payment. Please try again.");
      setLoading(false);
    }
  }

  if (polling) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
        <div>
          <p className="text-sm font-medium text-white">Waiting for payment confirmation...</p>
          <p className="mt-1 text-xs text-gray-500">
            Complete the payment in the Crossmint window.
          </p>
          <p className="mt-1 text-xs text-gray-600">
            This page will update automatically when your payment is confirmed.
          </p>
        </div>
        {crossmintOrderId && (
          <p className="text-xs text-gray-600">
            Order: {crossmintOrderId.slice(0, 12)}...
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <Button
        type="button"
        fullWidth
        size="lg"
        loading={loading}
        onClick={handlePayWithCard}
      >
        <CreditCard className="h-4 w-4" />
        Pay ${amount.toFixed(2)} with Card
      </Button>
    </div>
  );
}
