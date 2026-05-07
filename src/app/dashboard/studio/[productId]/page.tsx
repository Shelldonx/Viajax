"use client";

import { useParams } from "next/navigation";
import AIStudio from "@/components/creator/AIStudio";

export default function StudioPage() {
  const params = useParams();

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">AI Studio</h1>
        <p className="mt-1 text-sm text-gray-500">
          Edit and improve your product with AI. Product: {params.productId}
        </p>
      </div>
      <AIStudio />
    </div>
  );
}
