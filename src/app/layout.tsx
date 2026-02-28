import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { FAQ_ITEMS, GITHUB_URL, DISCORD_URL, TWITTER_URL } from "@/lib/constants";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const title = "OpenLegion — Enterprise AI Agent Framework for Production";
const description =
  "Deploy autonomous AI agent fleets with container isolation, per-agent cost control, and six security layers. Self-hosted, enterprise-ready, audit-ready codebase. 1,607 tests, 100+ LLM providers, deterministic YAML workflows. BSL 1.1 licensed.";

export const metadata: Metadata = {
  metadataBase: new URL("https://openlegion.ai"),
  title,
  description,
  keywords: [
    "AI agent framework",
    "multi-agent system",
    "LLM orchestration",
    "container isolated AI agents",
    "AI agent framework",
    "autonomous AI agents",
    "AI agent security",
    "AI agent sandbox",
    "AI agent cost control",
    "python AI agent framework",
    "openclaw alternative",
    "self-hosted AI agents",
    "deterministic AI workflows",
    "AI agent deployment",
    "production AI agents",
    "multi-agent orchestration",
    "secure AI agents",
    "AI agent fleet",
    "enterprise AI agent framework",
    "on-premises AI agents",
    "enterprise AI deployment",
    "SOC 2 AI agents",
    "air-gapped AI deployment",
    "AI agent governance",
    "AI agent cost governance",
    "role-based access AI agents",
    "audit-ready AI framework",
    "self-hosted LLM orchestration",
  ],
  authors: [{ name: "OpenLegion Contributors" }],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  alternates: {
    canonical: "https://openlegion.ai",
  },
  openGraph: {
    title: "OpenLegion — Enterprise-Ready AI Agent Framework",
    description:
      "Deploy autonomous AI agent fleets with container isolation, per-agent cost control, and six security layers. Self-hosted, on-premises, audit-ready. Zero external dependencies.",
    type: "website",
    siteName: "OpenLegion",
    url: "https://openlegion.ai",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "OpenLegion — The AI agent framework built for production." }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@openlegion",
    title: "OpenLegion — Enterprise-Ready AI Agent Framework",
    description:
      "Deploy autonomous AI agent fleets with container isolation, per-agent cost control, and six security layers. Self-hosted, on-premises, audit-ready. Zero external dependencies.",
    images: ["/og.png"],
  },
  other: {
    "theme-color": "#08090c",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "OpenLegion",
    url: "https://openlegion.ai",
    logo: "https://openlegion.ai/logo.png",
    sameAs: [GITHUB_URL, TWITTER_URL, DISCORD_URL],
  };

  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "OpenLegion",
    description,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Linux, macOS, Windows",
    programmingLanguage: "Python",
    license: `${GITHUB_URL}/blob/main/LICENSE`,
    url: "https://openlegion.ai",
    downloadUrl: GITHUB_URL,
    softwareVersion: "0.1.0",
    releaseNotes:
      "Enterprise-ready AI agent fleets with container isolation, six security layers, per-agent cost governance, on-premises deployment, deterministic YAML workflows, 1,607 tests, 44 built-in tools, 100+ LLM providers, real-time dashboard, and MCP support.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    author: {
      "@type": "Organization",
      name: "OpenLegion",
      url: "https://openlegion.ai",
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <html lang="en" className="dark">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-758JT3002Y"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-758JT3002Y');
          `}
        </Script>
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "voko6al3fo");
          `}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
