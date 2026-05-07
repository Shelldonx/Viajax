"use client";

import { cn } from "@/lib/utils";

const CATEGORIES = ["All", "Travel", "Business", "Tech", "Lifestyle", "Education"];

interface CategoryFilterProps {
  selected: string;
  onChange: (category: string) => void;
}

export default function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat === "All" ? "" : cat)}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition-all",
            (cat === "All" && !selected) || selected === cat
              ? "bg-teal-500 text-white shadow-lg shadow-teal-500/25"
              : "bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-white"
          )}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
