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
      "container isolated AI agents",
      "autonomous AI agents",
      "AI agent security",
      "AI agent sandbox",
      "AI agent cost control",
      "python AI agent framework",
      "openclaw alternative",
      "self-hosted AI agents",
      "fleet model AI agents",
      "AI agent deployment",
      "production AI agents",
      "multi-agent orchestration",
      "secure AI agents",
      "AI agent fleet",
      "managed AI agent hosting",
      "AI agent governance",
      "AI agent cost governance",
      "ACL-based AI agents",
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
  // codeRepository, provider, offers) collapse to ID references rather than
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
          "Container isolation",
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
        potentialAction: {
          "@type": "SearchAction",
          target: "https://docs.openlegion.ai/search?q={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "SoftwareApplication",
        "@id": SOFTWARE_ID,
        name: "OpenLegion",
        applicationCategory: "DeveloperApplication",
        applicationSubCategory: tSchema("applicationSubCategory"),
        operatingSystem: "Linux, macOS, Windows",
        url: "https://www.openlegion.ai",
        downloadUrl: GITHUB_URL,
        softwareVersion: "0.1.0",
        description: tSchema("softwareDescription"),
        publisher: { "@id": ORG_ID },
        author: { "@id": ORG_ID },
        license: `${GITHUB_URL}/blob/main/LICENSE`,
        codeRepository: GITHUB_URL,
        programmingLanguage: "Python",
        softwareRequirements: "Python 3.10+, Docker",
        offers: {
          "@type": "Offer",
          price: "19",
          priceCurrency: "USD",
          url: `https://www.openlegion.ai/${locale}/pricing`,
          availability: "https://schema.org/InStock",
        },
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
        targetProduct: { "@id": SOFTWARE_ID },
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
        offers: [
          { "@type": "Offer", name: "Basic",   price: "19",  priceCurrency: "USD", availability: "https://schema.org/InStock" },
          { "@type": "Offer", name: "Growth",  price: "62",  priceCurrency: "USD", availability: "https://schema.org/InStock" },
          { "@type": "Offer", name: "Pro",     price: "152", priceCurrency: "USD", availability: "https://schema.org/InStock" },
          { "@type": "Offer", name: "Pro Max", price: "296", priceCurrency: "USD", availability: "https://schema.org/InStock" },
        ],
      },
    ],
  };

  return (
    <html lang={locale} dir={RTL_LOCALES.has(locale) ? "rtl" : "ltr"} className="dark">
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
        </NextIntlClientProvider>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-758JT3002Y"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-758JT3002Y', {
              linker: { domains: ['openlegion.ai', 'www.openlegion.ai', 'app.openlegion.ai'] }
            });
          `}
        </Script>
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '2386274771877282');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element -- Meta Pixel noscript beacon must be a raw 1x1 img */}
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            alt=""
            src="https://www.facebook.com/tr?id=2386274771877282&ev=PageView&noscript=1"
          />
        </noscript>
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "voko6al3fo");
          `}
        </Script>
        <Script id="tawk-to" strategy="lazyOnload">
          {`
            window.Tawk_API=window.Tawk_API||{};
            window.Tawk_LoadStart=new Date();
            (function(){
              var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
              s1.async=true;
              s1.src='https://embed.tawk.to/69a6e380ed6e941c36908edc/1jipuhbks';
              s1.charset='UTF-8';
              s1.setAttribute('crossorigin','*');
              s0.parentNode.insertBefore(s1,s0);
            })();
          `}
        </Script>
      </body>
    </html>
  );
}
