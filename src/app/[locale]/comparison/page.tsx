import type { Metadata } from "next";
import {
  getContentEntry,
  getContentPage,
  getComparisonSubPageEntries,
} from "@/lib/markdown";
import { buildMetadata, withLocaleAlternates } from "@/lib/content-page-helpers";
import { ContentPage } from "@/components/content-page";
import { JsonLd, buildItemListSchema } from "@/components/json-ld";
import { Footer } from "@/components/footer";
import { setRequestLocale } from "next-intl/server";

const SLUG = "/comparison";
const BASE_URL = "https://www.openlegion.ai";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const entry = getContentEntry(SLUG);
  if (!entry) return {};
  const { frontmatter } = await getContentPage(SLUG, locale);
  return withLocaleAlternates(buildMetadata(frontmatter), entry, locale);
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const entry = getContentEntry(SLUG);
  const hubHasTranslation =
    locale === "en" || (entry?.availableLocales.includes(locale) ?? false);
  const hubLocale = hubHasTranslation ? locale : "en";
  const page = await getContentPage(SLUG, locale);

  // Derive ItemList from discovery map — auto-includes any new comparison pages.
  // Each item links to the current locale's variant when a translation exists;
  // otherwise it falls back to the English authority page.
  const items = getComparisonSubPageEntries().map((entry, i) => {
    const hasTranslation =
      locale === "en" || entry.availableLocales.includes(locale);
    const urlLocale = hasTranslation ? locale : "en";
    return {
      name: entry.frontmatter.title,
      url: `${BASE_URL}/${urlLocale}${entry.slug}`,
      position: i + 1,
    };
  });

  // ItemList carries the slug + effective locale so its @id matches
  // CollectionPage.mainEntity's reference inside ContentPage's graph — the
  // two scripts cross-resolve only when both use the same canonical URL.
  return (
    <>
      <JsonLd data={buildItemListSchema(items, SLUG, hubLocale)} />
      <main id="main">
        <ContentPage page={page} locale={locale} />
      </main>
      <Footer />
    </>
  );
}
