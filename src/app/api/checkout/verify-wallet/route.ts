import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { verifyUsdcPayment, isValidSolanaAddress } from "@/lib/solana";
import { RowDataPacket } from "mysql2/promise";

interface OrderRow extends RowDataPacket {
  id: string;
  amount_usdc: number;
  payment_status: string;
}

const PLATFORM_WALLET = process.env.PLATFORM_WALLET_ADDRESS || "";

// POST — verify wallet payment on Solana Mainnet
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

    // If we have a tx signature, verify on-chain
    if (txSignature) {
      // Fetch order to get expected amount
      const orders = await query<OrderRow[]>(
        `SELECT * FROM orders WHERE id = ? AND payment_status = 'pending'`,
        [orderId]
      );

      if (orders.length === 0) {
        return NextResponse.json({ error: "Order not found or already paid" }, { status: 404 });
      }

      const order = orders[0];

      // Verify USDC payment on Solana Mainnet
      const verified = await verifyUsdcPayment(
        txSignature,
        order.amount_usdc,
        PLATFORM_WALLET
      );

      if (!verified) {
        return NextResponse.json({ error: "Transaction not confirmed on blockchain. Please wait and retry." }, { status: 400 });
      }

      // Update order as confirmed
      await execute(
        `UPDATE orders SET payment_status = 'confirmed', tx_signature = ?, access_granted = TRUE WHERE id = ?`,
        [txSignature, orderId]
      );

      // Increment product sales count
      await execute(
        `UPDATE products p JOIN orders o ON p.id = o.product_id SET p.sales_count = p.sales_count + 1 WHERE o.id = ?`,
        [orderId]
      );

      return NextResponse.json({
        success: true,
        confirmed: true,
        txSignature,
        solscanUrl: `https://solscan.io/tx/${txSignature}`,
      });
    }

    // No txSignature — return data for frontend to initiate payment
    return NextResponse.json({
      success: true,
      message: "Wallet validated. Proceed with payment via Jupiter.",
      walletAddress,
      orderId,
      recipient: PLATFORM_WALLET,
    });
  } catch (error) {
    console.error("[API Verify Wallet] Error:", (error as Error).message);
    return NextResponse.json({ error: "Error verifying payment" }, { status: 500 });
  }
}
