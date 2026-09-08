import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    // Store logo upload in the create-store wizard (2 MB file + multipart overhead).
    serverActions: { bodySizeLimit: "3mb" },
    // Keep visited admin pages warm in the client router cache so sidebar/back navigations are
    // instant; server actions call refresh()/updateTag() so mutations still show up immediately.
    // static also bounds how long a fully prefetched sidebar page is reused: 60s keeps admin
    // lists fresh enough while sidebar clicks stay instant.
    staleTimes: { dynamic: 30, static: 60 },
  },
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
