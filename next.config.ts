import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Google și alții cer /favicon.ico — fără acest URL rămâne iconița generică în search
      { source: "/favicon.ico", destination: "/icon.ico" },
    ];
  },
};

export default nextConfig;
