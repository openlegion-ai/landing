import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const title = "OpenLegion — Open Source AI Agent Framework for Production";
const description =
  "Deploy autonomous AI agent fleets with container isolation, per-agent cost control, and six security layers. 1,550 tests, 100+ LLM providers, deterministic YAML workflows. Open source.";

export const metadata: Metadata = {
  metadataBase: new URL("https://openlegion.ai"),
  title,
  description,
  keywords: [
    "AI agent framework",
    "multi-agent system",
    "LLM orchestration",
    "container isolated AI agents",
    "open source AI agent framework",
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
    title: "OpenLegion — Open Source AI Agent Framework for Production",
    description:
      "Deploy autonomous AI agent fleets with container isolation, per-agent cost control, and six security layers. Open source, zero external dependencies.",
    type: "website",
    siteName: "OpenLegion",
    url: "https://openlegion.ai",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "OpenLegion — The AI agent framework built for production." }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@openlegion",
    title: "OpenLegion — Open Source AI Agent Framework for Production",
    description:
      "Deploy autonomous AI agent fleets with container isolation, per-agent cost control, and six security layers. Open source, zero external dependencies.",
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
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "OpenLegion",
    description,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Linux, macOS, Windows",
    programmingLanguage: "Python",
    license: "https://github.com/openlegion-ai/openlegion/blob/main/LICENSE",
    url: "https://openlegion.ai",
    downloadUrl: "https://github.com/openlegion-ai/openlegion",
    softwareVersion: "0.1.0",
    releaseNotes:
      "Container-isolated AI agent fleets with six security layers, per-agent cost control, 1,550 tests, 40 built-in tools, 100+ LLM providers, real-time dashboard, and MCP support.",
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

  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
