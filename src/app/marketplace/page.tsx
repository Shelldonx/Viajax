"use client";

import { useState, useEffect } from "react";
import ProductGrid from "@/components/marketplace/ProductGrid";
import CategoryFilter from "@/components/marketplace/CategoryFilter";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Search } from "lucide-react";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  cover_image?: string;
  creator_name?: string;
  sales_count?: number;
}

export default function MarketplacePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (category) params.set("category", category);
        if (search) params.set("search", search);

        const res = await fetch(`/api/products?${params.toString()}`);
        if (!res.ok) throw new Error("Erro ao carregar produtos");
        const data = await res.json();
        setProducts(data.products || []);
      } catch (erro) {
        console.error("Erro ao carregar marketplace:", erro);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [category, search]);

  return (
    <div className="animate-fade-in mx-auto max-w-7xl px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Marketplace</h1>
        <p className="mt-2 text-gray-400">Descobre eBooks criados por creators independentes.</p>
      </div>

      {/* Filtros */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CategoryFilter selected={category} onChange={setCategory} />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Pesquisar eBooks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-700 bg-gray-800/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none sm:w-64"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-20">
          <LoadingSpinner text="A carregar eBooks..." />
        </div>
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
