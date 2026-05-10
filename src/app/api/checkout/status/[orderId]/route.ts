import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { getOrderStatus } from "@/lib/crossmint";
import { RowDataPacket } from "mysql2/promise";

interface OrderRow extends RowDataPacket {
  id: string;
  product_id: string;
  product_title: string;
  amount_usd: number;
  amount_usdc: number;
  payment_status: string;
  payment_method: string;
  crossmint_order_id: string | null;
  tx_signature: string | null;
  access_granted: boolean;
  file_url: string;
  created_at: string;
}

// GET — check payment status (with Crossmint polling)
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

    const order = orders[0];

    // If pending and has Crossmint order, check Crossmint status
    if (order.payment_status === "pending" && order.crossmint_order_id) {
      try {
        const crossmintStatus = await getOrderStatus(order.crossmint_order_id);
        if (crossmintStatus === "confirmed") {
          await execute(
            `UPDATE orders SET payment_status = 'confirmed', access_granted = TRUE WHERE id = ?`,
            [orderId]
          );
          await execute(
            `UPDATE products p JOIN orders o ON p.id = o.product_id SET p.sales_count = p.sales_count + 1 WHERE o.id = ?`,
            [orderId]
          );
          order.payment_status = "confirmed";
          order.access_granted = true;
        } else if (crossmintStatus === "failed") {
          await execute(
            `UPDATE orders SET payment_status = 'failed' WHERE id = ?`,
            [orderId]
          );
          order.payment_status = "failed";
        }
      } catch (crossmintError) {
        console.error("[API Status] Crossmint check error:", (crossmintError as Error).message);
      }
    }

    return NextResponse.json({
      order: {
        id: order.id,
        product_id: order.product_id,
        product_title: order.product_title,
        amount_usd: order.amount_usd,
        amount_usdc: order.amount_usdc,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        tx_signature: order.tx_signature,
        access_granted: order.access_granted,
        file_url: order.access_granted ? order.file_url : null,
        created_at: order.created_at,
        solscan_url: order.tx_signature ? `https://solscan.io/tx/${order.tx_signature}` : null,
      },
    });
  } catch (error) {
    console.error("[API Checkout Status] Error:", (error as Error).message);
    return NextResponse.json({ error: "Error checking order" }, { status: 500 });
  }
}
