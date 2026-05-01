export interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[];
}

export function JsonLd({ data }: JsonLdProps) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}

// ── Schema builders ─────────────────────────────────────────────────────────

// All breadcrumb item URLs are /en-prefixed to match the live canonical
// (set by withLocaleAlternates) — Google extracts this for SERP display
// against the canonical, so the URLs must match.
const BREADCRUMB_BASE = "https://www.openlegion.ai/en";

export function buildBreadcrumbSchema(title: string, slug: string) {
  const items: { "@type": string; position: number; name: string; item: string }[] = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://www.openlegion.ai/en",
    },
  ];

  // 3-level breadcrumb for sectioned sub-pages: /comparison/<x>, /learn/<x>.
  // Without the parent step, the breadcrumb collapses to Home → Title and
  // the section hub disappears from SERP markup.
  const sections: Array<{ prefix: string; name: string; hub: string }> = [
    { prefix: "/comparison/", name: "Comparisons", hub: "/comparison" },
    { prefix: "/learn/", name: "Learn", hub: "/learn" },
  ];
  const section = sections.find((s) => slug.startsWith(s.prefix));

  if (section) {
    items.push({
      "@type": "ListItem",
      position: 2,
      name: section.name,
      item: `${BREADCRUMB_BASE}${section.hub}`,
    });
    items.push({
      "@type": "ListItem",
      position: 3,
      name: title,
      item: `${BREADCRUMB_BASE}${slug}`,
    });
  } else {
    items.push({
      "@type": "ListItem",
      position: 2,
      name: title,
      item: `${BREADCRUMB_BASE}${slug}`,
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };
}

export function buildFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function buildItemListSchema(
  items: { name: string; url: string; position: number }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item) => ({
      "@type": "ListItem",
      position: item.position,
      name: item.name,
      url: item.url,
    })),
  };
}

export function buildHowToSchema(
  name: string,
  description: string,
  steps: { name: string; text: string }[],
  options?: { totalTime?: string; tools?: string[] }
) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    step: steps.map((step, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: step.name,
      text: step.text,
    })),
  };

  if (options?.totalTime) {
    schema.totalTime = options.totalTime;
  }
  if (options?.tools?.length) {
    schema.tool = options.tools.map((t) => ({ "@type": "HowToTool", name: t }));
  }

  return schema;
}

// ── Shared entity mentions for topical authority ────────────────────────────

const ENTITY_MENTIONS = [
  { "@type": "SoftwareApplication", name: "Docker", sameAs: "https://www.wikidata.org/wiki/Q15206305" },
  { "@type": "ProgrammingLanguage", name: "Python", sameAs: "https://www.wikidata.org/wiki/Q28865" },
  { "@type": "Thing", name: "Large language model", sameAs: "https://www.wikidata.org/wiki/Q115215024" },
  { "@type": "SoftwareApplication", name: "SQLite", sameAs: "https://www.wikidata.org/wiki/Q319417" },
  { "@type": "Organization", name: "DeepSeek", sameAs: "https://www.wikidata.org/wiki/Q130211498" },
  { "@type": "Thing", name: "Mixture of experts", sameAs: "https://www.wikidata.org/wiki/Q4411516" },
];

export function buildArticleSchema(
  title: string,
  description: string,
  lastUpdated: string,
  slug: string,
  datePublished?: string
) {
  // mainEntityOfPage @id must equal the live canonical URL
  // (`/en/<slug>` per `withLocaleAlternates`) — otherwise Google can't
  // associate the structured data with the canonical it indexed.
  const canonicalUrl = `https://www.openlegion.ai/en${slug}`;
  const slugForOg = slug.replace(/^\//, "").replace(/\//g, "-");

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    datePublished: datePublished ?? lastUpdated,
    dateModified: lastUpdated,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    image: {
      "@type": "ImageObject",
      url: `https://www.openlegion.ai/og/${slugForOg}.png`,
      width: 1200,
      height: 630,
    },
    author: {
      "@type": "Organization",
      name: "OpenLegion",
      url: "https://www.openlegion.ai",
    },
    publisher: {
      "@type": "Organization",
      name: "OpenLegion",
      url: "https://www.openlegion.ai",
      logo: {
        "@type": "ImageObject",
        url: "https://www.openlegion.ai/logo.png",
      },
    },
    inLanguage: "en",
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [".definition-block", ".faq-section"],
    },
    mentions: ENTITY_MENTIONS,
  };
}

