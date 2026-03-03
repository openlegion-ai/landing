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
  const items: { "@type": string; position: number; name: string; item: string }[] = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://openlegion.ai",
    },
  ];

  // 3-level breadcrumb for /comparison/* sub-pages
  if (/^\/comparison\/.+$/.test(slug)) {
    items.push({
      "@type": "ListItem",
      position: 2,
      name: "Comparisons",
      item: "https://openlegion.ai/comparison",
    });
    items.push({
      "@type": "ListItem",
      position: 3,
      name: title,
      item: `https://openlegion.ai${slug}`,
    });
  } else {
    items.push({
      "@type": "ListItem",
      position: 2,
      name: title,
      item: `https://openlegion.ai${slug}`,
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

export function buildArticleSchema(
  title: string,
  description: string,
  lastUpdated: string,
  slug: string
) {
  const canonicalUrl = `https://openlegion.ai${slug}`;
  const slugForOg = slug.replace(/^\//, "").replace(/\//g, "-");

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    datePublished: lastUpdated,
    dateModified: lastUpdated,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    image: {
      "@type": "ImageObject",
      url: `https://openlegion.ai/og/${slugForOg}.png`,
      width: 1200,
      height: 630,
    },
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

