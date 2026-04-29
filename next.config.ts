import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { SUPPORTED_LOCALES } from "./src/lib/constants";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://*.clarity.ms https://embed.tawk.to https://va.tawk.to https://static.tawk.to https://vercel.live",
      "style-src 'self' 'unsafe-inline' https://*.clarity.ms https://embed.tawk.to https://static.tawk.to",
      "img-src 'self' data: blob: https://www.google-analytics.com https://www.googletagmanager.com https://*.clarity.ms https://*.tawk.to",
      "font-src 'self' https://embed.tawk.to https://static.tawk.to",
      "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://*.clarity.ms https://embed.tawk.to wss://embed.tawk.to https://*.tawk.to wss://*.tawk.to",
      "frame-src https://va.tawk.to",
      "frame-ancestors 'self' https://*.clarity.ms",
      "worker-src 'self' blob:",
    ].join("; "),
  },
];

// Topic pages moved from root to /learn/* on 2026-04. Preserve the existing
// rankings + inbound links via 301 redirects across every locale prefix.
const RELOCATED_TOPICS = [
  "ai-agent-platform",
  "ai-agent-orchestration",
  "ai-agent-frameworks",
  "ai-agent-security",
];

function buildTopicRedirects() {
  const localePaths = ["", ...SUPPORTED_LOCALES.map((l) => `/${l}`)];
  return RELOCATED_TOPICS.flatMap((topic) =>
    localePaths.map((prefix) => ({
      source: `${prefix}/${topic}`,
      destination: `${prefix}/learn/${topic}`,
      permanent: true,
    }))
  );
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 31536000,
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/comparisons",
        destination: "/comparison",
        permanent: true,
      },
      ...buildTopicRedirects(),
    ];
  },
};

export default withNextIntl(nextConfig);
