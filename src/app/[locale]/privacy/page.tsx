import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
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
    title: t("privacyTitle"),
    description: t("privacyDescription"),
    alternates: navPageAlternates(locale, "/privacy"),
    openGraph: {
      title: t("privacyTitle"),
      description: t("privacyDescription"),
      type: "website",
      siteName: "OpenLegion",
      url: `${SITE_URL}/${locale}/privacy`,
      locale: OG_LOCALE_MAP[locale] || "en_US",
    },
    robots: { index: true, follow: true },
  };
}

// Item counts per section (must match en.json structure)
const COUNTS = {
  s2_1: 4, s2_2: 4, s3: 7, s4: 5, s5: 4, s6: 3, s9: 6,
} as const;

const range = (n: number) => Array.from({ length: n }, (_, i) => String(i));

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("privacy");

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
            <h3 className="mt-4 mb-2 text-base font-semibold text-foreground/90">
              {t("section2.1.title")}
            </h3>
            <ul className="ml-5 mt-2 list-disc space-y-1">
              {range(COUNTS.s2_1).map((idx) => (
                <li key={idx}>{t(`section2.1.items.${idx}`)}</li>
              ))}
            </ul>
            <h3 className="mt-4 mb-2 text-base font-semibold text-foreground/90">
              {t("section2.2.title")}
            </h3>
            <ul className="ml-5 mt-2 list-disc space-y-1">
              {range(COUNTS.s2_2).map((idx) => (
                <li key={idx}>{t(`section2.2.items.${idx}`)}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">{t("section3.title")}</h2>
            <p>{t("section3.intro")}</p>
            <ul className="ml-5 mt-2 list-disc space-y-1">
              {range(COUNTS.s3).map((idx) => (
                <li key={idx}>{t(`section3.items.${idx}`)}</li>
              ))}
            </ul>
            <p className="mt-2">{t("section3.noSell")}</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">{t("section4.title")}</h2>
            <p>{t("section4.intro")}</p>
            <ul className="ml-5 mt-2 list-disc space-y-1">
              {range(COUNTS.s4).map((idx) => (
                <li key={idx}>{t(`section4.items.${idx}`)}</li>
              ))}
            </ul>
            <p className="mt-2">{t("section4.review")}</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">{t("section5.title")}</h2>
            <p>{t("section5.intro")}</p>
            <ul className="ml-5 mt-2 list-disc space-y-1">
              {range(COUNTS.s5).map((idx) => (
                <li key={idx}>{t(`section5.items.${idx}`)}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">{t("section6.title")}</h2>
            <p>{t("section6.intro")}</p>
            <ul className="ml-5 mt-2 list-disc space-y-1">
              {range(COUNTS.s6).map((idx) => (
                <li key={idx}>{t(`section6.items.${idx}`)}</li>
              ))}
            </ul>
            <p className="mt-2">{t("section6.control")}</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">{t("section7.title")}</h2>
            <p>{t("section7.text")}</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">{t("section8.title")}</h2>
            <p>{t("section8.text")}</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">{t("section9.title")}</h2>
            <p>{t("section9.intro")}</p>
            <ul className="ml-5 mt-2 list-disc space-y-1">
              {range(COUNTS.s9).map((idx) => (
                <li key={idx}>{t(`section9.items.${idx}`)}</li>
              ))}
            </ul>
            <p className="mt-2">{t("section9.contact")}</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">{t("section10.title")}</h2>
            <p>{t("section10.text")}</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">{t("section11.title")}</h2>
            <p>{t("section11.p1")}</p>
            <p className="mt-2">{t("section11.p2")}</p>
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
            <p>{t("section14.text")}</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">{t("section15.title")}</h2>
            <p>
              {t("section15.text")}{" "}
              <a
                href={`mailto:${t("section15.email")}`}
                className="text-accent underline underline-offset-2 hover:text-accent/80"
              >
                {t("section15.email")}
              </a>
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
