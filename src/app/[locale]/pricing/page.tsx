import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Footer } from "@/components/footer";
import { JsonLd, buildFAQSchema } from "@/components/json-ld";
import { PageHead, SpecList, FaqList, CtaBand } from "@/components/site/page-parts";
import { CtaLink } from "@/components/site/cta-link";
import { IconArrow } from "@/components/site/icons";
import { DEMO_URL, WAITLIST_URL } from "@/lib/constants";
import { navPageAlternates, OG_LOCALE_MAP, SITE_URL } from "@/lib/seo";
import { ogLocaleFor } from "@/lib/content-page-helpers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "platformMeta" });
  return {
    title: t("pricingTitle"),
    description: t("pricingDescription"),
    alternates: navPageAlternates(locale, "/pricing"),
    openGraph: {
      title: t("pricingTitle"),
      description: t("pricingDescription"),
      type: "website",
      siteName: "OpenLegion",
      url: `${SITE_URL}/${locale}/pricing`,
      locale: OG_LOCALE_MAP[locale] || "en_US",
      images: [{ url: `/og/${ogLocaleFor(locale)}/pricing.png`, width: 1200, height: 630, alt: t("pricingTitle") }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@openlegion",
      images: [`/og/${ogLocaleFor(locale)}/pricing.png`],
      title: t("pricingTitle"),
      description: t("pricingDescription"),
    },
  };
}

const ITEMS = 7;
const LEDGER = 4;
const FAQ = 4;
/** Where each stage shows up in the API (identifiers, not prose). */
const STAGE_IDS = ["org.credits", "ws_", "run_", "act_"];

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("billingPage");
  const tc = await getTranslations("contentPage");

  const items = Array.from({ length: ITEMS }, (_, i) => ({
    title: t(`items.${i}.title`),
    body: t(`items.${i}.body`),
    proof: t(`items.${i}.proof`),
  }));
  const faq = Array.from({ length: FAQ }, (_, i) => ({ q: t(`faq.${i}.q`), a: t(`faq.${i}.a`) }));

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: tc("breadcrumbHome"), item: `${SITE_URL}/${locale}` },
      { "@type": "ListItem", position: 2, name: t("title"), item: `${SITE_URL}/${locale}/pricing` },
    ],
  };

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd, buildFAQSchema(faq.map((f) => ({ question: f.q, answer: f.a })), "/pricing", locale)]} />
      <main id="main">
        <PageHead
          crumbLabel={tc("breadcrumbAriaLabel")}
          crumbs={[{ href: "/", label: tc("breadcrumbHome") }, { label: t("title") }]}
          title={t("title")}
          lede={t("lede")}
          actions={
            <>
              <CtaLink href={DEMO_URL} location="pricing_call" className="btn">
                {t("ctaPrimary")} <IconArrow />
              </CtaLink>
              <CtaLink href={WAITLIST_URL} location="pricing_access" className="btn btn-secondary">
                {t("ctaSecondary")}
              </CtaLink>
            </>
          }
          aside={
            <figure className="panel overflow-hidden">
              <figcaption className="panel-head">
                <span className="font-semibold text-[var(--fg)]">{t("ledgerTitle")}</span>
              </figcaption>
              <ol className="relative px-5 py-3 sm:px-6">
                {Array.from({ length: LEDGER }, (_, i) => (
                  <li key={i} className="relative grid grid-cols-[1.75rem_1fr_auto] items-center gap-x-4 py-3.5">
                    {i < LEDGER - 1 && (
                      <span className="absolute start-[0.84rem] top-[calc(50%+14px)] h-[calc(100%-28px)] w-px bg-[var(--line-2)]" aria-hidden="true" />
                    )}
                    <span className="t-mono t-num flex size-7 items-center justify-center rounded-full border border-[var(--line-2)] bg-[var(--surface-2)] text-[0.6875rem] text-[var(--fg-2)]" aria-hidden="true">
                      {i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[0.9375rem] font-medium text-[var(--fg)]">{t(`ledger.${i}.k`)}</span>
                      <span className="t-mono block text-[0.6875rem] text-[var(--blue-ink)]" dir="ltr">
                        {STAGE_IDS[i]}
                      </span>
                    </span>
                    <span className="text-end text-[0.8125rem] text-[var(--fg-2)]">{t(`ledger.${i}.v`)}</span>
                  </li>
                ))}
              </ol>
            </figure>
          }
        />

        <section className="section hairline !pt-16" aria-label={t("title")}>
          <div className="wrap">
            <SpecList items={items} columns={2} />
          </div>
        </section>

        <CtaBand id="pricing-cta" title={t("ctaTitle")} body={t("ctaBody")}>
          <CtaLink href={DEMO_URL} location="pricing_cta_call" className="btn">
            {t("ctaPrimary")} <IconArrow />
          </CtaLink>
          <CtaLink href={WAITLIST_URL} location="pricing_cta_access" className="btn btn-secondary">
            {t("ctaSecondary")}
          </CtaLink>
        </CtaBand>

        <section className="section !pt-12" aria-labelledby="pricing-faq">
          <div className="wrap grid gap-12 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:gap-20">
            <div>
              <h2 id="pricing-faq" className="t-h2">{t("faqTitle")}</h2>
              <p className="t-body mt-6 max-w-[24rem]">
                {t("direct")}{" "}
                <a href={WAITLIST_URL} className="link">
                  {t("directLink")}
                </a>
              </p>
            </div>
            <FaqList items={faq} name="pricing-faq" />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
