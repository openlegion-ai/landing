import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getLearnEntries } from "@/lib/markdown";
import {
  JsonLd,
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  buildItemListSchema,
} from "@/components/json-ld";
import { Footer } from "@/components/footer";
import { SUPPORTED_LOCALES } from "@/lib/constants";
import { navPageAlternates, OG_LOCALE_MAP, SITE_URL } from "@/lib/seo";
import { normalizeDate } from "@/lib/content-page-helpers";

const SLUG = "/learn";
const BASE_URL = SITE_URL;

// Use the newest learn entry's last_updated as the hub's dateModified — a
// hub's freshness is bounded by its newest member. Normalized to YYYY-MM-DD
// (Google's structured-data tools prefer the full form over YYYY-MM).
function hubLastModified(): string {
  const entries = getLearnEntries();
  let newest = "";
  for (const e of entries) {
    const d = normalizeDate(e.frontmatter.last_updated);
    if (d > newest) newest = d;
  }
  return newest || new Date().toISOString().slice(0, 10);
}

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("metadata");
  const title = t("learnTitle");
  const description = t("learnDescription");
  return {
    title,
    description,
    alternates: navPageAlternates(locale, SLUG),
    openGraph: {
      title: t("learnOgTitle"),
      description: t("learnOgDescription"),
      type: "website",
      siteName: "OpenLegion",
      url: `${BASE_URL}/${locale}${SLUG}`,
      locale: OG_LOCALE_MAP[locale] || "en_US",
      images: [
        {
          url: "/og/learn.png",
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@openlegion",
      title: t("learnTwitterTitle"),
      description: t("learnTwitterDescription"),
      images: ["/og/learn.png"],
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

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tCommon = await getTranslations("contentPage");
  const tMeta = await getTranslations("metadata");
  const entries = getLearnEntries();

  const title = tMeta("learnTitle");
  const description = tMeta("learnDescription");

  const itemListItems = entries.map((entry, i) => {
    const hasTranslation =
      locale === "en" || entry.availableLocales.includes(locale);
    const urlLocale = hasTranslation ? locale : "en";
    return {
      name: entry.frontmatter.title,
      url: `${BASE_URL}/${urlLocale}${entry.slug}`,
      position: i + 1,
    };
  });

  // /learn is a Next.js page driven by next-intl messages — translated for
  // every supported locale via `navPageAlternates`. The effective locale is
  // therefore always the current locale (no English fallback case).
  const lastUpdated = hubLastModified();
  const breadcrumbLabels = {
    home: tCommon("breadcrumbHome"),
    learn: tCommon("breadcrumbLearn"),
  };

  return (
    <>
      <JsonLd
        data={[
          buildBreadcrumbSchema(title, SLUG, locale, breadcrumbLabels),
          buildCollectionPageSchema(title, description, lastUpdated, SLUG, undefined, locale),
          buildItemListSchema(itemListItems, SLUG, locale),
        ]}
      />
      <main id="main" className="mx-auto max-w-4xl px-6 pb-24 pt-12 md:px-8">
        <nav aria-label={tCommon("breadcrumbAriaLabel")} className="breadcrumb">
          <Link href="/">{tCommon("breadcrumbHome")}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{tCommon("breadcrumbLearn")}</span>
        </nav>

        <header className="mt-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {tCommon("breadcrumbLearn")}
          </h1>
          <p className="mt-3 max-w-2xl text-muted">{description}</p>
        </header>

        <ul className="mt-10 grid gap-4 md:grid-cols-2">
          {entries.map((entry) => (
            <li key={entry.slug}>
              <Link
                href={entry.slug}
                className="block rounded-lg border border-border/60 bg-card/50 p-5 transition-colors hover:border-accent/60 hover:bg-card"
              >
                <h2 className="text-lg font-semibold text-foreground">
                  {entry.frontmatter.title}
                </h2>
                <p className="mt-2 text-sm text-muted">
                  {entry.frontmatter.description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </>
  );
}
