import { query, execute } from "./db";
import { sendUsdc, isValidSolanaAddress } from "./solana";
import { RowDataPacket } from "mysql2/promise";

// Interface para ordens pendentes de payout
interface PendingPayout extends RowDataPacket {
  creator_id: string;
  wallet_address: string;
  total_usdc: number;
  orders_count: number;
  order_ids: string;
}

// Processar payouts pendentes — executar diariamente via cron
export async function processPendingPayouts(): Promise<{
  processed: number;
  failed: number;
  totalUsdc: number;
}> {
  let processed = 0;
  let failed = 0;
  let totalUsdc = 0;

  try {
    // Buscar creators com payouts pendentes (>7 dias após compra)
    const pendingPayouts = await query<PendingPayout[]>(
      `SELECT 
        o.creator_id,
        u.wallet_address,
        SUM(o.creator_amount) as total_usdc,
        COUNT(o.id) as orders_count,
        GROUP_CONCAT(o.id) as order_ids
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users u ON p.creator_id = u.id
      WHERE o.payment_status = 'confirmed'
        AND o.payout_status = 'pending'
        AND o.payout_date <= NOW()
        AND u.wallet_address IS NOT NULL
      GROUP BY o.creator_id, u.wallet_address
      HAVING total_usdc > 0`
    );

    // Processar cada payout
    for (const payout of pendingPayouts) {
      try {
        // Validar carteira
        if (!isValidSolanaAddress(payout.wallet_address)) {
          console.error(`[Payouts] Carteira inválida para creator ${payout.creator_id}: ${payout.wallet_address}`);
          failed++;
          continue;
        }

        // Enviar USDC via Solana Mainnet
        const txSignature = await sendUsdc(payout.wallet_address, payout.total_usdc);

        // Registar payout na base de dados
        await execute(
          `INSERT INTO payouts (id, creator_id, amount_usdc, tx_signature, status, orders_count, processed_at)
           VALUES (UUID(), ?, ?, ?, 'completed', ?, NOW())`,
          [payout.creator_id, payout.total_usdc, txSignature, payout.orders_count]
        );

        // Atualizar ordens como pagas
        const orderIds = payout.order_ids.split(",");
        for (const orderId of orderIds) {
          await execute(
            `UPDATE orders SET payout_status = 'paid', paid_at = NOW() WHERE id = ?`,
            [orderId.trim()]
          );
        }

        processed++;
        totalUsdc += payout.total_usdc;
        console.log(`[Payouts] ✅ ${payout.total_usdc} USDC → ${payout.wallet_address} | tx: ${txSignature}`);
      } catch (erro) {
        console.error(`[Payouts] ❌ Erro no payout para ${payout.creator_id}:`, (erro as Error).message);
        failed++;

        // Registar payout falhado
        await execute(
          `INSERT INTO payouts (id, creator_id, amount_usdc, status, orders_count, created_at)
           VALUES (UUID(), ?, ?, 'failed', ?, NOW())`,
          [payout.creator_id, payout.total_usdc, payout.orders_count]
        );
      }
    }
  } catch (erro) {
    console.error("[Payouts] Erro geral no processamento:", (erro as Error).message);
    throw erro;
  }

  return { processed, failed, totalUsdc };
}

// Obter histórico de payouts de um creator
export async function getCreatorPayouts(creatorId: string) {
  return query(
    `SELECT * FROM payouts WHERE creator_id = ? ORDER BY created_at DESC`,
    [creatorId]
  );
}

// Obter resumo de ganhos de um creator
export async function getCreatorEarnings(creatorId: string) {
  const [earnings] = await query<RowDataPacket[]>(
    `SELECT 
      COALESCE(SUM(CASE WHEN o.payment_status = 'confirmed' THEN o.creator_amount ELSE 0 END), 0) as total_earned,
      COALESCE(SUM(CASE WHEN o.payout_status = 'paid' THEN o.creator_amount ELSE 0 END), 0) as total_paid,
      COALESCE(SUM(CASE WHEN o.payout_status = 'pending' AND o.payment_status = 'confirmed' THEN o.creator_amount ELSE 0 END), 0) as pending_payout,
      COUNT(CASE WHEN o.payment_status = 'confirmed' THEN 1 END) as total_sales
    FROM orders o
    JOIN products p ON o.product_id = p.id
    WHERE p.creator_id = ?`,
    [creatorId]
  );
  return earnings;
}
