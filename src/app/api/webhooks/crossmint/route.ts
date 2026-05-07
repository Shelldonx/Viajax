import { NextRequest, NextResponse } from "next/server";
import { execute } from "@/lib/db";
import { verifyWebhook } from "@/lib/crossmint";

// POST — webhook do Crossmint para confirmar pagamento
export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("x-crossmint-signature") || "";

    // Verificar assinatura do webhook
    if (!verifyWebhook(payload, signature)) {
      console.error("[Webhook Crossmint] Assinatura inválida");
      return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
    }

    const data = JSON.parse(payload);
    const { type, data: eventData } = data;

    if (type === "payment.completed" || type === "order.completed") {
      const orderId = eventData?.metadata?.orderId;
      const txSignature = eventData?.txId || eventData?.transactionId;

      if (orderId) {
        // Atualizar ordem como confirmada
        await execute(
          `UPDATE orders SET 
            payment_status = 'confirmed', 
            tx_signature = ?,
            crossmint_order_id = ?,
            access_granted = TRUE 
          WHERE id = ?`,
          [txSignature || null, eventData?.orderId || null, orderId]
        );

        // Incrementar vendas do produto
        await execute(
          `UPDATE products p 
           JOIN orders o ON p.id = o.product_id 
           SET p.sales_count = p.sales_count + 1 
           WHERE o.id = ?`,
          [orderId]
        );

        console.log(`[Webhook Crossmint] ✅ Pagamento confirmado para ordem ${orderId}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (erro) {
    console.error("[Webhook Crossmint] Erro:", (erro as Error).message);
    return NextResponse.json({ error: "Erro ao processar webhook" }, { status: 500 });
  }
}
