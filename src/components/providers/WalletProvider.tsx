"use client";

import { ReactNode, useState, useEffect } from "react";
import dynamic from "next/dynamic";

interface WalletProviderProps {
  children: ReactNode;
}

// Dynamically import wallet adapter to avoid SSR issues with Buffer/crypto polyfills
const WalletProviderInner = dynamic<{ children: ReactNode }>(
  () => import("./WalletProviderInner"),
  { ssr: false }
);

export default function WalletProvider({ children }: WalletProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return <WalletProviderInner>{children}</WalletProviderInner>;
}
