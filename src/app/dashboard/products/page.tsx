"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Plus, BookOpen, Edit, Eye } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Product {
  id: string;
  title: string;
  price: number;
  category: string;
  published: boolean;
  sales_count: number;
  created_at: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products?mine=true");
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch (erro) {
        console.error("Erro ao carregar produtos:", erro);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  if (loading) return <LoadingSpinner text="A carregar os teus eBooks..." />;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Meus eBooks</h1>
          <p className="mt-1 text-sm text-gray-500">{products.length} eBook(s) publicado(s)</p>
        </div>
        <Link href="/dashboard/products/new">
          <Button>
            <Plus className="h-4 w-4" />
            Criar eBook
          </Button>
        </Link>
      </div>

      {products.length === 0 ? (
        <Card className="mt-8">
          <div className="flex flex-col items-center py-12 text-center">
            <BookOpen className="h-12 w-12 text-gray-600" />
            <h3 className="mt-4 text-lg font-semibold text-white">Ainda sem eBooks</h3>
            <p className="mt-2 text-sm text-gray-500">Cria o teu primeiro eBook com AI em menos de 5 minutos.</p>
            <Link href="/dashboard/products/new" className="mt-4">
              <Button>
                <Plus className="h-4 w-4" />
                Criar Primeiro eBook
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="mt-6 space-y-3">
          {products.map((product) => (
            <Card key={product.id} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-800">
                  <BookOpen className="h-6 w-6 text-gray-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{product.title}</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm font-bold text-teal-400">{formatCurrency(product.price)}</span>
                    <Badge variant={product.published ? "green" : "gray"}>
                      {product.published ? "Publicado" : "Rascunho"}
                    </Badge>
                    <span className="text-xs text-gray-500">{product.sales_count} vendas</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/product/${product.id}`}>
                  <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                </Link>
                <Link href={`/dashboard/studio/${product.id}`}>
                  <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
