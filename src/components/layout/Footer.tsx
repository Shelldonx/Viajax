"use client";

import Link from "next/link";
import { GitBranch, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-gray-800/50 bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 text-sm font-bold text-white">
                V
              </div>
              <span className="text-lg font-bold text-white">
                Viajax<span className="text-teal-400">.es</span>
              </span>
            </div>
            <p className="mt-3 max-w-md text-sm text-gray-500">
              Open-source marketplace for creators to sell low-ticket digital products. Only 3% fee — the lowest in the market. Payouts in USDC on Solana.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-gray-300">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/marketplace" className="text-gray-500 hover:text-teal-400 transition-colors">Marketplace</Link></li>
              <li><Link href="/dashboard" className="text-gray-500 hover:text-teal-400 transition-colors">Dashboard</Link></li>
              <li><Link href="/dashboard/products/new" className="text-gray-500 hover:text-teal-400 transition-colors">Sell a Product</Link></li>
            </ul>
          </div>

          {/* Open source */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-gray-300">Open Source</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://github.com/Shelldonx/Viajax"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-gray-500 hover:text-teal-400 transition-colors"
                >
                  <GitBranch className="h-4 w-4" />
                  GitHub
                </a>
              </li>
              <li><span className="text-gray-500">MIT License</span></li>
              <li><span className="text-gray-500">Solana Mainnet</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-gray-800/50 pt-8 sm:flex-row">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} Viajax — Shelldon. All rights reserved.
          </p>
          <p className="flex items-center gap-1 text-xs text-gray-600">
            Built with <Heart className="h-3 w-3 text-red-500" /> on Solana Mainnet
          </p>
        </div>
      </div>
    </footer>
  );
}
