import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
