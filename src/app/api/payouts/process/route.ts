import { NextRequest, NextResponse } from "next/server";
import { processPendingPayouts } from "@/lib/payouts";

// POST — processar payouts pendentes (protegido por CRON_SECRET)
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação do cron
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await processPendingPayouts();

    return NextResponse.json({
      success: true,
      processed: result.processed,
      failed: result.failed,
      totalUsdc: result.totalUsdc,
      timestamp: new Date().toISOString(),
    });
  } catch (erro) {
    console.error("[API Payouts] Erro:", (erro as Error).message);
    return NextResponse.json({ error: "Error processing payouts" }, { status: 500 });
  }
}
