import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Footer } from "@/components/footer";
import { navPageAlternates, OG_LOCALE_MAP, SITE_URL } from "@/lib/seo";

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
    },
    robots: { index: true, follow: true },
  };
}

const COVERED_KEYS = ["0", "1"] as const;
const NOT_COVERED_KEYS = ["0", "1", "2"] as const;
const AFTER_REFUND_KEYS = ["0", "1", "2"] as const;

export default async function MoneyBackGuaranteePage() {
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
            <p>{t.rich("intro", { email: () => mailLink })}</p>
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
            <p>{t.rich("howTo.body", { email: () => mailLink })}</p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
