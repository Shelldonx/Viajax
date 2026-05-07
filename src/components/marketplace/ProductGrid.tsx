"use client";

import ProductCard from "./ProductCard";

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

interface ProductGridProps {
  products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg text-gray-400">Nenhum eBook encontrado</p>
        <p className="mt-1 text-sm text-gray-600">Volta mais tarde — novos eBooks são publicados diariamente.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          id={product.id}
          title={product.title}
          description={product.description || ""}
          price={product.price}
          category={product.category || "Geral"}
          coverImage={product.cover_image}
          creatorName={product.creator_name}
          salesCount={product.sales_count}
        />
      ))}
    </div>
  );
}
