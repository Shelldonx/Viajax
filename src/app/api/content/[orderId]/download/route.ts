import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { build402Response, verifyX402Payment } from "@/lib/x402";
import { RowDataPacket } from "mysql2/promise";

interface OrderRow extends RowDataPacket {
  id: string;
  product_id: string;
  amount_usdc: number;
  payment_status: string;
  access_granted: boolean;
  file_url: string;
  product_title: string;
}

// GET — x402 protocol endpoint for content access
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    // Fetch order + product
    const orders = await query<OrderRow[]>(
      `SELECT o.*, p.file_url, p.title as product_title
       FROM orders o
       JOIN products p ON o.product_id = p.id
       WHERE o.id = ?`,
      [orderId]
    );

    if (orders.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orders[0];

    // If already paid and access granted, serve the content
    if (order.payment_status === "confirmed" && order.access_granted) {
      if (order.file_url) {
        return NextResponse.redirect(order.file_url);
      }
      return NextResponse.json({
        message: "Access granted",
        product: order.product_title,
        note: "Content file not yet uploaded by creator",
      });
    }

    // Check for X-PAYMENT header (x402 protocol)
    const paymentHeader = request.headers.get("X-PAYMENT");
    if (paymentHeader) {
      const verified = await verifyX402Payment(request, orderId, order.amount_usdc);
      if (verified) {
        if (order.file_url) {
          return NextResponse.redirect(order.file_url);
        }
        return NextResponse.json({
          message: "Payment verified via x402",
          product: order.product_title,
        });
      }
      return NextResponse.json({ error: "x402 payment verification failed" }, { status: 400 });
    }

    // No payment — return HTTP 402 with x402 headers
    return build402Response(orderId, order.amount_usdc);
  } catch (error) {
    console.error("[API Content Download] Error:", (error as Error).message);
    return NextResponse.json({ error: "Error accessing content" }, { status: 500 });
  }
}
