"use client";

import AIStudio from "@/components/creator/AIStudio";

export default function NewProductPage() {
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Criar eBook com AI</h1>
        <p className="mt-1 text-sm text-gray-500">
          Faz upload de um PDF e a AI transforma-o num eBook profissional em minutos.
        </p>
      </div>
      <AIStudio />
    </div>
  );
}
