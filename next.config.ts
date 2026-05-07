import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["pdf-parse", "mysql2"],
  images: {
    domains: ["viajax.es"],
    unoptimized: false,
  },
};

export default nextConfig;
