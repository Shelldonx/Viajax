import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["pdf-parse", "mysql2", "@solana/web3.js", "bs58"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "viajax.es" },
    ],
  },
};

export default nextConfig;
