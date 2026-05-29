import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allow local network access during development
  allowedDevOrigins: ["10.10.10.2", "192.168.1.11", "localhost"],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
