import Link from "next/link";
import type { ContentPage as ContentPageData } from "@/lib/markdown";
import { normalizeDate } from "@/lib/content-page-helpers";
import {
  JsonLd,
  buildBreadcrumbSchema,
  buildFAQSchema,
  buildArticleSchema,
} from "@/components/json-ld";
import { RelatedPages } from "@/components/related-pages";

interface ContentPageProps {
  page: ContentPageData;
}

export function ContentPage({ page }: ContentPageProps) {
  const { frontmatter, html, faqs } = page;
  const lastUpdated = normalizeDate(frontmatter.last_updated);

  // Build JSON-LD schemas based on frontmatter.schema_types
  const schemas: Record<string, unknown>[] = [
    buildBreadcrumbSchema(frontmatter.title, frontmatter.slug),
    buildArticleSchema(frontmatter.title, frontmatter.description, lastUpdated),
  ];

  if (frontmatter.schema_types.includes("FAQPage") && faqs.length > 0) {
    schemas.push(buildFAQSchema(faqs));
  }

  return (
    <>
      <JsonLd data={schemas} />
      <div className="content-page">
        <div className="content-page-header">
          <nav aria-label="Breadcrumb" className="breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{frontmatter.title}</span>
          </nav>
        </div>

        <article className="prose">
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </article>

        <RelatedPages currentSlug={frontmatter.slug} />
      </div>
    </>
  );
}
