import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { GITHUB_URL, DISCORD_URL, TWITTER_URL } from "@/lib/constants";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const defaultTitle = "OpenLegion — AI Agent Framework & Platform";
const description =
  "OpenLegion is a production-grade AI agent framework and platform for agentic AI orchestration. Deploy autonomous agent fleets in container-isolated sandboxes with built-in AI agent security — six layers enabled by default. Per-agent budgets, credential vaults, deterministic workflows, 100+ LLM providers.";

export const metadata: Metadata = {
  metadataBase: new URL("https://openlegion.ai"),
  title: {
    default: defaultTitle,
    template: "%s | OpenLegion",
  },
  description,
  keywords: [
    "AI agent framework",
    "multi-agent system",
    "LLM orchestration",
    "container isolated AI agents",
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
    "AI agent platform",
    "agentic AI framework",
    "agentic AI orchestration",
    "agentic AI security",
    "AI agent deployment platform",
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
    title: "OpenLegion — AI Agent Framework & Platform for Production",
    description:
      "Agentic AI framework with container isolation, per-agent cost control, and six security layers. AI agent orchestration, deployment, and governance — self-hosted, audit-ready.",
    type: "website",
    siteName: "OpenLegion",
    url: "https://openlegion.ai",
    locale: "en_US",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "OpenLegion — The AI agent framework built for production." }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@openlegion",
    title: "OpenLegion — AI Agent Framework & Platform for Production",
    description:
      "Agentic AI framework with container isolation, per-agent cost control, and six security layers. AI agent orchestration, deployment, and governance — self-hosted, audit-ready.",
    images: ["/og.png"],
  },
  other: {
    "theme-color": "#08090c",
  },
  robots: {
    index: true,
    follow: true,
    "max-snippet": -1,
    "max-image-preview": "large" as const,
    "max-video-preview": -1,
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
    logo: {
      "@type": "ImageObject",
      url: "https://openlegion.ai/logo.png",
      width: 512,
      height: 512,
    },
    description:
      "Managed AI agent platform with container isolation, credential vaults, and production-grade orchestration.",
    sameAs: [GITHUB_URL, TWITTER_URL, DISCORD_URL],
  };

  const webSiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "OpenLegion",
    url: "https://openlegion.ai",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://docs.openlegion.ai/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="alternate"
          type="text/plain"
          href="/llms.txt"
          title="LLM-friendly site summary"
        />
        <link
          rel="alternate"
          type="text/plain"
          href="/llms-full.txt"
          title="LLM-friendly full reference"
        />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.clarity.ms" />
        <link rel="dns-prefetch" href="https://www.clarity.ms" />
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
        <Script
          id="tawk-to"
          strategy="lazyOnload"
          src="https://embed.tawk.to/69a6e380ed6e941c36908edc/1jipuhbks"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd).replace(/</g, "\\u003c") }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd).replace(/</g, "\\u003c") }}
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
