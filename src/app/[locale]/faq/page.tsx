import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Footer } from "@/components/footer";
import { JsonLd, buildFAQSchema } from "@/components/json-ld";
import { PageHead, FaqList, CtaBand } from "@/components/site/page-parts";
import { CtaLink } from "@/components/site/cta-link";
import { IconArrow } from "@/components/site/icons";
import { HOME_FAQ_KEYS } from "@/components/home/sections";
import { DEMO_URL, WAITLIST_URL } from "@/lib/constants";
import { navPageAlternates, OG_LOCALE_MAP, SITE_URL } from "@/lib/seo";
import { ogLocaleFor } from "@/lib/content-page-helpers";

type PageProps = { params: Promise<{ locale: string }> };

const BILLING_FAQ = 4;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "platformMeta" });
  return {
    title: t("faqTitle"),
    description: t("faqDescription"),
    alternates: navPageAlternates(locale, "/faq"),
    openGraph: {
      title: t("faqTitle"),
      description: t("faqDescription"),
      type: "website",
      siteName: "OpenLegion",
      url: `${SITE_URL}/${locale}/faq`,
      locale: OG_LOCALE_MAP[locale] || "en_US",
      images: [{ url: `/og/${ogLocaleFor(locale)}/faq.png`, width: 1200, height: 630, alt: t("faqTitle") }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@openlegion",
      images: [`/og/${ogLocaleFor(locale)}/faq.png`],
      title: t("faqTitle"),
      description: t("faqDescription"),
    },
  };
}

/** /faq — the homepage questions plus the billing questions, one FAQPage. */
export default async function FAQPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("faqPage");
  const th = await getTranslations("homeFaq");
  const tb = await getTranslations("billingPage");
  const tn = await getTranslations("site.nav.links");
  const tc = await getTranslations("contentPage");

  const platform = HOME_FAQ_KEYS.map((k) => ({ q: th(`${k}.q`), a: th(`${k}.a`) }));
  const billing = Array.from({ length: BILLING_FAQ }, (_, i) => ({ q: tb(`faq.${i}.q`), a: tb(`faq.${i}.a`) }));
  const all = [...platform, ...billing].map((f) => ({ question: f.q, answer: f.a }));

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: tc("breadcrumbHome"), item: `${SITE_URL}/${locale}` },
      { "@type": "ListItem", position: 2, name: t("title"), item: `${SITE_URL}/${locale}/faq` },
    ],
  };

  const groups = [
    { id: "faq-platform", title: tn("platform"), items: platform },
    { id: "faq-billing", title: tb("faqTitle"), items: billing },
  ];

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd, buildFAQSchema(all, "/faq", locale)]} />
      <main id="main">
        <PageHead
          crumbLabel={tc("breadcrumbAriaLabel")}
          crumbs={[{ href: "/", label: tc("breadcrumbHome") }, { label: t("title") }]}
          title={t("title")}
          lede={t("lede")}
        />
        {groups.map((g, gi) => (
          <section key={g.id} className={`section ${gi === 0 ? "hairline !pt-16" : "!pt-4"}`} aria-labelledby={g.id}>
            <div className="wrap grid gap-8 lg:grid-cols-[minmax(0,0.6fr)_minmax(0,1.4fr)] lg:gap-20">
              <h2 id={g.id} className="t-h2 self-start !text-[clamp(1.6rem,1.2rem+1.3vw,2.25rem)] lg:sticky lg:top-32">
                {g.title}
              </h2>
              <FaqList items={g.items} name={g.id} />
            </div>
          </section>
        ))}
        <CtaBand id="faq-cta" title={t("cta")}>
          <CtaLink href={DEMO_URL} location="faq_call" className="btn">
            {t("ctaLink")} <IconArrow />
          </CtaLink>
          <CtaLink href={WAITLIST_URL} location="faq_access" className="btn btn-secondary">
            {t("ctaAccess")}
          </CtaLink>
        </CtaBand>
      </main>
      <Footer />
    </>
  );
}
