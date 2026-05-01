import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getContentEntry,
  getContentPage,
  getRootContentEntries,
} from "@/lib/markdown";
import { buildMetadata, withLocaleAlternates } from "@/lib/content-page-helpers";
import { ContentPage } from "@/components/content-page";
import { Footer } from "@/components/footer";
import { SUPPORTED_LOCALES } from "@/lib/constants";

export const dynamicParams = false;

interface RouteParams {
  locale: string;
  contentSlug: string;
}

export function generateStaticParams() {
  const rootSlugs = getRootContentEntries().map((e) => e.slug.replace(/^\//, ""));
  return SUPPORTED_LOCALES.flatMap((locale) =>
    rootSlugs.map((contentSlug) => ({ locale, contentSlug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { locale, contentSlug } = await params;
  const fullSlug = `/${contentSlug}`;
  const entry = getContentEntry(fullSlug);
  if (!entry) return {};
  const { frontmatter } = await getContentPage(fullSlug, locale);
  return withLocaleAlternates(buildMetadata(frontmatter), entry, locale);
}

export default async function Page({ params }: { params: Promise<RouteParams> }) {
  const { locale, contentSlug } = await params;
  const fullSlug = `/${contentSlug}`;
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
