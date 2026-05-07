"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  Plus,
  Sparkles,
  DollarSign,
  ArrowLeft,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/products", icon: BookOpen, label: "Meus eBooks" },
  { href: "/dashboard/products/new", icon: Plus, label: "Criar eBook" },
  { href: "/dashboard/earnings", icon: DollarSign, label: "Ganhos" },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r border-gray-800/50 bg-gray-950">
      {/* Voltar */}
      <div className="border-b border-gray-800/50 p-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao site
        </Link>
      </div>

      {/* Título */}
      <div className="p-4">
        <h2 className="text-lg font-bold text-white">Dashboard</h2>
        <p className="text-xs text-gray-500">Gere os teus eBooks e ganhos</p>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                    isActive
                      ? "bg-teal-500/10 text-teal-400 font-medium"
                      : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* AI Studio highlight */}
      <div className="m-3 rounded-xl border border-teal-500/20 bg-gradient-to-br from-teal-500/10 to-transparent p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-teal-400" />
          <span className="text-sm font-semibold text-teal-400">AI Studio</span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Transforma o teu PDF num eBook profissional com GPT-4o
        </p>
        <Link
          href="/dashboard/products/new"
          className="mt-3 block text-center text-xs font-medium text-teal-400 hover:text-teal-300 transition-colors"
        >
          Começar →
        </Link>
      </div>
    </aside>
  );
}
