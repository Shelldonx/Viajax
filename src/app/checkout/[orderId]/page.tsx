"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import PaymentMethodSelector from "@/components/checkout/PaymentMethodSelector";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { ShoppingCart } from "lucide-react";

interface OrderData {
  id: string;
  product_id: string;
  product_title: string;
  amount_usd: number;
  amount_usdc: number;
  payment_status: string;
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/checkout/status/${params.orderId}`);
        if (!res.ok) {
          console.error("Checkout status error:", res.status);
          setOrder(null);
          return;
        }
        const data = await res.json();
        setOrder(data.order);
      } catch (erro) {
        console.error("Error loading checkout:", erro);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    }
    if (params.orderId) fetchOrder();
  }, [params.orderId]);

  function handleSuccess() {
    router.push(`/success/${params.orderId}`);
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner text="Loading checkout..." />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <ShoppingCart className="h-12 w-12 text-gray-600" />
        <h2 className="mt-4 text-xl font-semibold text-white">Order not found</h2>
        <p className="mt-2 text-gray-500">This order may have expired or the link is incorrect.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in mx-auto max-w-lg px-4 py-12 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-white">Checkout</h1>
        <p className="mt-1 text-gray-400">Complete your payment</p>
      </div>

      <PaymentMethodSelector
        orderId={order.id}
        amount={order.amount_usd}
        amountUsdc={order.amount_usdc}
        productTitle={order.product_title}
        productId={order.product_id}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
