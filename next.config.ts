import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow local image optimization
    unoptimized: true,
    // Configure remote patterns if needed for production CDN later
    remotePatterns: [],
  },
};

export default nextConfig;
