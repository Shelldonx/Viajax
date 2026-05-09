import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { RowDataPacket } from "mysql2/promise";

interface OrderRow extends RowDataPacket {
  id: string;
  product_id: string;
  product_title: string;
  amount_usd: number;
  amount_usdc: number;
  payment_status: string;
  payment_method: string;
  file_url: string;
  created_at: string;
}

// GET — estado do pagamento
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const orders = await query<OrderRow[]>(
      `SELECT o.*, p.title as product_title, p.file_url
       FROM orders o
       JOIN products p ON o.product_id = p.id
       WHERE o.id = ?`,
      [orderId]
    );

    if (orders.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order: orders[0] });
  } catch (erro) {
    console.error("[API Checkout Status] Erro:", (erro as Error).message);
    return NextResponse.json({ error: "Error checking order" }, { status: 500 });
  }
}
