// x402 Protocol — HTTP 402 Payment Required for digital content access
import { verifyUsdcPayment } from "./solana";

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const USDC_DECIMALS = 6;
const PLATFORM_WALLET = process.env.PLATFORM_WALLET_ADDRESS || "";

export interface X402Header {
  version: "x402/1.0";
  network: "solana-mainnet";
  token: string;
  amount: string;
  recipient: string;
  memo: string;
}

// Create the x402 payment-required header for a resource
export function createX402Header(orderId: string, amountUsdc: number): X402Header {
  const amountMicro = Math.round(amountUsdc * Math.pow(10, USDC_DECIMALS));
  return {
    version: "x402/1.0",
    network: "solana-mainnet",
    token: USDC_MINT,
    amount: String(amountMicro),
    recipient: PLATFORM_WALLET,
    memo: `viajax:${orderId}`,
  };
}

// Parse X-PAYMENT header from a paid request
export function parseX402PaymentHeader(header: string): { txSignature: string } {
  try {
    const parsed = JSON.parse(header);
    return { txSignature: parsed.txSignature || parsed.tx || "" };
  } catch {
    // If not JSON, treat as raw tx signature
    return { txSignature: header.trim() };
  }
}

// Verify an x402 payment from a request
export async function verifyX402Payment(
  request: Request,
  orderId: string,
  amountUsdc: number
): Promise<boolean> {
  const paymentHeader = request.headers.get("X-PAYMENT");
  if (!paymentHeader) return false;

  const { txSignature } = parseX402PaymentHeader(paymentHeader);
  if (!txSignature) return false;

  return verifyUsdcPayment(txSignature, amountUsdc, PLATFORM_WALLET);
}

// Build the HTTP 402 response with x402 headers
export function build402Response(orderId: string, amountUsdc: number): Response {
  const x402Header = createX402Header(orderId, amountUsdc);

  return new Response(
    JSON.stringify({
      error: "Payment Required",
      protocol: "x402",
      details: x402Header,
      instructions: {
        step1: "Send USDC on Solana Mainnet to the recipient address",
        step2: "Include the transaction signature in the X-PAYMENT header",
        step3: "Retry this request with the X-PAYMENT header",
      },
    }),
    {
      status: 402,
      headers: {
        "Content-Type": "application/json",
        "X-PAYMENT-REQUIRED": JSON.stringify(x402Header),
        "Access-Control-Expose-Headers": "X-PAYMENT-REQUIRED",
      },
    }
  );
}
