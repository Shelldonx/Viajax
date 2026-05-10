"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { Code, ArrowRight, ExternalLink, Shield, Zap, Globe } from "lucide-react";
import Link from "next/link";

export default function DemoX402Page() {
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusCode, setStatusCode] = useState<number | null>(null);

  async function testX402() {
    setLoading(true);
    setResponse(null);
    try {
      const res = await fetch("/api/content/demo-order-001/download", {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      setStatusCode(res.status);
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      setResponse(`Error: ${(err as Error).message}`);
      setStatusCode(500);
    } finally {
      setLoading(false);
    }
  }

  async function testX402WithPayment() {
    setLoading(true);
    setResponse(null);
    try {
      const res = await fetch("/api/content/demo-order-001/download", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-PAYMENT": JSON.stringify({
            txSignature: "5exampleTxSignatureForDemoOnly123456789abcdef",
          }),
        },
      });
      setStatusCode(res.status);
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      setResponse(`Error: ${(err as Error).message}`);
      setStatusCode(500);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Hero */}
      <div className="mb-12 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-4 py-1.5 text-sm text-teal-400">
          <Shield className="h-4 w-4" />
          x402 Protocol Demo
        </div>
        <h1 className="text-4xl font-bold text-white sm:text-5xl">
          HTTP 402: <span className="text-teal-400">Payment Required</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">
          The internet&apos;s forgotten status code, finally put to use.
          Pay for content directly via HTTP headers using USDC on Solana Mainnet.
        </p>
      </div>

      {/* How it works */}
      <div className="mb-12 grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
          <Globe className="mb-3 h-8 w-8 text-teal-400" />
          <h3 className="mb-2 text-lg font-semibold text-white">1. Request Content</h3>
          <p className="text-sm text-gray-400">
            Client makes a standard HTTP GET request to access paid content.
          </p>
        </div>
        <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
          <Zap className="mb-3 h-8 w-8 text-orange-400" />
          <h3 className="mb-2 text-lg font-semibold text-white">2. HTTP 402 Response</h3>
          <p className="text-sm text-gray-400">
            Server returns 402 with <code className="text-teal-400">X-PAYMENT-REQUIRED</code> header
            containing USDC amount, recipient wallet, and network details.
          </p>
        </div>
        <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
          <ArrowRight className="mb-3 h-8 w-8 text-green-400" />
          <h3 className="mb-2 text-lg font-semibold text-white">3. Pay & Access</h3>
          <p className="text-sm text-gray-400">
            Client sends USDC on Solana, includes tx signature in <code className="text-teal-400">X-PAYMENT</code> header.
            Server verifies on-chain and grants access.
          </p>
        </div>
      </div>

      {/* Live Test */}
      <div className="mb-12 rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
        <h2 className="mb-4 text-xl font-bold text-white">
          <Code className="mr-2 inline h-5 w-5 text-teal-400" />
          Live Test
        </h2>

        <div className="flex flex-wrap gap-3">
          <Button onClick={testX402} loading={loading} variant="primary">
            Test: GET without payment
          </Button>
          <Button onClick={testX402WithPayment} loading={loading} variant="ghost">
            Test: GET with X-PAYMENT header
          </Button>
        </div>

        {response && (
          <div className="mt-6">
            <div className="mb-2 flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                statusCode === 402
                  ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                  : statusCode === 200
                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}>
                HTTP {statusCode}
              </span>
              <span className="text-xs text-gray-500">
                {statusCode === 402 ? "Payment Required — x402 protocol active" : "Response"}
              </span>
            </div>
            <pre className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-950 p-4 text-sm text-gray-300">
              <code>{response}</code>
            </pre>
          </div>
        )}
      </div>

      {/* Technical Details */}
      <div className="mb-12 rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
        <h2 className="mb-4 text-xl font-bold text-white">Technical Specification</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 rounded bg-teal-500/10 px-2 py-0.5 text-xs font-mono text-teal-400">Protocol</span>
            <span className="text-gray-300">x402/1.0</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 rounded bg-teal-500/10 px-2 py-0.5 text-xs font-mono text-teal-400">Network</span>
            <span className="text-gray-300">Solana Mainnet</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 rounded bg-teal-500/10 px-2 py-0.5 text-xs font-mono text-teal-400">Token</span>
            <span className="text-gray-300">USDC (EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v)</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 rounded bg-teal-500/10 px-2 py-0.5 text-xs font-mono text-teal-400">Recipient</span>
            <span className="text-gray-300 font-mono text-xs">FMfitdfABAD4Vgbw7G81TKyf5xX8VjSLEGEZ6Ei52Qwm</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 rounded bg-teal-500/10 px-2 py-0.5 text-xs font-mono text-teal-400">Verification</span>
            <span className="text-gray-300">On-chain tx signature verification via Solana RPC</span>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          href="https://github.com/Shelldonx/Viajax"
          target="_blank"
          className="flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-2.5 text-sm text-gray-300 transition-colors hover:border-teal-500/50 hover:text-white"
        >
          <Code className="h-4 w-4" />
          View Source on GitHub
          <ExternalLink className="h-3 w-3" />
        </Link>
        <Link
          href="https://solscan.io/account/FMfitdfABAD4Vgbw7G81TKyf5xX8VjSLEGEZ6Ei52Qwm"
          target="_blank"
          className="flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-2.5 text-sm text-gray-300 transition-colors hover:border-teal-500/50 hover:text-white"
        >
          <Zap className="h-4 w-4" />
          View Wallet on Solscan
          <ExternalLink className="h-3 w-3" />
        </Link>
        <Link
          href="/marketplace"
          className="flex items-center gap-2 rounded-xl border border-teal-500/30 bg-teal-500/10 px-4 py-2.5 text-sm text-teal-400 transition-colors hover:bg-teal-500/20"
        >
          Try buying a product
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
