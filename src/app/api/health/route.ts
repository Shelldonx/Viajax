import { NextResponse } from "next/server";
import { healthCheck } from "@/lib/db";

export async function GET() {
  try {
    const dbOk = await healthCheck();
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: dbOk ? "connected" : "disconnected",
      version: "1.0.0",
      network: "solana-mainnet",
    });
  } catch (erro) {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        database: "error",
        error: (erro as Error).message,
      },
      { status: 500 }
    );
  }
}
