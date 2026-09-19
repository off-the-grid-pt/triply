import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.TRIPLY_E2E === "1" ? ".next-e2e" : ".next",
  reactStrictMode: true,
  experimental: {
    serverActions: {
      // Allows multipart overhead while the domain and Storage both enforce a 10 MB file limit.
      bodySizeLimit: "11mb",
    },
  },
};

export default nextConfig;
