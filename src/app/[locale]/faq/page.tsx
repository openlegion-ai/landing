import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Footer } from "@/components/footer";
import { AnimateIn, StaggerContainer, StaggerItem } from "@/components/ui/animate-in";
import { JsonLd, buildFAQSchema } from "@/components/json-ld";
import { ALL_FAQ_ITEMS } from "@/lib/constants";
import { navPageAlternates, OG_LOCALE_MAP, SITE_URL } from "@/lib/seo";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("metadata");
  const alternates = navPageAlternates(locale, "/faq");
  return {
    title: t("faqTitle"),
    description: t("faqDescription"),
    alternates,
    openGraph: {
      title: t("faqOgTitle"),
      description: t("faqOgDescription"),
      type: "website",
      siteName: "OpenLegion",
      url: `${SITE_URL}/${locale}/faq`,
      locale: OG_LOCALE_MAP[locale] || "en_US",
    },
    twitter: {
      card: "summary_large_image",
      site: "@openlegion",
      title: t("faqTwitterTitle"),
      description: t("faqTwitterDescription"),
    },
  };
}

export default async function FAQPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("faq");
  const tCommon = await getTranslations("contentPage");

  // Build the localized FAQ list from translations, matching the canonical
  // English ordering in ALL_FAQ_ITEMS (used as the source of truth for the
  // 14-item index range). Each locale's messages/<loc>.json provides the
  // translated question/answer at faq.items.<idx>.{question,answer}.
  const faqItems = ALL_FAQ_ITEMS.map((_, idx) => ({
    question: t(`items.${idx}.question`),
    answer: t(`items.${idx}.answer`),
  }));

  // BreadcrumbList here is built inline (not via `buildBreadcrumbSchema`)
  // because the FAQ page is locale-aware and uses translated breadcrumb
  // labels — the shared helper hardcodes English. `buildFAQSchema` is
  // reused for shape consistency.
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: tCommon("breadcrumbHome"), item: `${SITE_URL}/${locale}` },
      { "@type": "ListItem", position: 2, name: t("sectionLabel"), item: `${SITE_URL}/${locale}/faq` },
    ],
  };

  // JsonLd consolidates the two schemas into a single @graph payload —
  // matching the pattern used by the homepage and content pages.
  return (
    <>
      <JsonLd data={[breadcrumbJsonLd, buildFAQSchema(faqItems, "/faq")]} />
      <main id="main" className="relative px-5 pt-8 pb-16 sm:px-6 md:px-8 md:pt-16 md:pb-28 lg:pt-20 lg:pb-36">
        <div className="mx-auto max-w-3xl">
          <AnimateIn>
            <div className="mb-16 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">
                {t("sectionLabel")}
              </p>
              <h1 className="mb-5 text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                {t("heading")}
                <span className="gradient-text">{t("headingHighlight")}</span>
              </h1>
              <p className="mx-auto max-w-xl text-lg text-muted">
                {t("fullPageSubtitle")}
              </p>
            </div>
          </AnimateIn>

          <StaggerContainer className="space-y-3">
            {faqItems.map((item, i) => (
              <StaggerItem key={i}>
                <details className="faq-details gradient-border glass-shine overflow-hidden rounded-xl border border-border/50 glass-card transition-all duration-300 group">
                  <summary
                    className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-white/[0.02] list-none [&::-webkit-details-marker]:hidden"
                  >
                    <span className="text-sm font-medium text-foreground md:text-base">
                      {item.question}
                    </span>
                    <ChevronDown
                      className="h-4 w-4 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <div className="faq-answer px-6 pb-5">
                    <p className="text-sm leading-relaxed text-muted">
                      {item.answer}
                    </p>
                  </div>
                </details>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </main>
      <Footer />
    </>
  );
}
