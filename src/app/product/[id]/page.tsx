"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { BookOpen, ShoppingCart, User, Calendar } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  cover_image?: string;
  creator_name?: string;
  creator_id: string;
  sales_count: number;
  created_at: string;
}

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${params.id}`);
        if (!res.ok) throw new Error("Produto não encontrado");
        const data = await res.json();
        setProduct(data.product);
      } catch (erro) {
        console.error("Erro ao carregar produto:", erro);
      } finally {
        setLoading(false);
      }
    }
    if (params.id) fetchProduct();
  }, [params.id]);

  async function handleBuy() {
    if (!product) return;
    try {
      setBuying(true);
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      if (!res.ok) throw new Error("Erro ao criar checkout");
      const data = await res.json();
      router.push(`/checkout/${data.orderId}`);
    } catch (erro) {
      console.error("Erro ao iniciar compra:", erro);
      alert("Erro ao iniciar compra. Tenta novamente.");
    } finally {
      setBuying(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner text="Loading product..." />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <BookOpen className="h-12 w-12 text-gray-600" />
        <h2 className="mt-4 text-xl font-semibold text-white">Product not found</h2>
        <p className="mt-2 text-gray-500">This product may have been removed or the link is incorrect.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="grid gap-10 md:grid-cols-5">
        {/* Capa */}
        <div className="md:col-span-2">
          <div className="sticky top-24 aspect-[3/4] overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-800 to-gray-900">
            {product.cover_image ? (
              <img src={product.cover_image} alt={product.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <BookOpen className="h-16 w-16 text-gray-600" />
              </div>
            )}
          </div>
        </div>

        {/* Detalhes */}
        <div className="md:col-span-3">
          <Badge variant="teal">{product.category || "General"}</Badge>
          <h1 className="mt-3 text-3xl font-bold text-white">{product.title}</h1>

          <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {product.creator_name || "Creator"}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(product.created_at)}
            </span>
            <span className="flex items-center gap-1">
              <ShoppingCart className="h-4 w-4" />
              {product.sales_count} sales
            </span>
          </div>

          <div className="mt-6 rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm text-gray-500">Price</p>
                <p className="text-3xl font-extrabold text-teal-400">{formatCurrency(product.price)}</p>
              </div>
              <Button size="lg" loading={buying} onClick={handleBuy}>
                <ShoppingCart className="h-5 w-5" />
                Buy Now
              </Button>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-white">About this product</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-400">
              {product.description || "No description available."}
            </p>
          </div>

          {/* Trust badges */}
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { label: "Instant access", detail: "After payment" },
              { label: "Only 3% fee", detail: "Support the creator" },
              { label: "Secure payment", detail: "Crossmint + Solana" },
            ].map((badge) => (
              <div key={badge.label} className="rounded-xl border border-gray-800 bg-gray-900/30 p-3 text-center">
                <p className="text-xs font-medium text-white">{badge.label}</p>
                <p className="text-xs text-gray-600">{badge.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
