// Funções para integração com Crossmint — pagamento com cartão → USDC invisível

interface CreatePaymentOrderParams {
  productId: string;
  amountUsd: number;
  buyerEmail: string;
  creatorWallet: string;
  platformWallet: string;
  orderId: string;
}

interface PaymentOrderResponse {
  orderId: string;
  crossmintOrderId: string;
  clientSecret: string;
}

const CROSSMINT_API = "https://www.crossmint.com/api/2022-06-09";

// Criar ordem de pagamento via Crossmint
export async function createPaymentOrder(params: CreatePaymentOrderParams): Promise<PaymentOrderResponse> {
  const serverKey = process.env.CROSSMINT_SERVER_KEY;
  if (!serverKey) {
    throw new Error("CROSSMINT_SERVER_KEY não configurada");
  }

  try {
    const response = await fetch(`${CROSSMINT_API}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": serverKey,
      },
      body: JSON.stringify({
        payment: {
          method: "fiat",
          currency: "usd",
          amount: params.amountUsd,
        },
        recipient: {
          walletAddress: params.platformWallet,
        },
        metadata: {
          productId: params.productId,
          orderId: params.orderId,
          buyerEmail: params.buyerEmail,
          creatorWallet: params.creatorWallet,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Crossmint API erro: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    return {
      orderId: params.orderId,
      crossmintOrderId: data.orderId || data.id,
      clientSecret: data.clientSecret || "",
    };
  } catch (erro) {
    console.error("[Crossmint] Erro ao criar ordem:", (erro as Error).message);
    throw erro;
  }
}

// Verificar estado de uma ordem
export async function getOrderStatus(crossmintOrderId: string): Promise<"pending" | "confirmed" | "failed"> {
  const serverKey = process.env.CROSSMINT_SERVER_KEY;
  if (!serverKey) {
    throw new Error("CROSSMINT_SERVER_KEY não configurada");
  }

  try {
    const response = await fetch(`${CROSSMINT_API}/orders/${crossmintOrderId}`, {
      headers: {
        "X-API-KEY": serverKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Crossmint API erro: ${response.status}`);
    }

    const data = await response.json();
    const status = data.payment?.status || data.status;

    if (status === "completed" || status === "succeeded") return "confirmed";
    if (status === "failed" || status === "canceled") return "failed";
    return "pending";
  } catch (erro) {
    console.error("[Crossmint] Erro ao verificar ordem:", (erro as Error).message);
    return "pending";
  }
}

// Verificar webhook signature do Crossmint
export function verifyWebhook(payload: string, signature: string): boolean {
  try {
    // Crossmint usa HMAC-SHA256 com a server key
    const crypto = require("crypto");
    const serverKey = process.env.CROSSMINT_SERVER_KEY || "";
    const expectedSignature = crypto
      .createHmac("sha256", serverKey)
      .update(payload)
      .digest("hex");
    return signature === expectedSignature;
  } catch (erro) {
    console.error("[Crossmint] Erro ao verificar webhook:", (erro as Error).message);
    return false;
  }
}
