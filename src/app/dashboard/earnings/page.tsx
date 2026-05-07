"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { DollarSign, Clock, CheckCircle, ExternalLink } from "lucide-react";
import { formatUsdc, formatDate } from "@/lib/utils";

interface Payout {
  id: string;
  amount_usdc: number;
  tx_signature: string;
  status: string;
  processed_at: string;
  created_at: string;
}

export default function EarningsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [pendingPayout, setPendingPayout] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEarnings() {
      try {
        // Dados mock até conectar ao backend
        setTotalEarned(0);
        setPendingPayout(0);
        setPayouts([]);
      } catch (erro) {
        console.error("Erro ao carregar ganhos:", erro);
      } finally {
        setLoading(false);
      }
    }
    fetchEarnings();
  }, []);

  if (loading) return <LoadingSpinner text="Loading earnings..." />;

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-white">Earnings & Payouts</h1>
      <p className="mt-1 text-sm text-gray-500">All payments are in USDC on Solana Mainnet.</p>

      {/* Resumo */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-green-500/10 p-2.5">
              <DollarSign className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Earned</p>
              <p className="text-lg font-bold text-white">{formatUsdc(totalEarned)} USDC</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-orange-500/10 p-2.5">
              <Clock className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Pending Payout</p>
              <p className="text-lg font-bold text-white">{formatUsdc(pendingPayout)} USDC</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-teal-500/10 p-2.5">
              <CheckCircle className="h-5 w-5 text-teal-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Completed Payouts</p>
              <p className="text-lg font-bold text-white">{payouts.filter(p => p.status === "completed").length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Info */}
      <div className="mt-6 rounded-xl border border-teal-500/20 bg-teal-500/5 p-4">
        <p className="text-sm text-teal-400">
          Payouts are processed automatically 7 days after each confirmed sale. You receive directly in your Solana wallet in USDC.
        </p>
      </div>

      {/* Histórico */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-white">Payout History</h2>
        {payouts.length === 0 ? (
          <Card className="mt-4">
            <p className="text-center text-sm text-gray-500 py-8">
              No payouts yet. Your earnings will appear here after your first sale.
            </p>
          </Card>
        ) : (
          <div className="mt-4 space-y-3">
            {payouts.map((payout) => (
              <Card key={payout.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant={payout.status === "completed" ? "green" : payout.status === "failed" ? "red" : "orange"}>
                    {payout.status === "completed" ? "Paid" : payout.status === "failed" ? "Failed" : "Pending"}
                  </Badge>
                  <div>
                    <p className="text-sm font-semibold text-white">{formatUsdc(payout.amount_usdc)} USDC</p>
                    <p className="text-xs text-gray-500">{formatDate(payout.created_at)}</p>
                  </div>
                </div>
                {payout.tx_signature && (
                  <a
                    href={`https://solscan.io/tx/${payout.tx_signature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300"
                  >
                    Ver tx <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
