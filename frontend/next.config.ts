import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Don't block the build on lint warnings during development
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
