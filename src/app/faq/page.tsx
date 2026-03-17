import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AnimateIn, StaggerContainer, StaggerItem } from "@/components/ui/animate-in";
import { ALL_FAQ_ITEMS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Answers to common questions about OpenLegion — the AI agent framework and platform built for production. Covers security, pricing, LLM providers, orchestration, enterprise deployment, and more.",
  alternates: {
    canonical: "https://www.openlegion.ai/faq",
  },
  openGraph: {
    title: "Frequently Asked Questions — OpenLegion",
    description:
      "Answers to common questions about OpenLegion — security, pricing, LLM providers, orchestration, and enterprise deployment.",
    type: "website",
    siteName: "OpenLegion",
    url: "https://www.openlegion.ai/faq",
  },
  twitter: {
    card: "summary_large_image",
    site: "@openlegion",
    title: "Frequently Asked Questions — OpenLegion",
    description:
      "Answers to common questions about OpenLegion — security, pricing, LLM providers, orchestration, and enterprise deployment.",
  },
};

export default async function FAQPage() {
  const t = await getTranslations("faq");
  const tc = await getTranslations("common");

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: ALL_FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.openlegion.ai" },
      { "@type": "ListItem", position: 2, name: "FAQ", item: "https://www.openlegion.ai/faq" },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c") }}
      />
      <a href="#main" className="skip-nav">{tc("skipToContent")}</a>
      <Navbar />
      <main id="main" className="relative px-5 pt-28 pb-16 sm:px-6 md:px-8 md:pt-36 md:pb-28 lg:pt-40 lg:pb-36">
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
            {ALL_FAQ_ITEMS.map((item, i) => (
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
