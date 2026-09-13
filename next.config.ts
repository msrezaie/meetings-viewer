import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keystatic's GitHub storage mode redirects localhost -> 127.0.0.1 for the
  // OAuth callback; Next 16 blocks dev resources cross-origin without this.
  allowedDevOrigins: ["127.0.0.1"],
};

const withMDX = createMDX();

export default withMDX(nextConfig);
