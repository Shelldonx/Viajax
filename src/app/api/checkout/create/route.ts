import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { calculateFees, calculatePayoutDate } from "@/lib/utils";
import { RowDataPacket } from "mysql2/promise";

interface ProductRow extends RowDataPacket {
  id: string;
  title: string;
  price: number;
  creator_id: string;
  wallet_address: string;
}

// POST — criar ordem de checkout
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, paymentMethod, buyerEmail, buyerName } = body;

    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    // Buscar produto
    const products = await query<ProductRow[]>(
      `SELECT p.*, u.wallet_address 
       FROM products p 
       JOIN users u ON p.creator_id = u.id 
       WHERE p.id = ? AND p.published = TRUE`,
      [productId]
    );

    if (products.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const product = products[0];
    const fees = calculateFees(product.price);
    const orderId = crypto.randomUUID();
    const payoutDate = calculatePayoutDate();

    // Criar ordem na base de dados
    await execute(
      `INSERT INTO orders (id, product_id, buyer_email, amount_usd, amount_usdc, platform_fee, creator_amount, payment_method, payment_status, payout_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [
        orderId,
        productId,
        buyerEmail || "pending@viajax.es",
        fees.amountUsd,
        fees.amountUsd, // USDC ≈ USD (stablecoin)
        fees.platformFee,
        fees.creatorAmount,
        paymentMethod || "card",
        payoutDate.toISOString().slice(0, 19).replace("T", " "),
      ]
    );

    return NextResponse.json({
      orderId,
      amount: fees.amountUsd,
      amountUsdc: fees.amountUsd,
      productTitle: product.title,
    });
  } catch (erro) {
    console.error("[API Checkout] Erro ao criar ordem:", (erro as Error).message);
    return NextResponse.json({ error: "Error creating checkout" }, { status: 500 });
  }
}
