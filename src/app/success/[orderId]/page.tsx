"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { CheckCircle, Download, ArrowRight } from "lucide-react";

interface SuccessData {
  product_title: string;
  amount_usd: number;
  payment_status: string;
  file_url?: string;
}

export default function SuccessPage() {
  const params = useParams();
  const [data, setData] = useState<SuccessData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/checkout/status/${params.orderId}`);
        if (!res.ok) throw new Error("Ordem não encontrada");
        const json = await res.json();
        setData(json.order);
      } catch (erro) {
        console.error("Erro ao carregar sucesso:", erro);
      } finally {
        setLoading(false);
      }
    }
    if (params.orderId) fetchOrder();
  }, [params.orderId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner text="Verifying payment..." />
      </div>
    );
  }

  return (
    <div className="animate-fade-in mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
      <div className="mb-6 inline-flex rounded-full bg-green-500/10 p-4">
        <CheckCircle className="h-12 w-12 text-green-400" />
      </div>

      <h1 className="text-3xl font-bold text-white">Payment Confirmed!</h1>
      <p className="mt-3 text-gray-400">
        Thank you for purchasing{" "}
        <span className="font-semibold text-white">{data?.product_title || "Product"}</span>.
      </p>

      <div className="mt-8 rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
        <p className="text-sm text-gray-500">Your product is ready</p>
        {data?.file_url ? (
          <a href={data.file_url} download>
            <Button className="mt-4" fullWidth size="lg">
              <Download className="h-5 w-5" />
              Download Product
            </Button>
          </a>
        ) : (
          <p className="mt-3 text-sm text-gray-400">
            The download link will be sent to your email shortly.
          </p>
        )}
      </div>

      <div className="mt-8">
        <Link href="/marketplace">
          <Button variant="outline">
            Explore more products
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
