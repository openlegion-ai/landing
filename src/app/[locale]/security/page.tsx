import type { Metadata } from "next";
import { Fragment } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Footer } from "@/components/footer";
import { JsonLd } from "@/components/json-ld";
import { AnimateIn, StaggerContainer, StaggerItem } from "@/components/ui/animate-in";
import { SECURITY_LAYERS, WAITLIST_URL } from "@/lib/constants";
import { navPageAlternates, OG_LOCALE_MAP, SITE_URL } from "@/lib/seo";
import { ogLocaleFor } from "@/lib/content-page-helpers";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("metadata");
  return {
    title: t("securityTitle"),
    description: t("securityDescription"),
    alternates: navPageAlternates(locale, "/security"),
    openGraph: {
      title: t("securityOgTitle"),
      description: t("securityOgDescription"),
      type: "website",
      siteName: "OpenLegion",
      url: `${SITE_URL}/${locale}/security`,
      locale: OG_LOCALE_MAP[locale] || "en_US",
      images: [{ url: `/og/${ogLocaleFor(locale)}/security.png`, width: 1200, height: 630, alt: t("securityOgTitle") }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@openlegion",
      images: [`/og/${ogLocaleFor(locale)}/security.png`],
      title: t("securityTwitterTitle"),
      description: t("securityTwitterDescription"),
    },
    robots: { index: true, follow: true },
  };
}

/** Split a translated string on `{email}` and interleave the mailto link. */
function withEmail(template: string, link: React.ReactNode): React.ReactNode {
  const parts = template.split("{email}");
  return parts.map((part, i) => (
    <Fragment key={i}>
      {part}
      {i < parts.length - 1 ? link : null}
    </Fragment>
  ));
}

/**
 * /security — the claims page.
 *
 * Every guarantee below is one of the eight sentences the 2026-09-17 principal
 * review verified against the code (`research/42` §2); the closing section is
 * the list of things we deliberately do not claim. Copy lives in the shared
 * `messages/*.json` tree, so the route exists in all 13 locales.
 */
export default async function SecurityPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("securityPage");
  const tLayers = await getTranslations("security");
  const tCommon = await getTranslations("contentPage");
  const email = t("email");

  const mailLink = (
    <a
      href={`mailto:${email}`}
      className="text-accent underline underline-offset-2 hover:text-accent/80"
    >
      {email}
    </a>
  );

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: tCommon("breadcrumbHome"), item: `${SITE_URL}/${locale}` },
      { "@type": "ListItem", position: 2, name: t("title"), item: `${SITE_URL}/${locale}/security` },
    ],
  };

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd]} />
      <main id="main" className="relative px-5 pt-10 pb-20 sm:px-6 md:px-8 md:pt-16 md:pb-28">
        <div className="mx-auto max-w-3xl">
          <AnimateIn>
            <p className="sr-only">{t("title")}</p>
            <h1 className="text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              {t("heading")}
              <span className="gradient-text">{t("headingHighlight")}</span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted">{t("lede")}</p>
            <p className="mt-3 text-[13px] text-muted/70">{t("updated")}</p>
          </AnimateIn>

          {/* The eight verified guarantees */}
          <section className="mt-12" aria-labelledby="security-guarantees">
            <AnimateIn>
              <h2
                id="security-guarantees"
                className="text-2xl font-bold tracking-tight text-foreground md:text-3xl"
              >
                {t("guaranteesHeading")}
              </h2>
            </AnimateIn>
            <StaggerContainer className="mt-6 space-y-3">
              {SECURITY_LAYERS.map((layer, i) => (
                <StaggerItem key={layer.number}>
                  <div className="card-hover gradient-border glass-shine group rounded-xl border border-border/50 glass-card p-5 md:p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent/20 to-accent/[0.06] ring-1 ring-accent/20">
                        <span className="font-mono text-xs font-bold text-accent-light">
                          {String(layer.number).padStart(2, "0")}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="mb-1 text-base font-semibold text-foreground">
                          {tLayers(`layers.${i}.title`)}
                        </h3>
                        <p className="text-sm leading-relaxed text-muted">
                          {tLayers(`layers.${i}.description`)}
                        </p>
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </section>

          {/* Where work stops */}
          <section className="mt-12 border-t border-border pt-10" aria-labelledby="security-approvals">
            <AnimateIn>
              <h2
                id="security-approvals"
                className="text-2xl font-bold tracking-tight text-foreground md:text-3xl"
              >
                {t("approvalsHeading")}
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-muted">{t("approvals")}</p>
            </AnimateIn>
          </section>

          {/* Your data */}
          <section className="mt-10 border-t border-border pt-10" aria-labelledby="security-data">
            <AnimateIn>
              <h2
                id="security-data"
                className="text-2xl font-bold tracking-tight text-foreground md:text-3xl"
              >
                {t("dataHeading")}
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-muted">{t("data")}</p>
            </AnimateIn>
          </section>

          {/* What we don't claim */}
          <section className="mt-10" aria-labelledby="security-not-claimed">
            <AnimateIn>
              <div className="rounded-2xl border border-border/50 glass-card p-6 md:p-8">
                <h2
                  id="security-not-claimed"
                  className="text-xl font-bold tracking-tight text-foreground md:text-2xl"
                >
                  {t("notClaimedHeading")}
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-muted">{t("notClaimed")}</p>
              </div>
            </AnimateIn>
          </section>

          {/* Reporting */}
          <section className="mt-10 border-t border-border pt-10" aria-labelledby="security-contact">
            <AnimateIn>
              <h2
                id="security-contact"
                className="text-2xl font-bold tracking-tight text-foreground md:text-3xl"
              >
                {t("contactHeading")}
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-muted">
                {withEmail(t("contact"), mailLink)}
              </p>
            </AnimateIn>
          </section>

          <AnimateIn delay={0.1}>
            <div className="mt-12 flex flex-col items-start gap-3 rounded-2xl border border-border/50 bg-card-hover p-6 sm:flex-row sm:items-center sm:justify-between md:p-8">
              <p className="text-[15px] text-muted">{t("ctaNote")}</p>
              <Link
                href={WAITLIST_URL}
                className="btn-gradient flex shrink-0 items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white"
              >
                {t("ctaLabel")}
              </Link>
            </div>
          </AnimateIn>
        </div>
      </main>
      <Footer />
    </>
  );
}
