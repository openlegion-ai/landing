import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  getContentEntry,
  getComparisonSubPageEntries,
  getLearnEntries,
  getContentTitle,
} from "@/lib/markdown";

interface RelatedLink {
  href: string;
  label: string;
}

const MAX_RELATED = 5;

/**
 * Resolve related links for a given page, with each link label rendered in
 * the visitor's locale.
 *
 * Priority:
 *   1. Frontmatter `related: ["/comparison/foo", ...]` — engine-curated.
 *   2. Same-section siblings (other comparison or other learn pages).
 *   3. Section hub fallback.
 *
 * Titles are resolved via `getContentTitle(slug, locale)` so a Japanese
 * visitor reading /ja/comparison/openclaw sees Japanese link labels — not
 * the canonical English title that `entry.frontmatter.title` always holds.
 */
function getRelatedLinks(
  currentSlug: string,
  locale: string,
  hubLabels: { comparison: string; learn: string },
): RelatedLink[] {
  const entry = getContentEntry(currentSlug);
  const links: RelatedLink[] = [];

  const comparisonHub: RelatedLink = { href: "/comparison", label: hubLabels.comparison };
  const learnHub: RelatedLink = { href: "/learn", label: hubLabels.learn };

  const labelFor = (slug: string, fallback: string) =>
    getContentTitle(slug, locale) ?? fallback;

  // 1. Curated from frontmatter.
  if (entry?.frontmatter.related?.length) {
    for (const slug of entry.frontmatter.related) {
      const target = getContentEntry(slug);
      if (target && slug !== currentSlug) {
        links.push({ href: slug, label: labelFor(slug, target.frontmatter.title) });
      }
    }
  }

  // 2. Section siblings if curation didn't fill the slot.
  if (links.length < MAX_RELATED) {
    if (currentSlug.startsWith("/comparison/")) {
      const siblings = getComparisonSubPageEntries()
        .filter((e) => e.slug !== currentSlug && !links.some((l) => l.href === e.slug))
        .slice(0, MAX_RELATED - links.length)
        .map((e) => ({ href: e.slug, label: labelFor(e.slug, e.frontmatter.title) }));
      links.push(...siblings);
    } else if (currentSlug.startsWith("/learn/")) {
      const siblings = getLearnEntries()
        .filter((e) => e.slug !== currentSlug && !links.some((l) => l.href === e.slug))
        .slice(0, MAX_RELATED - links.length)
        .map((e) => ({ href: e.slug, label: labelFor(e.slug, e.frontmatter.title) }));
      links.push(...siblings);
    }
  }

  // 3. Always include the relevant hub at the top.
  if (currentSlug.startsWith("/comparison/")) {
    return [comparisonHub, ...links.slice(0, MAX_RELATED)];
  }
  if (currentSlug === "/comparison") {
    // Hub itself — surface a few learn pages instead.
    const learn = getLearnEntries()
      .slice(0, MAX_RELATED)
      .map((e) => ({ href: e.slug, label: labelFor(e.slug, e.frontmatter.title) }));
    return [learnHub, ...learn];
  }
  if (currentSlug.startsWith("/learn/")) {
    return [learnHub, ...links.slice(0, MAX_RELATED)];
  }

  // Root content pages: a mix of both hubs.
  return [comparisonHub, learnHub, ...links.slice(0, MAX_RELATED - 2)];
}

export function RelatedPages({
  currentSlug,
  locale,
}: {
  currentSlug: string;
  locale: string;
}) {
  const t = useTranslations("relatedPages");
  const links = getRelatedLinks(currentSlug, locale, {
    comparison: t("comparisonHub"),
    learn: t("learnHub"),
  });

  if (links.length === 0) return null;

  return (
    <nav aria-label={t("ariaLabel")} className="related-pages">
      <h2>{t("heading")}</h2>
      <ul>
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
