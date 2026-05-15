import type { Metadata } from "next";
import { Fragment } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Footer } from "@/components/footer";
import { navPageAlternates, OG_LOCALE_MAP, SITE_URL } from "@/lib/seo";
import { ogLocaleFor } from "@/lib/content-page-helpers";

/**
 * Split a translated string on the `{email}` placeholder and interleave the
 * provided JSX link. Avoids `t.rich({ email: () => link })` whose function
 * argument can't be serialized by the static-rendering React Flight pipeline
 * (it surfaces as the "Functions cannot be passed directly to Client
 * Components" error).
 */
function withEmail(template: string, link: React.ReactNode): React.ReactNode {
  const parts = template.split("{email}");
  return parts.map((part, i) => (
    <Fragment key={i}>
      {part}
      {i < parts.length - 1 ? link : null}
    </Fragment>
  ));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("metadata");
  return {
    title: t("moneyBackTitle"),
    description: t("moneyBackDescription"),
    alternates: navPageAlternates(locale, "/money-back-guarantee"),
    openGraph: {
      title: t("moneyBackTitle"),
      description: t("moneyBackDescription"),
      type: "website",
      siteName: "OpenLegion",
      url: `${SITE_URL}/${locale}/money-back-guarantee`,
      locale: OG_LOCALE_MAP[locale] || "en_US",
      images: [{ url: `/og/${ogLocaleFor(locale)}/money-back-guarantee.png`, width: 1200, height: 630, alt: t("moneyBackTitle") }],
    },
    robots: { index: true, follow: true },
  };
}

const COVERED_KEYS = ["0", "1"] as const;
const NOT_COVERED_KEYS = ["0", "1", "2"] as const;
const AFTER_REFUND_KEYS = ["0", "1", "2"] as const;

export default async function MoneyBackGuaranteePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("moneyBackPage");
  const email = t("email");
  const mailLink = (
    <a
      href={`mailto:${email}`}
      className="text-accent underline underline-offset-2 hover:text-accent/80"
    >
      {email}
    </a>
  );

  return (
    <>
      <main id="main" className="mx-auto max-w-3xl px-6 pb-24 pt-8 md:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-muted">{t("tagline")}</p>

        <div className="prose-legal mt-10 space-y-8 text-sm leading-relaxed text-muted">
          <section>
            <p>{withEmail(t("intro"), mailLink)}</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              {t("covered.heading")}
            </h2>
            <ul className="ml-5 mt-2 list-disc space-y-1">
              {COVERED_KEYS.map((idx) => (
                <li key={idx}>{t(`covered.items.${idx}`)}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              {t("notCovered.heading")}
            </h2>
            <ul className="ml-5 mt-2 list-disc space-y-1">
              {NOT_COVERED_KEYS.map((idx) => (
                <li key={idx}>{t(`notCovered.items.${idx}`)}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              {t("afterRefund.heading")}
            </h2>
            <ul className="ml-5 mt-2 list-disc space-y-1">
              {AFTER_REFUND_KEYS.map((idx) => (
                <li key={idx}>{t(`afterRefund.items.${idx}`)}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              {t("howTo.heading")}
            </h2>
            <p>{withEmail(t("howTo.body"), mailLink)}</p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
