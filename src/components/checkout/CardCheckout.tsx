"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Lock, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface CardCheckoutProps {
  orderId: string;
  amount: number;
  productTitle: string;
  onSuccess: () => void;
}

export default function CardCheckout({ orderId, amount, productTitle, onSuccess }: CardCheckoutProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function formatCardNumber(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  }

  function formatExpiry(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Enviar para Crossmint via API
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          paymentMethod: "card",
          buyerEmail: email,
          buyerName: name,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Payment error");
      }

      onSuccess();
    } catch (erro) {
      setError((erro as Error).message || "Error processing payment. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">Secure Payment</h3>
        <p className="text-sm text-gray-500">Purchasing: {productTitle}</p>
      </div>

      <Input
        id="email"
        label="Email"
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <Input
        id="name"
        label="Name on card"
        placeholder="Full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <div className="relative">
        <Input
          id="card"
          label="Card number"
          placeholder="1234 5678 9012 3456"
          value={cardNumber}
          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
          required
        />
        <CreditCard className="absolute right-3 top-9 h-5 w-5 text-gray-600" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="expiry"
          label="Expiry"
          placeholder="MM/YY"
          value={expiry}
          onChange={(e) => setExpiry(formatExpiry(e.target.value))}
          required
        />
        <Input
          id="cvv"
          label="CVV"
          type="password"
          placeholder="123"
          maxLength={4}
          value={cvv}
          onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
          required
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <Button type="submit" fullWidth size="lg" loading={loading}>
        <Lock className="h-4 w-4" />
        Pay {formatCurrency(amount)} with Card
      </Button>

      <p className="flex items-center justify-center gap-1 text-xs text-gray-600">
        <Lock className="h-3 w-3" />
        Secure payment via Crossmint
      </p>
    </form>
  );
}
