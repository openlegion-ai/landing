import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { ContentPage as ContentPageData } from "@/lib/markdown";
import { normalizeDate } from "@/lib/content-page-helpers";
import {
  JsonLd,
  buildBreadcrumbSchema,
  buildFAQSchema,
  buildArticleSchema,
  buildHowToSchema,
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
  const t = useTranslations("contentPage");
  const { frontmatter, html, faqs, howTo } = page;
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

  if (frontmatter.schema_types.includes("HowTo") && howTo) {
    schemas.push(buildHowToSchema(
      howTo.sectionName,
      frontmatter.description,
      howTo.steps,
      {
        totalTime: frontmatter.howto_total_time,
        tools: frontmatter.howto_tools,
      },
    ));
  }

  return (
    <>
      <JsonLd data={schemas} />
      <div className="content-page">
        <div className="content-page-header">
          <nav aria-label="Breadcrumb" className="breadcrumb">
            <Link href="/">{t("breadcrumbHome")}</Link>
            {isComparisonSubPage(slug) && (
              <>
                <span aria-hidden="true">/</span>
                <Link href="/comparison">{t("breadcrumbComparisons")}</Link>
              </>
            )}
            <span aria-hidden="true">/</span>
            <span aria-current="page">{frontmatter.title}</span>
          </nav>
          <div className="content-date">
            {published && published !== lastUpdated && (
              <time dateTime={published}>
                {t("publishedPrefix")}{formatDate(published)}
              </time>
            )}
            {published && published !== lastUpdated && (
              <span aria-hidden="true"> · </span>
            )}
            <time dateTime={lastUpdated}>
              {t("updatedPrefix")}{formatDate(lastUpdated)}
            </time>
          </div>
        </div>

        <article className="prose">
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </article>

        <aside aria-label={t("relatedContentAriaLabel")}>
          <RelatedPages currentSlug={slug} />
        </aside>
      </div>
    </>
  );
}
