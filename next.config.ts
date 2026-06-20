import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'innoida.utho.io',
      },
    ],
  },
};

export default nextConfig;
