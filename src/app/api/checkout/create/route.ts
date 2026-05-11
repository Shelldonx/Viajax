import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { calculateFees, calculatePayoutDate } from "@/lib/utils";
import { createPaymentOrder } from "@/lib/crossmint";
import { RowDataPacket } from "mysql2/promise";

interface ProductRow extends RowDataPacket {
  id: string;
  title: string;
  price: number;
  creator_id: string;
  wallet_address: string;
}

const PLATFORM_WALLET = process.env.PLATFORM_WALLET_ADDRESS || "";

// POST — create checkout order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, paymentMethod, buyerEmail } = body;

    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    // Fetch product + creator wallet
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
    product.price = Number(product.price);
    const fees = calculateFees(product.price);
    const orderId = crypto.randomUUID();
    const payoutDate = calculatePayoutDate();
    const method = paymentMethod || "card";

    // Insert order in DB
    await execute(
      `INSERT INTO orders (id, product_id, buyer_email, amount_usd, amount_usdc, platform_fee, creator_amount, payment_method, payment_status, payout_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [
        orderId,
        productId,
        buyerEmail || "pending@viajax.es",
        fees.amountUsd,
        fees.amountUsd,
        fees.platformFee,
        fees.creatorAmount,
        method,
        payoutDate.toISOString().slice(0, 19).replace("T", " "),
      ]
    );

    // Card payment — create Crossmint order
    if (method === "card") {
      try {
        const crossmintResult = await createPaymentOrder({
          productId,
          amountUsd: fees.amountUsd,
          buyerEmail: buyerEmail || "pending@viajax.es",
          orderId,
          title: product.title,
        });

        // Store crossmint order ID
        await execute(
          `UPDATE orders SET crossmint_order_id = ? WHERE id = ?`,
          [crossmintResult.crossmintOrderId, orderId]
        );

        return NextResponse.json({
          orderId,
          amount: fees.amountUsd,
          amountUsdc: fees.amountUsd,
          productTitle: product.title,
          crossmintOrderId: crossmintResult.crossmintOrderId,
          clientSecret: crossmintResult.clientSecret,
        });
      } catch (crossmintError) {
        console.error("[API Checkout] Crossmint error:", (crossmintError as Error).message);
        // Return order anyway — user can retry or switch to wallet
        return NextResponse.json({
          orderId,
          amount: fees.amountUsd,
          amountUsdc: fees.amountUsd,
          productTitle: product.title,
          crossmintError: "Card payment temporarily unavailable. Try wallet payment.",
        });
      }
    }

    // Wallet payment — return payment details for Jupiter
    return NextResponse.json({
      orderId,
      amount: fees.amountUsd,
      amountUsdc: fees.amountUsd,
      productTitle: product.title,
      recipient: PLATFORM_WALLET,
    });
  } catch (error) {
    console.error("[API Checkout] Error creating order:", (error as Error).message);
    return NextResponse.json({ error: "Error creating checkout" }, { status: 500 });
  }
}
