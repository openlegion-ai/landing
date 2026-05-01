import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getContentEntry,
  getContentPage,
  getLearnEntries,
} from "@/lib/markdown";
import { buildMetadata, withLocaleAlternates } from "@/lib/content-page-helpers";
import { ContentPage } from "@/components/content-page";
import { Footer } from "@/components/footer";
import { SUPPORTED_LOCALES } from "@/lib/constants";

export const dynamicParams = false;

interface RouteParams {
  locale: string;
  slug: string;
}

export function generateStaticParams() {
  const learnSlugs = getLearnEntries().map((e) =>
    e.slug.replace(/^\/learn\//, "")
  );
  return SUPPORTED_LOCALES.flatMap((locale) =>
    learnSlugs.map((slug) => ({ locale, slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const fullSlug = `/learn/${slug}`;
  const entry = getContentEntry(fullSlug);
  if (!entry) return {};
  const { frontmatter } = await getContentPage(fullSlug, locale);
  return withLocaleAlternates(buildMetadata(frontmatter), entry, locale);
}

export default async function Page({ params }: { params: Promise<RouteParams> }) {
  const { locale, slug } = await params;
  const fullSlug = `/learn/${slug}`;
  if (!getContentEntry(fullSlug)) notFound();
  const page = await getContentPage(fullSlug, locale);
  return (
    <>
      <main id="main">
        <ContentPage page={page} />
      </main>
      <Footer />
    </>
  );
}
