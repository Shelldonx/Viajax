"use client";

import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { BookOpen } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ProductCardProps {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  coverImage?: string;
  creatorName?: string;
  salesCount?: number;
}

export default function ProductCard({
  id,
  title,
  description,
  price,
  category,
  coverImage,
  creatorName,
  salesCount = 0,
}: ProductCardProps) {
  return (
    <Link href={`/product/${id}`}>
      <Card hover className="group overflow-hidden">
        {/* Capa */}
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-gradient-to-br from-gray-800 to-gray-900">
          {coverImage ? (
            <img
              src={coverImage}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <BookOpen className="h-12 w-12 text-gray-600" />
            </div>
          )}
          <div className="absolute top-3 right-3">
            <Badge variant="teal">{category}</Badge>
          </div>
        </div>

        {/* Info */}
        <div className="mt-4 space-y-2">
          <h3 className="line-clamp-2 text-sm font-semibold text-white group-hover:text-teal-400 transition-colors">
            {title}
          </h3>
          <p className="line-clamp-2 text-xs text-gray-500">{description}</p>
          <div className="flex items-center justify-between pt-1">
            <span className="text-lg font-bold text-teal-400">
              {formatCurrency(price)}
            </span>
            <div className="text-right">
              {creatorName && (
                <p className="text-xs text-gray-500">by {creatorName}</p>
              )}
              {salesCount > 0 && (
                <p className="text-xs text-gray-600">{salesCount} sales</p>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
