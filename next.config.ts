import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  outputFileTracingRoot: path.join(__dirname),
  serverExternalPackages: ["better-sqlite3"],
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
