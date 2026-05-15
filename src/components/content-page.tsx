import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { ContentPage as ContentPageData } from "@/lib/markdown";
import { getContentEntry } from "@/lib/markdown";
import { normalizeDate, resolvePageType } from "@/lib/content-page-helpers";
import {
  JsonLd,
  buildBreadcrumbSchema,
  buildFAQSchema,
  buildArticleSchema,
  buildCollectionPageSchema,
  buildHowToSchema,
  buildWebPageSchema,
  type EntityMention,
} from "@/components/json-ld";
import { PAGE_MENTIONS } from "@/lib/page-mentions";
import { RelatedPages } from "@/components/related-pages";

interface ContentPageProps {
  page: ContentPageData;
  /** Locale this page is being rendered for — drives schema inLanguage and canonical URL. */
  locale: string;
}

// Sub-page detection: pages under a section hub (`/comparison/<x>` or
// `/learn/<x>`) get a 3-level breadcrumb so the hub is one click away.
const sectionForSlug = (slug: string): { hub: string; labelKey: "breadcrumbComparisons" | "breadcrumbLearn" } | null => {
  if (/^\/comparison\/.+$/.test(slug)) return { hub: "/comparison", labelKey: "breadcrumbComparisons" };
  if (/^\/learn\/.+$/.test(slug)) return { hub: "/learn", labelKey: "breadcrumbLearn" };
  return null;
};

function formatDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function ContentPage({ page, locale }: ContentPageProps) {
  const t = useTranslations("contentPage");
  const { frontmatter, html, faqs, howTo } = page;
  const lastUpdated = normalizeDate(frontmatter.last_updated);
  const slug = frontmatter.slug;

  // The *effective* locale is the one the page is canonically served at.
  // If a translation exists for the current locale, the canonical URL is
  // /<locale>/<slug>. If no translation exists, `withLocaleAlternates` falls
  // the canonical back to /en/<slug> and emits `noindex,follow` — so the
  // JSON-LD must declare English to match the canonical link.
  const entry = getContentEntry(slug);
  const hasTranslation =
    locale === "en" || (entry?.availableLocales.includes(locale) ?? false);
  const effectiveLocale = hasTranslation ? locale : "en";

  // Translated breadcrumb labels match the on-page breadcrumb the user sees
  // and keep BreadcrumbList JSON-LD localized for SERP rich results.
  const breadcrumbLabels = {
    home: t("breadcrumbHome"),
    comparisons: t("breadcrumbComparisons"),
    learn: t("breadcrumbLearn"),
  };

  // Build JSON-LD schemas based on frontmatter.schema_types
  const published = frontmatter.date_published
    ? normalizeDate(frontmatter.date_published)
    : undefined;

  // Hub pages (page_type: "hub", e.g. /comparison) describe a curated list of
  // sibling pages — CollectionPage is the canonical schema. Everything else
  // gets a WebPage + Article pair with topical entity mentions layered on.
  // `resolvePageType` falls back to slug-shape inference so future hubs that
  // forget the frontmatter still emit the right schema.
  const isHub = resolvePageType(slug, frontmatter.page_type) === "hub";
  const extraMentions: EntityMention[] = PAGE_MENTIONS[slug] ?? [];

  // Every page emits a single consolidated @graph (JsonLd auto-wraps an
  // array into @graph). Cross-links via @id collapse repeated Organization /
  // WebSite blocks down to references — that's the form AI engines and
  // Google's structured-data tester prefer for entity resolution.
  const schemas: Record<string, unknown>[] = [
    buildBreadcrumbSchema(frontmatter.title, slug, effectiveLocale, breadcrumbLabels),
  ];

  if (isHub) {
    schemas.push(
      buildCollectionPageSchema(frontmatter.title, frontmatter.description, lastUpdated, slug, published, effectiveLocale),
    );
  } else {
    schemas.push(
      buildWebPageSchema(frontmatter.title, frontmatter.description, lastUpdated, slug, published, effectiveLocale),
      buildArticleSchema(frontmatter.title, frontmatter.description, lastUpdated, slug, published, extraMentions, effectiveLocale),
    );
  }

  if (frontmatter.schema_types.includes("FAQPage") && faqs.length > 0) {
    schemas.push(buildFAQSchema(faqs, slug, effectiveLocale));
  }

  if (frontmatter.schema_types.includes("HowTo") && howTo) {
    schemas.push(buildHowToSchema(
      howTo.sectionName,
      frontmatter.description,
      howTo.steps,
      {
        totalTime: frontmatter.howto_total_time,
        tools: frontmatter.howto_tools,
        slug,
        locale: effectiveLocale,
      },
    ));
  }

  return (
    <>
      <JsonLd data={schemas} />
      <div className="content-page">
        <div className="content-page-header">
          <nav aria-label={t("breadcrumbAriaLabel")} className="breadcrumb">
            <Link href="/">{t("breadcrumbHome")}</Link>
            {(() => {
              const section = sectionForSlug(slug);
              if (!section) return null;
              return (
                <>
                  <span aria-hidden="true">/</span>
                  <Link href={section.hub}>{t(section.labelKey)}</Link>
                </>
              );
            })()}
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
