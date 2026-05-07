import Link from "next/link";
import { BookOpen, Zap, Shield, TrendingUp, ArrowRight, Sparkles } from "lucide-react";

export default function Home() {
  const stats = [
    { label: "Platform Fee", value: "3%", detail: "Lowest in the market" },
    { label: "Payouts in", value: "USDC", detail: "On Solana Mainnet" },
    { label: "AI-powered", value: "GPT-4o", detail: "Create products in minutes" },
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-teal-500/5 via-transparent to-transparent" />
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-4 py-1.5 text-sm text-teal-400">
              <Sparkles className="h-4 w-4" />
              Powered by Solana Mainnet
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
              Sell your digital products.
              <br />
              <span className="bg-gradient-to-r from-teal-400 to-teal-200 bg-clip-text text-transparent">
                Get paid in USDC.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-gray-400">
              The open-source marketplace for low-ticket digital products. Only 3% fee — the lowest in the market.
              Create with AI, accept card & crypto, get paid in USDC automatically.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/marketplace"
                className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-teal-500/25 transition-all hover:bg-teal-600 hover:shadow-xl hover:shadow-teal-500/30"
              >
                Explore Marketplace
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard/products/new"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-8 py-3.5 text-sm font-semibold text-gray-300 transition-all hover:border-teal-500 hover:text-white"
              >
                Start Selling
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-gray-800/50 bg-gray-900/30">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-gray-800/50 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {stats.map((stat) => (
            <div key={stat.label} className="px-6 py-8 text-center">
              <p className="text-3xl font-extrabold text-teal-400">{stat.value}</p>
              <p className="mt-1 text-sm font-medium text-white">{stat.label}</p>
              <p className="mt-0.5 text-xs text-gray-500">{stat.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">Why Viajax?</h2>
          <p className="mt-3 text-gray-400">Everything you need to sell digital products, without the hassle.</p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Shield, title: "Simple Checkout", desc: "Credit card with no mention of crypto. Buyers never see blockchain." },
            { icon: Zap, title: "Solana Mainnet", desc: "USDC payments on Solana. Fast, cheap, and transparent." },
            { icon: BookOpen, title: "AI Studio", desc: "Upload a PDF and AI creates a professional product in minutes." },
            { icon: TrendingUp, title: "Only 3%", desc: "The lowest fee in the market. Hotmart charges 15-25%. We charge 3%." },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6 transition-all hover:border-teal-500/30"
            >
              <div className="mb-4 inline-flex rounded-xl bg-teal-500/10 p-3">
                <feature.icon className="h-6 w-6 text-teal-400" />
              </div>
              <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-xs text-gray-500">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="rounded-3xl border border-gray-800 bg-gradient-to-br from-teal-500/5 via-gray-900 to-gray-900 p-10 text-center sm:p-16">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Ready to start selling?
          </h2>
          <p className="mt-3 text-gray-400">
            Create your account, upload your content, and start earning in USDC.
          </p>
          <Link
            href="/dashboard/products/new"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-teal-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-teal-500/25 transition-all hover:bg-teal-600"
          >
            <Sparkles className="h-4 w-4" />
            Create My First Product
          </Link>
        </div>
      </section>
    </div>
  );
}
