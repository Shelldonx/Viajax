"use client";

import { SessionProvider } from "next-auth/react";
import WalletProvider from "./WalletProvider";
import { ReactNode } from "react";

interface AppProvidersProps {
  children: ReactNode;
}

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <SessionProvider>
      <WalletProvider>
        {children}
      </WalletProvider>
    </SessionProvider>
  );
}
