import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_SC } from "next/font/google";
import Script from "next/script";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { GITHUB_URL, DISCORD_URL, TWITTER_URL, RTL_LOCALES, SUPPORTED_LOCALES } from "@/lib/constants";
import { ogLocaleFor } from "@/lib/content-page-helpers";
import { Navbar } from "@/components/navbar";
import { LaunchPricingBand } from "@/components/launch-pricing-band";
import { ConsentManager } from "@/components/consent-manager";
import { gaBootstrapScript } from "@/lib/consent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// CJK font for Chinese — other CJK locales fall back to system fonts.
// preload: false — only zh locales need it; the unicode-range @font-face
// rules mean non-CJK pages never download these files.
const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sc",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  preload: false,
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/** Map locale codes to OG locale format */
const OG_LOCALE_MAP: Record<string, string> = {
  en: "en_US", zh: "zh_CN", "zh-TW": "zh_TW", ja: "ja_JP", ko: "ko_KR",
  es: "es_ES", fr: "fr_FR", de: "de_DE", pt: "pt_BR", ar: "ar_SA",
  hi: "hi_IN", ru: "ru_RU", th: "th_TH",
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("metadata");
  const base = "https://www.openlegion.ai";

  // Build hreflang alternates for <link rel="alternate" hreflang="..." />
  const languages: Record<string, string> = {};
  for (const loc of SUPPORTED_LOCALES) {
    languages[loc] = `${base}/${loc}`;
  }
  languages["x-default"] = `${base}/en`;

  return {
    metadataBase: new URL(base),
    title: {
      default: t("homeTitle"),
      template: "%s | OpenLegion",
    },
    description: t("homeDescription"),
    keywords: [
      "AI agent framework",
      "multi-agent system",
      "LLM orchestration",
      "autonomous AI agents",
      "AI agent security",
      "AI agent sandbox",
      "AI agent cost control",
      "openclaw alternative",
      "AI agent deployment",
      "production AI agents",
      "multi-agent orchestration",
      "secure AI agents",
      "AI agent fleet",
      "managed AI agent hosting",
      "AI agent governance",
      "AI agent cost governance",
      "ACL-based AI agents",
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
      canonical: `${base}/${locale}`,
      languages,
    },
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      type: "website",
      siteName: "OpenLegion",
      url: `${base}/${locale}`,
      locale: OG_LOCALE_MAP[locale] || "en_US",
      images: [{ url: `/og/${ogLocaleFor(locale)}/home.png`, width: 1200, height: 630, alt: t("ogTitle") }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@openlegion",
      title: t("twitterTitle"),
      description: t("twitterDescription"),
      images: [`/og/${ogLocaleFor(locale)}/home.png`],
    },
    other: {
      "theme-color": "#ffffff",
    },
    robots: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large" as const,
      "max-video-preview": -1,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();
  const tNav = await getTranslations("common");
  const tSchema = await getTranslations("schema");

  // Stable @id refs let AI assistants and search engines resolve every entity
  // on this site to the same canonical record — Organization, WebSite,
  // SoftwareApplication, SoftwareSourceCode, and the managed-hosting Service.
  // All five are emitted in a single @graph so the relationships (publisher,
  // author, provider) collapse to ID references rather than
  // duplicated nested objects.
  const ORG_ID = "https://www.openlegion.ai/#organization";
  const WEBSITE_ID = "https://www.openlegion.ai/#website";
  const SOFTWARE_ID = "https://www.openlegion.ai/#software";
  const SOURCE_CODE_ID = "https://www.openlegion.ai/#sourcecode";
  const SERVICE_ID = "https://www.openlegion.ai/#managed-hosting";

  const siteGraphJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORG_ID,
        name: "OpenLegion",
        url: "https://www.openlegion.ai",
        logo: {
          "@type": "ImageObject",
          url: "https://www.openlegion.ai/logo.png",
          width: 256,
          height: 256,
        },
        description: tSchema("orgDescription"),
        foundingDate: "2025",
        knowsAbout: [
          "AI agent orchestration",
          "AI agent security",
          "Credential vaulting",
          "Multi-agent systems",
          "Large language model deployment",
        ],
        sameAs: [GITHUB_URL, TWITTER_URL, DISCORD_URL],
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        name: "OpenLegion",
        url: "https://www.openlegion.ai",
        publisher: { "@id": ORG_ID },
        inLanguage: SUPPORTED_LOCALES,
        // No SearchAction: the only search we run is the v1 docs site, which
        // is not a search of openlegion.ai.
      },
      {
        "@type": "SoftwareApplication",
        "@id": SOFTWARE_ID,
        name: "OpenLegion",
        applicationCategory: "DeveloperApplication",
        applicationSubCategory: tSchema("applicationSubCategory"),
        operatingSystem: "Web browser",
        url: "https://www.openlegion.ai",
        softwareVersion: "2.0",
        description: tSchema("softwareDescription"),
        publisher: { "@id": ORG_ID },
        author: { "@id": ORG_ID },
        // No license / codeRepository: the hosted product is not the public
        // GitHub repo (that is the v1 engine, described by SoftwareSourceCode).
        softwareRequirements: "A web browser and a Google account",
        // No `offers`: hosted plans are waitlist-only right now, and structured
        // data must match what a visitor can actually buy on the page.
        featureList: tSchema.raw("softwareFeatureList") as string[],
      },
      {
        "@type": "SoftwareSourceCode",
        "@id": SOURCE_CODE_ID,
        name: tSchema("sourceCodeName"),
        codeRepository: GITHUB_URL,
        programmingLanguage: "Python",
        runtimePlatform: "Docker",
        license: `${GITHUB_URL}/blob/main/LICENSE`,
        codeSampleType: "full",
        author: { "@id": ORG_ID },
      },
      {
        "@type": "Service",
        "@id": SERVICE_ID,
        name: tSchema("serviceName"),
        serviceType: tSchema("serviceType"),
        provider: { "@id": ORG_ID },
        areaServed: tSchema("areaServed"),
        description: tSchema("serviceDescription"),
        url: `https://www.openlegion.ai/${locale}/pricing`,
      },
    ],
  };

  return (
    <html lang={locale} dir={RTL_LOCALES.has(locale) ? "rtl" : "ltr"}>
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
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://www.clarity.ms" />
        <link rel="dns-prefetch" href="https://embed.tawk.to" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteGraphJsonLd).replace(/</g, "\\u003c") }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSansSC.variable} antialiased`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <a href="#main" className="skip-nav">{tNav("skipToContent")}</a>
          <header className="sticky top-0 z-50">
            <LaunchPricingBand />
            <Navbar />
          </header>
          {children}
          <ConsentManager />
        </NextIntlClientProvider>
        {/* GA with Consent Mode v2, production host only. Clarity, the Meta
            Pixel and Tawk.to chat are loaded by <ConsentManager /> — see
            src/lib/consent.ts. */}
        <Script id="google-analytics" strategy="afterInteractive">
          {gaBootstrapScript()}
        </Script>
      </body>
    </html>
  );
}
