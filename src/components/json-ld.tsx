export interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[];
  /**
   * When `data` is an array, by default we consolidate the entries into a
   * single `@graph` payload — that's the schema.org canonical pattern for
   * grouping related entities and the form AI engines prefer for entity
   * resolution. Pass `consolidate={false}` to emit one `<script>` per entry
   * instead (rarely needed; useful only when entries genuinely have
   * different `@context` values).
   */
  consolidate?: boolean;
}

/**
 * Strip `@context` from a graph member — the parent `@graph` provides it.
 * Mutates a shallow copy, not the original.
 */
function stripContext(item: Record<string, unknown>): Record<string, unknown> {
  if (!("@context" in item)) return item;
  const out = { ...item };
  delete out["@context"];
  return out;
}

export function JsonLd({ data, consolidate = true }: JsonLdProps) {
  const items = Array.isArray(data) ? data : [data];
  if (items.length === 0) return null;

  if (consolidate && items.length > 1) {
    const payload = {
      "@context": "https://schema.org",
      "@graph": items.map(stripContext),
    };
    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(payload).replace(/</g, "\\u003c"),
        }}
      />
    );
  }

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

const SITE_BASE = "https://www.openlegion.ai";

// Stable @id refs to the site-wide entities declared once in
// `app/[locale]/layout.tsx`. Page-level schemas reference these by @id
// instead of re-declaring full Organization/WebSite blocks every page —
// that's the canonical schema.org pattern and the form AI engines use for
// entity resolution.
const ORG_ID      = `${SITE_BASE}/#organization`;
const WEBSITE_ID  = `${SITE_BASE}/#website`;
const SOFTWARE_ID = `${SITE_BASE}/#software`;

/**
 * Per-page anchor IDs derived from the live canonical URL.
 *
 * `locale` should be the *effective* locale — the one where the page is
 * actually served as the canonical (i.e. matches the `link rel="canonical"`
 * emitted by `withLocaleAlternates`). When a translation exists at the
 * requested locale, that's the locale-prefixed URL; when no translation
 * exists, the page falls back to English at /en/<slug> with `noindex`.
 *
 * Keeping schema URLs aligned with the metadata canonical is what lets
 * Google's structured-data tester associate the JSON-LD with the indexed page.
 */
function pageIds(slug: string, locale: string = "en") {
  const canonical = `${SITE_BASE}/${locale}${slug}`;
  return {
    canonical,
    webPage: `${canonical}#webpage`,
    article: `${canonical}#article`,
    faq: `${canonical}#faq`,
    howTo: `${canonical}#howto`,
    itemList: `${canonical}#itemlist`,
  };
}

/**
 * Optional translated breadcrumb labels. When omitted, the schema falls back
 * to English. Callers in locale-aware contexts should pass translations from
 * `useTranslations("contentPage")` for `breadcrumbHome` / `breadcrumbComparisons`
 * / `breadcrumbLearn` so the SERP breadcrumb renders in the user's language.
 */
export interface BreadcrumbLabels {
  home?: string;
  comparisons?: string;
  learn?: string;
}

export function buildBreadcrumbSchema(
  title: string,
  slug: string,
  locale: string = "en",
  labels: BreadcrumbLabels = {},
) {
  const base = `${SITE_BASE}/${locale}`;
  const items: { "@type": string; position: number; name: string; item: string }[] = [
    {
      "@type": "ListItem",
      position: 1,
      name: labels.home ?? "Home",
      item: base,
    },
  ];

  // 3-level breadcrumb for sectioned sub-pages: /comparison/<x>, /learn/<x>.
  // Without the parent step, the breadcrumb collapses to Home → Title and
  // the section hub disappears from SERP markup.
  const sections: Array<{ prefix: string; name: string; hub: string }> = [
    { prefix: "/comparison/", name: labels.comparisons ?? "Comparisons", hub: "/comparison" },
    { prefix: "/learn/", name: labels.learn ?? "Learn", hub: "/learn" },
  ];
  const section = sections.find((s) => slug.startsWith(s.prefix));

  if (section) {
    items.push({
      "@type": "ListItem",
      position: 2,
      name: section.name,
      item: `${base}${section.hub}`,
    });
    items.push({
      "@type": "ListItem",
      position: 3,
      name: title,
      item: `${base}${slug}`,
    });
  } else {
    items.push({
      "@type": "ListItem",
      position: 2,
      name: title,
      item: `${base}${slug}`,
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };
}

export function buildFAQSchema(
  faqs: { question: string; answer: string }[],
  slug?: string,
  locale: string = "en",
) {
  const schema: Record<string, unknown> = {
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
  if (slug) {
    const ids = pageIds(slug, locale);
    schema["@id"] = ids.faq;
    schema.isPartOf = { "@id": ids.webPage };
  }
  return schema;
}

export function buildItemListSchema(
  items: { name: string; url: string; position: number }[],
  slug?: string,
  locale: string = "en",
) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item) => ({
      "@type": "ListItem",
      position: item.position,
      name: item.name,
      url: item.url,
    })),
  };
  if (slug) {
    const ids = pageIds(slug, locale);
    schema["@id"] = ids.itemList;
    schema.isPartOf = { "@id": ids.webPage };
  }
  return schema;
}

export function buildHowToSchema(
  name: string,
  description: string,
  steps: { name: string; text: string }[],
  options?: { totalTime?: string; tools?: string[]; slug?: string; locale?: string },
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
  if (options?.slug) {
    const ids = pageIds(options.slug, options.locale ?? "en");
    schema["@id"] = ids.howTo;
    schema.isPartOf = { "@id": ids.webPage };
  }

  return schema;
}

// ── Shared entity mentions for topical authority ────────────────────────────
//
// Every `sameAs` URL has been verified to point at the correct entity. Sending
// AI engines to a wrong Wikidata Q-ID is worse than no sameAs at all — the
// audit that produced this list caught three pre-existing mismatches (LLM,
// DeepSeek, Mixture of Experts) that were resolving to unrelated entities.
// Prefer Wikipedia URLs for concepts (more reliable than guessing Q-IDs) and
// Wikidata for the canonical entities Q-IDs I can verify.

const ENTITY_MENTIONS = [
  { "@type": "SoftwareApplication", name: "Docker",                sameAs: "https://www.wikidata.org/wiki/Q15206305" },
  { "@type": "ProgrammingLanguage", name: "Python",                sameAs: "https://www.wikidata.org/wiki/Q28865" },
  { "@type": "Thing",               name: "Large language model",  sameAs: "https://en.wikipedia.org/wiki/Large_language_model" },
  { "@type": "SoftwareApplication", name: "SQLite",                sameAs: "https://www.wikidata.org/wiki/Q319417" },
];

export interface EntityMention {
  "@type": string;
  name: string;
  sameAs?: string;
}

/**
 * Image URL for an Article / WebPage / CollectionPage. OG images are
 * generated per canonical slug, not per locale (a single image serves every
 * locale variant of the same page) — so the path is locale-independent.
 */
function ogImageUrl(slug: string) {
  const slugForOg = slug.replace(/^\//, "").replace(/\//g, "-");
  return `${SITE_BASE}/og/${slugForOg}.png`;
}

/**
 * The page's own WebPage node — every content page emits one, and Article /
 * CollectionPage / FAQPage / HowTo / ItemList cross-link to it by @id. This
 * is the canonical schema.org pattern; AI engines and Google use it for
 * entity resolution.
 */
export function buildWebPageSchema(
  title: string,
  description: string,
  lastUpdated: string,
  slug: string,
  datePublished?: string,
  locale: string = "en",
) {
  const ids = pageIds(slug, locale);
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": ids.webPage,
    url: ids.canonical,
    name: title,
    description,
    datePublished: datePublished ?? lastUpdated,
    dateModified: lastUpdated,
    inLanguage: locale,
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": SOFTWARE_ID },
    mainEntity: { "@id": ids.article },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: ogImageUrl(slug),
      width: 1200,
      height: 630,
    },
    publisher: { "@id": ORG_ID },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [".definition-block", ".faq-section"],
    },
  };
}

export function buildArticleSchema(
  title: string,
  description: string,
  lastUpdated: string,
  slug: string,
  datePublished?: string,
  extraMentions: EntityMention[] = [],
  locale: string = "en",
) {
  const ids = pageIds(slug, locale);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": ids.article,
    headline: title,
    description,
    datePublished: datePublished ?? lastUpdated,
    dateModified: lastUpdated,
    // mainEntityOfPage links to the sibling WebPage node — keeping Article
    // and WebPage cross-linked is the form Google's structured-data tester
    // expects, and lets AI engines resolve "the page" vs "the article".
    mainEntityOfPage: { "@id": ids.webPage },
    image: {
      "@type": "ImageObject",
      url: ogImageUrl(slug),
      width: 1200,
      height: 630,
    },
    // Author + publisher resolve to the site-wide Organization @id declared
    // in `app/[locale]/layout.tsx` — no need to re-declare org details here.
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    inLanguage: locale,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [".definition-block", ".faq-section"],
    },
    // Shared canonical entity mentions plus page-specific topical mentions
    // — comparison/<x> pages should mention the competitor, learn/<x> pages
    // should mention the technologies they describe, etc.
    mentions: [...ENTITY_MENTIONS, ...extraMentions],
  };
}

/**
 * Hub pages (`/comparison`, `/learn`) describe a curated list of other pages.
 * CollectionPage + ItemList is the canonical schema for that — Article would
 * mis-classify them as long-form prose.
 */
export function buildCollectionPageSchema(
  title: string,
  description: string,
  lastUpdated: string,
  slug: string,
  datePublished?: string,
  locale: string = "en",
) {
  const ids = pageIds(slug, locale);

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": ids.webPage,
    name: title,
    description,
    url: ids.canonical,
    datePublished: datePublished ?? lastUpdated,
    dateModified: lastUpdated,
    inLanguage: locale,
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": SOFTWARE_ID },
    mainEntity: { "@id": ids.itemList },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: ogImageUrl(slug),
      width: 1200,
      height: 630,
    },
    publisher: { "@id": ORG_ID },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [".definition-block", ".faq-section"],
    },
    mentions: ENTITY_MENTIONS,
  };
}
