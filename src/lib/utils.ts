import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Utilidade para classes CSS condicionais com Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formatar valor em USDC
export function formatUsdc(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(amount);
}

// Formatar valor em EUR/USD
export function formatCurrency(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

// Calcular taxas da plataforma (3%)
export function calculateFees(amountUsd: number) {
  const feePercent = parseInt(process.env.PLATFORM_FEE_PERCENT || "3", 10);
  const platformFee = (amountUsd * feePercent) / 100;
  const creatorAmount = amountUsd - platformFee;
  return {
    amountUsd: Math.round(amountUsd * 100) / 100,
    platformFee: Math.round(platformFee * 1000000) / 1000000,
    creatorAmount: Math.round(creatorAmount * 1000000) / 1000000,
    feePercent,
  };
}

// Truncar endereço Solana para display
export function truncateAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

// Gerar UUID v4 simples (fallback para quando não se usa o MySQL UUID())
export function generateId(): string {
  return crypto.randomUUID();
}

// Data de payout (7 dias após a compra)
export function calculatePayoutDate(): Date {
  const days = parseInt(process.env.PAYOUT_DELAY_DAYS || "7", 10);
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

// Formatar data em português
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}
