import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  Hero,
  Statement,
  Plug,
  Walls,
  Board,
  Money,
  Build,
  Verticals,
  HomeFaq,
  Definition,
  Close,
  HOME_FAQ_KEYS,
} from "@/components/home/sections";
import { Footer } from "@/components/footer";
import { getAllContentEntries } from "@/lib/markdown";
import { normalizeDate, ogLocaleFor } from "@/lib/content-page-helpers";

// Homepage inherits title + description from root layout metadata.
// Page-level JSON-LD schemas are defined inline below — they reference the
// site-wide Organization / WebSite / SoftwareApplication entities (declared
// in `[locale]/layout.tsx`) by stable @id rather than re-declaring them.
const WEBSITE_ID = "https://www.openlegion.ai/#website";
const SOFTWARE_ID = "https://www.openlegion.ai/#software";

/**
 * Newest `last_updated` across the content corpus, formatted as YYYY-MM-DD.
 * The homepage aggregates content, so its freshness is bounded by its
 * freshest member — and unlike `new Date()`, this doesn't bounce per build
 * (which would train crawlers to ignore the lastmod signal).
 */
function homepageDateModified(): string {
  const entries = getAllContentEntries();
  let newest = "";
  for (const e of entries) {
    const d = normalizeDate(e.frontmatter.last_updated);
    if (d > newest) newest = d;
  }
  return newest || new Date().toISOString().slice(0, 10);
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "platformMeta" });
  return {
    title: { absolute: t("homeTitle") },
    description: t("homeDescription"),
    openGraph: {
      title: t("homeOgTitle"),
      description: t("homeOgDescription"),
      type: "website",
      siteName: "OpenLegion",
      url: `https://www.openlegion.ai/${locale}`,
      images: [{ url: `/og/${ogLocaleFor(locale)}/home.png`, width: 1200, height: 630, alt: t("homeOgTitle") }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@openlegion",
      title: t("homeOgTitle"),
      description: t("homeOgDescription"),
      images: [`/og/${ogLocaleFor(locale)}/home.png`],
    },
  };
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tFaq = await getTranslations("homeFaq");
  const tMeta = await getTranslations("platformMeta");

  // Locale-aware FAQ items for the FAQPage JSON-LD payload below: the same
  // builder questions the visible FAQ renders, in HOME_FAQ_KEYS order.
  const localizedFaqItems = HOME_FAQ_KEYS.map((key) => ({
    question: tFaq(`${key}.q`),
    answer: tFaq(`${key}.a`),
  }));

  const canonicalUrl = `https://www.openlegion.ai/${locale}`;
  const WEBPAGE_ID = `${canonicalUrl}#webpage`;
  const FAQ_ID = `${canonicalUrl}#faq`;
  const dateModified = homepageDateModified();

  // Single @graph payload — page-level WebPage / FAQPage
  // entities cross-link to the site-wide @id refs declared in
  // `[locale]/layout.tsx`. Note: HowTo schema was removed — Google
  // deprecated HowTo rich results for non-recipe content in late 2023, so
  // the visible quickstart block carries the signal more cleanly.
  const pageGraphJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": WEBPAGE_ID,
        url: canonicalUrl,
        name: tMeta("homeTitle"),
        description: tMeta("homeDescription"),
        datePublished: "2026-02-18",
        dateModified,
        inLanguage: locale,
        isPartOf: { "@id": WEBSITE_ID },
        about: { "@id": SOFTWARE_ID },
        mainEntity: { "@id": SOFTWARE_ID },
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: `https://www.openlegion.ai/og/${ogLocaleFor(locale)}/home.png`,
          width: 1200,
          height: 630,
        },
        speakable: {
          "@type": "SpeakableSpecification",
          cssSelector: ["#hero", "#faq", ".definition-block"],
        },
      },
      {
        "@type": "FAQPage",
        "@id": FAQ_ID,
        isPartOf: { "@id": WEBPAGE_ID },
        mainEntity: localizedFaqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageGraphJsonLd).replace(/</g, "\\u003c") }}
      />
      <main id="main">
        <Hero />
        <Statement />
        <Plug />
        <Walls />
        <Board />
        <Money />
        <Build />
        <Verticals />
        <HomeFaq />
        <Definition />
        <Close />
      </main>
      <Footer />
    </>
  );
}
