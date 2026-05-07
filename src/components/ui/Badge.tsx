"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "teal" | "orange" | "green" | "red" | "gray";
  className?: string;
}

export default function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    default: "bg-gray-800 text-gray-300 border-gray-700",
    teal: "bg-teal-500/10 text-teal-400 border-teal-500/30",
    orange: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    green: "bg-green-500/10 text-green-400 border-green-500/30",
    red: "bg-red-500/10 text-red-400 border-red-500/30",
    gray: "bg-gray-700/50 text-gray-400 border-gray-600",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
