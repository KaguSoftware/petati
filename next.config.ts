import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Store logo upload in the create-store wizard (2 MB file + multipart overhead).
  experimental: { serverActions: { bodySizeLimit: "3mb" } },
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "127.0.0.1" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
};

export default withNextIntl(nextConfig);
