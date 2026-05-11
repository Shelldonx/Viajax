"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { DollarSign } from "lucide-react";

interface PriceInputProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  error?: string;
  className?: string;
}

export default function PriceInput({
  id = "price",
  label = "Price (USD)",
  value,
  onChange,
  min = 0.99,
  max = 99999.99,
  error,
  className,
}: PriceInputProps) {
  const [focused, setFocused] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let raw = e.target.value;

      // Allow empty
      if (raw === "") {
        onChange("");
        return;
      }

      // Remove anything that isn't digit or dot
      raw = raw.replace(/[^0-9.]/g, "");

      // Only one decimal point
      const parts = raw.split(".");
      if (parts.length > 2) {
        raw = parts[0] + "." + parts.slice(1).join("");
      }

      // Max 2 decimal places
      if (parts.length === 2 && parts[1].length > 2) {
        raw = parts[0] + "." + parts[1].slice(0, 2);
      }

      // Prevent leading zeros (except "0." pattern)
      if (raw.length > 1 && raw[0] === "0" && raw[1] !== ".") {
        raw = raw.replace(/^0+/, "");
      }

      // Enforce max
      const num = parseFloat(raw);
      if (!isNaN(num) && num > max) {
        raw = max.toFixed(2);
      }

      onChange(raw);
    },
    [onChange, max]
  );

  const handleBlur = useCallback(() => {
    setFocused(false);
    if (value === "" || value === ".") {
      onChange(min.toFixed(2));
      return;
    }
    const num = parseFloat(value);
    if (isNaN(num) || num < min) {
      onChange(min.toFixed(2));
    } else {
      // Format to 2 decimal places on blur
      onChange(num.toFixed(2));
    }
  }, [value, onChange, min]);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-300">
          {label}
        </label>
      )}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
          <DollarSign className="h-4 w-4 text-gray-500" />
        </div>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          placeholder="0.99"
          className={cn(
            "w-full rounded-xl border border-gray-700 bg-gray-800/50 py-2.5 pl-9 pr-16 text-sm text-white placeholder-gray-500 transition-colors focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/50",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/50",
            className
          )}
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
          <span className="text-xs font-medium text-gray-500">USD</span>
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      {!error && !focused && value && (
        <p className="mt-1 text-xs text-gray-600">
          Buyers will pay ${Number(value).toFixed(2)} USDC on Solana
        </p>
      )}
    </div>
  );
}
