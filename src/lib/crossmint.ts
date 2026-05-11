import { createHmac } from "crypto";

// Crossmint payment integration — credit card → USDC on Solana Mainnet

interface CreatePaymentOrderParams {
  productId: string;
  amountUsd: number;
  buyerEmail: string;
  orderId: string;
  title: string;
}

interface PaymentOrderResponse {
  orderId: string;
  crossmintOrderId: string;
  clientSecret: string;
}

const CROSSMINT_API = "https://www.crossmint.com/api/2022-06-09";
const PLATFORM_WALLET = process.env.PLATFORM_WALLET_ADDRESS || "";
// USDC on Solana Mainnet token locator
const USDC_TOKEN_LOCATOR = "solana:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

// Create a Crossmint payment order (credit card → USDC to platform wallet)
export async function createPaymentOrder(params: CreatePaymentOrderParams): Promise<PaymentOrderResponse> {
  const serverKey = process.env.CROSSMINT_SERVER_KEY;
  if (!serverKey) {
    console.error("[Crossmint] CROSSMINT_SERVER_KEY not configured");
    throw new Error("CROSSMINT_SERVER_KEY not configured");
  }

  if (!PLATFORM_WALLET) {
    console.error("[Crossmint] PLATFORM_WALLET_ADDRESS not configured");
    throw new Error("PLATFORM_WALLET_ADDRESS not configured");
  }

  console.log("[Crossmint] Creating order:", {
    productId: params.productId,
    amountUsd: params.amountUsd,
    buyerEmail: params.buyerEmail,
    platformWallet: PLATFORM_WALLET,
  });

  try {
    const response = await fetch(`${CROSSMINT_API}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": serverKey,
      },
      body: JSON.stringify({
        lineItems: [
          {
            tokenLocator: USDC_TOKEN_LOCATOR,
            executionParameters: {
              mode: "exact-in",
              amount: String(params.amountUsd),
            },
          },
        ],
        payment: {
          method: "card",
          receiptEmail: params.buyerEmail,
        },
        recipient: {
          walletAddress: PLATFORM_WALLET,
        },
        metadata: {
          viajaxOrderId: params.orderId,
          productId: params.productId,
          title: params.title,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("[Crossmint] API error:", {
        status: response.status,
        response: errorData,
      });
      throw new Error(`Crossmint API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log("[Crossmint] Order created:", data.order?.orderId || data.orderId);

    if (!data.clientSecret) {
      console.error("[Crossmint] No clientSecret in response:", data);
      throw new Error("Crossmint did not return clientSecret");
    }

    return {
      orderId: params.orderId,
      crossmintOrderId: data.order?.orderId || data.orderId || data.id,
      clientSecret: data.clientSecret || "",
    };
  } catch (error) {
    console.error("[Crossmint] Error creating order:", (error as Error).message);
    throw error;
  }
}

// Check order status on Crossmint
export async function getOrderStatus(crossmintOrderId: string): Promise<"pending" | "confirmed" | "failed"> {
  const serverKey = process.env.CROSSMINT_SERVER_KEY;
  if (!serverKey) {
    throw new Error("CROSSMINT_SERVER_KEY not configured");
  }

  try {
    const response = await fetch(`${CROSSMINT_API}/orders/${crossmintOrderId}`, {
      headers: { "X-API-KEY": serverKey },
    });

    if (!response.ok) {
      throw new Error(`Crossmint API error: ${response.status}`);
    }

    const data = await response.json();
    const status = data.payment?.status || data.status;

    if (status === "completed" || status === "succeeded") return "confirmed";
    if (status === "failed" || status === "canceled") return "failed";
    return "pending";
  } catch (error) {
    console.error("[Crossmint] Error checking order:", (error as Error).message);
    return "pending";
  }
}

// Verify webhook signature using CROSSMINT_WEBHOOK_SECRET (HMAC-SHA256)
export function verifyWebhook(payload: string, signature: string): boolean {
  try {
    const secret = process.env.CROSSMINT_WEBHOOK_SECRET;
    if (!secret) {
      console.error("[Crossmint] CROSSMINT_WEBHOOK_SECRET not configured");
      return false;
    }
    const expectedSignature = createHmac("sha256", secret)
      .update(payload)
      .digest("hex");
    return signature === expectedSignature || signature === `sha256=${expectedSignature}`;
  } catch (error) {
    console.error("[Crossmint] Error verifying webhook:", (error as Error).message);
    return false;
  }
}
