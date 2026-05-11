"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { CrossmintProvider, CrossmintEmbeddedCheckout } from "@crossmint/client-sdk-react-ui";
import Button from "@/components/ui/Button";
import { CreditCard, Loader2 } from "lucide-react";

const CROSSMINT_CLIENT_KEY = process.env.NEXT_PUBLIC_CROSSMINT_CLIENT_KEY || "";

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
  const [error, setError] = useState("");
  const [checkoutData, setCheckoutData] = useState<{
    viajaxOrderId: string;
    crossmintOrderId: string;
    clientSecret: string;
  } | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll our API for payment confirmation once checkout is shown
  const startPolling = useCallback(
    (viajaxOrderId: string) => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/checkout/status/${viajaxOrderId}`);
          if (!res.ok) return;
          const data = await res.json();
          if (data.order?.payment_status === "confirmed") {
            if (pollingRef.current) clearInterval(pollingRef.current);
            onSuccess(viajaxOrderId);
          }
        } catch {
          // Keep polling
        }
      }, 4000);
    },
    [onSuccess]
  );

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  async function handleInitCheckout() {
    setError("");
    setLoading(true);

    try {
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
        throw new Error(data.error || data.crossmintError || "Error creating payment");
      }

      const data = await res.json();

      if (data.crossmintError) {
        throw new Error(data.crossmintError);
      }

      if (!data.crossmintOrderId || !data.clientSecret) {
        throw new Error("Card payment setup failed. Please try wallet payment.");
      }

      setCheckoutData({
        viajaxOrderId: data.orderId,
        crossmintOrderId: data.crossmintOrderId,
        clientSecret: data.clientSecret,
      });

      // Start polling for payment confirmation
      startPolling(data.orderId);
    } catch (err) {
      setError((err as Error).message || "Error processing payment.");
    } finally {
      setLoading(false);
    }
  }

  // Show embedded Crossmint checkout
  if (checkoutData) {
    return (
      <div className="space-y-4">
        <CrossmintProvider apiKey={CROSSMINT_CLIENT_KEY}>
          <div className="rounded-xl overflow-hidden border border-gray-800">
            <CrossmintEmbeddedCheckout
              orderId={checkoutData.crossmintOrderId}
              clientSecret={checkoutData.clientSecret}
              payment={{
                receiptEmail: buyerEmail || undefined,
                crypto: { enabled: false },
                fiat: { enabled: true },
                defaultMethod: "fiat",
              }}
            />
          </div>
        </CrossmintProvider>

        <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Waiting for payment confirmation...</span>
        </div>
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
        onClick={handleInitCheckout}
      >
        <CreditCard className="h-4 w-4" />
        Pay ${Number(amount).toFixed(2)} with Card
      </Button>
    </div>
  );
}
