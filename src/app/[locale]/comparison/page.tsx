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
  const page = await getContentPage(SLUG, locale);

  // Derive ItemList from discovery map — auto-includes any new comparison pages.
  // Use /en-prefixed URLs to match the canonical (set by withLocaleAlternates).
  const items = getComparisonSubPageEntries().map((entry, i) => ({
    name: entry.frontmatter.title,
    url: `${BASE_URL}/en${entry.slug}`,
    position: i + 1,
  }));

  return (
    <>
      <JsonLd data={buildItemListSchema(items)} />
      <main id="main">
        <ContentPage page={page} />
      </main>
      <Footer />
    </>
  );
}
