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

const isComparisonSubPage = (slug: string) => /^\/comparison\/.+$/.test(slug);

function formatDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function ContentPage({ page }: ContentPageProps) {
  const { frontmatter, html, faqs } = page;
  const lastUpdated = normalizeDate(frontmatter.last_updated);
  const slug = frontmatter.slug;

  // Build JSON-LD schemas based on frontmatter.schema_types
  const published = frontmatter.date_published
    ? normalizeDate(frontmatter.date_published)
    : undefined;

  const schemas: Record<string, unknown>[] = [
    buildBreadcrumbSchema(frontmatter.title, slug),
    buildArticleSchema(frontmatter.title, frontmatter.description, lastUpdated, slug, published),
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
            {isComparisonSubPage(slug) && (
              <>
                <span aria-hidden="true">/</span>
                <Link href="/comparison">Comparisons</Link>
              </>
            )}
            <span aria-hidden="true">/</span>
            <span aria-current="page">{frontmatter.title}</span>
          </nav>
          <time dateTime={lastUpdated} className="content-date">
            Updated {formatDate(lastUpdated)}
          </time>
        </div>

        <article className="prose">
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </article>

        <RelatedPages currentSlug={slug} />
      </div>
    </>
  );
}
