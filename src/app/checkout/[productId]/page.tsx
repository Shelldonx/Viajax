"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import PaymentMethodSelector from "@/components/checkout/PaymentMethodSelector";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { ShoppingCart } from "lucide-react";

interface ProductData {
  id: string;
  title: string;
  price: number;
  category: string;
  cover_image?: string;
  creator_name?: string;
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${params.productId}`);
        if (!res.ok) {
          setProduct(null);
          return;
        }
        const data = await res.json();
        setProduct(data.product);
      } catch (erro) {
        console.error("Error loading product:", erro);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }
    if (params.productId) fetchProduct();
  }, [params.productId]);

  function handleSuccess(orderId: string) {
    router.push(`/success/${orderId}`);
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner text="Loading checkout..." />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <ShoppingCart className="h-12 w-12 text-gray-600" />
        <h2 className="mt-4 text-xl font-semibold text-white">Product not found</h2>
        <p className="mt-2 text-gray-500">This product may have been removed or the link is incorrect.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in mx-auto max-w-lg px-4 py-12 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-white">Checkout</h1>
        <p className="mt-1 text-gray-400">{product.title}</p>
      </div>

      <PaymentMethodSelector
        amount={product.price}
        amountUsdc={product.price}
        productTitle={product.title}
        productId={product.id}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
