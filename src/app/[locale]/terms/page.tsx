import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Footer } from "@/components/footer";
import { Link } from "@/i18n/navigation";
import { navPageAlternates, OG_LOCALE_MAP, SITE_URL } from "@/lib/seo";
import { ogLocaleFor } from "@/lib/content-page-helpers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("metadata");
  return {
    title: t("termsTitle"),
    description: t("termsDescription"),
    alternates: navPageAlternates(locale, "/terms"),
    openGraph: {
      title: t("termsTitle"),
      description: t("termsDescription"),
      type: "website",
      siteName: "OpenLegion",
      url: `${SITE_URL}/${locale}/terms`,
      locale: OG_LOCALE_MAP[locale] || "en_US",
      images: [{ url: `/og/${ogLocaleFor(locale)}/terms.png`, width: 1200, height: 630, alt: t("termsTitle") }],
    },
    robots: { index: true, follow: true },
  };
}

const ACCEPTABLE_USE_ITEMS = ["0", "1", "2", "3", "4", "5", "6", "7"] as const;
const GENERAL_PROVISIONS_ITEMS = ["0", "1", "2", "3", "4", "5"] as const;

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("terms");

  return (
    <>
      <main id="main" className="mx-auto max-w-3xl px-6 pb-24 pt-8 md:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-muted">{t("effectiveDate")}</p>

        <div className="prose-legal mt-10 space-y-8 text-sm leading-relaxed text-muted">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">{t("section1.title")}</h2>
            <p>{t("section1.p1")}</p>
            <p className="mt-2">{t("section1.p2")}</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">{t("section2.title")}</h2>
            <p>{t("section2.text")}</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">{t("section3.title")}</h2>
            <p>{t("section3.text")}</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">{t("section4.title")}</h2>
            <p>{t("section4.text")}</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">{t("section5.title")}</h2>
            <p>{t("section5.intro")}</p>
            <ul className="ml-5 mt-2 list-disc space-y-1">
              {ACCEPTABLE_USE_ITEMS.map((idx) => (
                <li key={idx}>{t(`section5.items.${idx}`)}</li>
              ))}
            </ul>
            <p className="mt-2">{t("section5.enforcement")}</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">{t("section6.title")}</h2>
            <p>{t("section6.p1")}</p>
            <p className="mt-2">{t("section6.p2")}</p>
            <p className="mt-2">
              <Link href="/money-back-guarantee" className="underline">
                {t("section6.title")}
              </Link>
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">{t("section7.title")}</h2>
            <p>{t("section7.p1")}</p>
            <p className="mt-2">{t("section7.p2")}</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">{t("section8.title")}</h2>
            <p>{t("section8.text")}</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">{t("section9.title")}</h2>
            <p>{t("section9.text")}</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">{t("section10.title")}</h2>
            <p>{t("section10.p1")}</p>
            <p className="mt-2">{t("section10.p2")}</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">{t("section11.title")}</h2>
            <p>{t("section11.p1")}</p>
            <p className="mt-2">{t("section11.p2")}</p>
            <p className="mt-2">{t("section11.p3")}</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">{t("section12.title")}</h2>
            <p>{t("section12.text")}</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">{t("section13.title")}</h2>
            <p>{t("section13.text")}</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">{t("section14.title")}</h2>
            <p>{t("section14.p1")}</p>
            <p className="mt-2">{t("section14.p2")}</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">{t("section15.title")}</h2>
            <p>{t("section15.text")}</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">{t("section16.title")}</h2>
            <p>{t("section16.p1")}</p>
            <p className="mt-2">{t("section16.p2")}</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">{t("section17.title")}</h2>
            <ul className="ml-5 list-disc space-y-2">
              {GENERAL_PROVISIONS_ITEMS.map((idx) => (
                <li key={idx}>{t(`section17.items.${idx}`)}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">{t("section18.title")}</h2>
            <p>
              {t("section18.text")}{" "}
              <a
                href={`mailto:${t("section18.email")}`}
                className="text-accent underline underline-offset-2 hover:text-accent/80"
              >
                {t("section18.email")}
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
