import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Hero } from "@/components/hero";
import { AudienceSelector } from "@/components/audience-selector";
import { UseCases } from "@/components/use-cases";
import { PromptToTeam } from "@/components/prompt-to-team";
import { ProductionReady } from "@/components/production-ready";
import { ReadyMadeTeams } from "@/components/ready-made-teams";
import { SocialProof } from "@/components/social-proof";
import { Testimonials } from "@/components/testimonials";
import { Features } from "@/components/features";
import { DashboardPreview } from "@/components/dashboard-preview";
import { Quickstart } from "@/components/quickstart";
import { Security } from "@/components/security";
import { Architecture } from "@/components/architecture";
import { Enterprise } from "@/components/enterprise";
import { Comparison } from "@/components/comparison";
import { FAQ } from "@/components/faq";
import { CTA } from "@/components/cta";
import { CapabilityBand } from "@/components/capability-band";
import { TechnicalDefinition } from "@/components/technical-definition";
import { Footer } from "@/components/footer";
import { ALL_FAQ_ITEMS, PRICING_URL } from "@/lib/constants";
import { getAllContentEntries } from "@/lib/markdown";
import { normalizeDate, ogLocaleFor } from "@/lib/content-page-helpers";

// Homepage inherits title + description from root layout metadata.
// Page-level JSON-LD schemas are defined inline below — they reference the
// site-wide Organization / WebSite / SoftwareApplication entities (declared
// in `[locale]/layout.tsx`) by stable @id rather than re-declaring them.
const ORG_ID = "https://www.openlegion.ai/#organization";
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

async function getGitHubStars(): Promise<string | null> {
  try {
    const res = await fetch(
      "https://api.github.com/repos/openlegion-ai/openlegion",
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const count = data.stargazers_count;
    if (typeof count !== "number") return null;
    return count >= 1000 ? (count / 1000).toFixed(1) + "k" : String(count);
  } catch {
    return null;
  }
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const stars = await getGitHubStars();
  const t = await getTranslations("common");
  const tFaq = await getTranslations("faq");
  const tMeta = await getTranslations("metadata");
  const tSchema = await getTranslations("schema");

  // Locale-aware FAQ items for the FAQPage JSON-LD payload below. The
  // canonical 14-item ordering comes from ALL_FAQ_ITEMS; each locale's
  // messages/<loc>.json supplies translated text at faq.items.<idx>.*.
  const localizedFaqItems = ALL_FAQ_ITEMS.map((_, idx) => ({
    question: tFaq(`items.${idx}.question`),
    answer: tFaq(`items.${idx}.answer`),
  }));

  const canonicalUrl = `https://www.openlegion.ai/${locale}`;
  const WEBPAGE_ID = `${canonicalUrl}#webpage`;
  const FAQ_ID = `${canonicalUrl}#faq`;
  const VIDEO_ID = `${canonicalUrl}#demo-video`;
  const dateModified = homepageDateModified();

  // Single @graph payload — page-level WebPage / FAQPage / VideoObject
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
        // Every sameAs has been verified to resolve to the correct entity.
        // See PAGE_MENTIONS doc for the validation policy.
        mentions: [
          { "@type": "SoftwareApplication", name: "Docker",    sameAs: "https://www.wikidata.org/wiki/Q15206305" },
          { "@type": "ProgrammingLanguage", name: "Python",    sameAs: "https://www.wikidata.org/wiki/Q28865" },
          { "@type": "SoftwareApplication", name: "LangGraph", sameAs: "https://github.com/langchain-ai/langgraph" },
          { "@type": "SoftwareApplication", name: "CrewAI",    sameAs: "https://github.com/crewAIInc/crewAI" },
          { "@type": "SoftwareApplication", name: "AutoGen",   sameAs: "https://github.com/microsoft/autogen" },
        ],
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
      {
        "@type": "VideoObject",
        "@id": VIDEO_ID,
        name: tSchema("videoName"),
        description: tSchema("videoDescription"),
        thumbnailUrl: "https://www.openlegion.ai/demo-poster.jpg",
        uploadDate: "2026-02-18",
        duration: "PT2M",
        contentUrl: "https://www.openlegion.ai/demo.mp4",
        // embedUrl is the page that *embeds* the video — not the .mp4 itself.
        embedUrl: `${canonicalUrl}#hero`,
        isPartOf: { "@id": WEBPAGE_ID },
        publisher: { "@id": ORG_ID },
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
        {/* Buyer path — outcome-first sections for entrepreneurs and
            operators. Developer / technical-evaluation sections are grouped
            below the FAQ so they stay on-page (SEO + nav anchors intact)
            without interrupting the conversion path. */}
        <Hero />
        <CapabilityBand />
        <AudienceSelector />
        <ReadyMadeTeams />
        <PromptToTeam />
        <UseCases />
        <SocialProof stars={stars} />
        <Testimonials />
        <ProductionReady />
        <Features />
        <DashboardPreview />
        <div className="px-5 py-10 text-center sm:px-6 md:px-8 md:py-14">
          <div className="mx-auto mb-6 h-px w-1/4 bg-gradient-to-r from-transparent via-accent/20 to-transparent sm:w-1/3" aria-hidden="true" />
          <p className="mb-3 text-sm text-muted">{t("readyToStart")}</p>
          <Link href={PRICING_URL} className="inline-flex items-center gap-2 rounded-lg border border-accent/25 bg-accent/[0.06] px-5 py-2.5 text-sm font-medium text-accent-light transition-all hover:border-accent/40 hover:bg-accent/10">
            {t("getStartedInline")}
          </Link>
          <div className="mx-auto mt-6 h-px w-1/4 bg-gradient-to-r from-transparent via-accent/20 to-transparent sm:w-1/3" aria-hidden="true" />
        </div>
        <Security />
        <Enterprise />
        <FAQ />
        <div className="px-5 pt-16 text-center sm:px-6 md:px-8 md:pt-20" aria-hidden="false">
          <div className="mx-auto mb-4 h-px w-1/4 bg-gradient-to-r from-transparent via-accent/20 to-transparent sm:w-1/3" aria-hidden="true" />
          <p className="text-sm font-semibold uppercase tracking-widest text-muted">{t("developersHeading")}</p>
        </div>
        <Quickstart />
        <Architecture />
        <Comparison />
        <TechnicalDefinition />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
