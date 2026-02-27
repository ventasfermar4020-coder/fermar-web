import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fermar-images.sfo3.digitaloceanspaces.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "fermar-images.sfo3.cdn.digitaloceanspaces.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
