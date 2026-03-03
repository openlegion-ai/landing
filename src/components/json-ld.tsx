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

export function buildBreadcrumbSchema(title: string, slug: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://openlegion.ai",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: title,
        item: `https://openlegion.ai${slug}`,
      },
    ],
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

export function buildArticleSchema(
  title: string,
  description: string,
  lastUpdated: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    datePublished: lastUpdated,
    dateModified: lastUpdated,
    author: {
      "@type": "Organization",
      name: "OpenLegion",
      url: "https://openlegion.ai",
    },
    publisher: {
      "@type": "Organization",
      name: "OpenLegion",
      url: "https://openlegion.ai",
      logo: {
        "@type": "ImageObject",
        url: "https://openlegion.ai/logo.png",
      },
    },
  };
}

