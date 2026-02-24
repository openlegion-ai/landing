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

const title = "OpenLegion — Secure AI Agent Framework | Container-Isolated, Open Source";
const description =
  "Deploy container-isolated AI agent fleets in 60 seconds. Six security layers, per-agent cost control, deterministic YAML workflows. 1,124 tests, 100+ LLM providers, BSL 1.1 licensed. The open-source alternative to OpenClaw, NanoClaw, and MemuBot.";

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
    title: "OpenLegion — Secure AI Agent Framework",
    description:
      "Container-isolated AI agent fleets. Six security layers, per-agent cost control, deterministic orchestration. Open source, BSL 1.1 licensed.",
    type: "website",
    siteName: "OpenLegion",
    url: "https://openlegion.ai",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "OpenLegion" }],
  },
  twitter: {
    card: "summary",
    title: "OpenLegion — Secure AI Agent Framework",
    description:
      "Container-isolated AI agent fleets. Six security layers, per-agent cost control, deterministic orchestration. Open source, BSL 1.1 licensed.",
    images: ["/logo.png"],
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
      "1,124 tests, 38 built-in tools, 100+ LLM providers via LiteLLM, 5 messaging channels, real-time dashboard, ~19,000 lines auditable in a day.",
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
