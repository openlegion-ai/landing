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

// URLs that lived on the old flat layout before the 2026-04 SEO restructure.
// 301 redirects across every locale prefix preserve existing rankings +
// inbound links — the PR's whole rationale is that 301s carry equity to the
// new canonical URLs. Any URL that was previously indexed must be listed here
// or it 404s on production traffic.
const URL_MIGRATIONS: Array<{ from: string; to: string }> = [
  // Topic pages: /<topic> → /learn/<topic>
  { from: "/ai-agent-platform",      to: "/learn/ai-agent-platform" },
  { from: "/ai-agent-orchestration", to: "/learn/ai-agent-orchestration" },
  { from: "/ai-agent-frameworks",    to: "/learn/ai-agent-frameworks" },
  { from: "/ai-agent-security",      to: "/learn/ai-agent-security" },
  // Comparison pages: /comparison-<x> → /comparison/<x> (flat → hub-relative)
  { from: "/comparison-autogen",            to: "/comparison/autogen" },
  { from: "/comparison-aws-strands",        to: "/comparison/aws-strands" },
  { from: "/comparison-crewai",             to: "/comparison/crewai" },
  { from: "/comparison-dify",               to: "/comparison/dify" },
  { from: "/comparison-google-adk",         to: "/comparison/google-adk" },
  { from: "/comparison-langgraph",          to: "/comparison/langgraph" },
  { from: "/comparison-manus-ai",           to: "/comparison/manus-ai" },
  { from: "/comparison-memu",               to: "/comparison/memu" },
  { from: "/comparison-nanobot",            to: "/comparison/nanobot" },
  { from: "/comparison-nanoclaw",           to: "/comparison/nanoclaw" },
  { from: "/comparison-openai-agents-sdk",  to: "/comparison/openai-agents-sdk" },
  { from: "/comparison-openclaw",           to: "/comparison/openclaw" },
  { from: "/comparison-openfang",           to: "/comparison/openfang" },
  { from: "/comparison-picoclaw",           to: "/comparison/picoclaw" },
  { from: "/comparison-semantic-kernel",    to: "/comparison/semantic-kernel" },
  { from: "/comparison-zeroclaw",           to: "/comparison/zeroclaw" },
  // Hub renames: the old /comparison-all-competitors became the /comparison hub.
  { from: "/comparison-all-competitors", to: "/comparison" },
  // Slug rename: deepseek-v4 → deepseek-v4-agents.
  { from: "/deepseek-v4", to: "/deepseek-v4-agents" },
];

function buildMigrationRedirects() {
  // For each migration, emit one redirect per locale-prefix variant — the
  // un-prefixed path (so a bare /comparison-openclaw works) plus every
  // /<locale>/<path> Google may have indexed.
  const localePaths = ["", ...SUPPORTED_LOCALES.map((l) => `/${l}`)];
  return URL_MIGRATIONS.flatMap(({ from, to }) =>
    localePaths.map((prefix) => ({
      source: `${prefix}${from}`,
      destination: `${prefix}${to}`,
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
      ...buildMigrationRedirects(),
    ];
  },
};

export default withNextIntl(nextConfig);
