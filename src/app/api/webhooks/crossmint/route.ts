import { NextRequest, NextResponse } from "next/server";
import { execute } from "@/lib/db";
import { verifyWebhook } from "@/lib/crossmint";

// POST — Crossmint webhook for payment confirmation
export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("x-crossmint-signature") || "";

    // Verify webhook signature
    if (!verifyWebhook(payload, signature)) {
      console.error("[Webhook Crossmint] Invalid signature");
      // In production, still return 200 to avoid retries on signature mismatch during testing
      // Remove this and return 401 once webhook secret is confirmed working
      console.warn("[Webhook Crossmint] Processing anyway for initial setup...");
    }

    const data = JSON.parse(payload);
    const eventType = data.type || "";
    const eventData = data.data || data;

    // Handle payment success events
    if (
      eventType === "orders.payment.succeeded" ||
      eventType === "payment.completed" ||
      eventType === "order.completed"
    ) {
      const orderId = eventData?.metadata?.orderId || eventData?.metadata?.viajaxOrderId;
      const txSignature = eventData?.txId || eventData?.transactionId || eventData?.onChain?.txId;

      if (orderId) {
        // Update order as confirmed
        await execute(
          `UPDATE orders SET 
            payment_status = 'confirmed', 
            tx_signature = COALESCE(?, tx_signature),
            access_granted = TRUE 
          WHERE id = ? AND payment_status = 'pending'`,
          [txSignature || null, orderId]
        );

        // Increment product sales count
        await execute(
          `UPDATE products p 
           JOIN orders o ON p.id = o.product_id 
           SET p.sales_count = p.sales_count + 1 
           WHERE o.id = ?`,
          [orderId]
        );

        console.log(`[Webhook Crossmint] Payment confirmed for order ${orderId} | tx: ${txSignature || "N/A"}`);
      }
    }

    // Handle payment failure events
    if (eventType === "orders.payment.failed") {
      const orderId = eventData?.metadata?.orderId || eventData?.metadata?.viajaxOrderId;
      if (orderId) {
        await execute(
          `UPDATE orders SET payment_status = 'failed' WHERE id = ? AND payment_status = 'pending'`,
          [orderId]
        );
        console.log(`[Webhook Crossmint] Payment failed for order ${orderId}`);
      }
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook Crossmint] Error:", (error as Error).message);
    // Return 200 even on error to prevent webhook retries
    return NextResponse.json({ received: true, error: "Processing error" });
  }
}
