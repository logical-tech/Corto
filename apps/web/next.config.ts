import type { NextConfig } from "next"
import path from "node:path"

const nextConfig: NextConfig = {
  agentRules: false,
  allowedDevOrigins: ["127.0.0.1"],
  output: "standalone",
  transpilePackages: ["@workspace/ui"],
  turbopack: { root: path.join(process.cwd(), "../..") },
  async rewrites() {
    return process.env.NODE_ENV === "development"
      ? [
          {
            source: "/api/:path*",
            destination: "http://127.0.0.1:8787/api/:path*",
          },
        ]
      : []
  },
}

export default nextConfig
