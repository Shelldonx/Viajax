"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { DollarSign, BookOpen, ShoppingCart, TrendingUp } from "lucide-react";
import { formatUsdc } from "@/lib/utils";

interface DashboardStats {
  totalEarned: number;
  pendingPayout: number;
  totalSales: number;
  totalProducts: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Por agora, dados mock até conectar ao backend
        setStats({
          totalEarned: 0,
          pendingPayout: 0,
          totalSales: 0,
          totalProducts: 0,
        });
      } catch (erro) {
        console.error("Erro ao carregar stats:", erro);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  const statCards = [
    { label: "Total Earned", value: `${formatUsdc(stats?.totalEarned || 0)} USDC`, icon: DollarSign, color: "text-green-400" },
    { label: "Pending Payout", value: `${formatUsdc(stats?.pendingPayout || 0)} USDC`, icon: TrendingUp, color: "text-orange-400" },
    { label: "Total Sales", value: String(stats?.totalSales || 0), icon: ShoppingCart, color: "text-teal-400" },
    { label: "My Products", value: String(stats?.totalProducts || 0), icon: BookOpen, color: "text-purple-400" },
  ];

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-white">Overview</h1>
      <p className="mt-1 text-sm text-gray-500">Overview of your earnings and products.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gray-800 p-2.5">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className="text-lg font-bold text-white">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Área para ordens recentes — a implementar com dados reais */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-white">Recent Orders</h2>
        <Card className="mt-4">
          <p className="text-center text-sm text-gray-500 py-8">
            Your sales will appear here. Start by publishing your first product!
          </p>
        </Card>
      </div>
    </div>
  );
}
