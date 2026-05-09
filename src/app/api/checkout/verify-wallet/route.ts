import { NextRequest, NextResponse } from "next/server";
import { execute } from "@/lib/db";
import { verifyTransaction, isValidSolanaAddress } from "@/lib/solana";

// POST — verificar pagamento via carteira Solana
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, walletAddress, txSignature } = body;

    if (!orderId || !walletAddress) {
      return NextResponse.json({ error: "orderId and walletAddress are required" }, { status: 400 });
    }

    if (!isValidSolanaAddress(walletAddress)) {
      return NextResponse.json({ error: "Invalid Solana wallet address" }, { status: 400 });
    }

    // Se temos assinatura de transação, verificar on-chain
    if (txSignature) {
      const result = await verifyTransaction(txSignature);

      if (!result.confirmed) {
        return NextResponse.json({ error: "Transaction not confirmed on blockchain" }, { status: 400 });
      }

      // Atualizar ordem como confirmada
      await execute(
        `UPDATE orders SET payment_status = 'confirmed', tx_signature = ?, access_granted = TRUE WHERE id = ?`,
        [txSignature, orderId]
      );

      return NextResponse.json({
        success: true,
        confirmed: true,
        amount: result.amount,
        txSignature,
      });
    }

    // Sem txSignature — retornar dados para o frontend iniciar o pagamento
    return NextResponse.json({
      success: true,
      message: "Wallet validated. Proceed with payment via Jupiter.",
      walletAddress,
      orderId,
    });
  } catch (erro) {
    console.error("[API Verify Wallet] Erro:", (erro as Error).message);
    return NextResponse.json({ error: "Error verifying payment" }, { status: 500 });
  }
}
