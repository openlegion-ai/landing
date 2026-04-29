import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  getContentEntry,
  getComparisonSubPageEntries,
  getLearnEntries,
} from "@/lib/markdown";

interface RelatedLink {
  href: string;
  label: string;
}

const COMPARISON_HUB: RelatedLink = {
  href: "/comparison",
  label: "All AI agent framework comparisons",
};

const LEARN_HUB: RelatedLink = {
  href: "/learn",
  label: "Learn — guides & frameworks",
};

const MAX_RELATED = 5;

/**
 * Resolve related links for a given page.
 *
 * Priority:
 *   1. Frontmatter `related: ["/comparison/foo", ...]` — engine-curated.
 *   2. Same-section siblings (other comparison or other learn pages).
 *   3. Section hub fallback.
 */
function getRelatedLinks(currentSlug: string): RelatedLink[] {
  const entry = getContentEntry(currentSlug);
  const links: RelatedLink[] = [];

  // 1. Curated from frontmatter.
  if (entry?.frontmatter.related?.length) {
    for (const slug of entry.frontmatter.related) {
      const target = getContentEntry(slug);
      if (target && slug !== currentSlug) {
        links.push({ href: slug, label: target.frontmatter.title });
      }
    }
  }

  // 2. Section siblings if curation didn't fill the slot.
  if (links.length < MAX_RELATED) {
    if (currentSlug.startsWith("/comparison/")) {
      const siblings = getComparisonSubPageEntries()
        .filter((e) => e.slug !== currentSlug && !links.some((l) => l.href === e.slug))
        .slice(0, MAX_RELATED - links.length)
        .map((e) => ({ href: e.slug, label: e.frontmatter.title }));
      links.push(...siblings);
    } else if (currentSlug.startsWith("/learn/")) {
      const siblings = getLearnEntries()
        .filter((e) => e.slug !== currentSlug && !links.some((l) => l.href === e.slug))
        .slice(0, MAX_RELATED - links.length)
        .map((e) => ({ href: e.slug, label: e.frontmatter.title }));
      links.push(...siblings);
    }
  }

  // 3. Always include the relevant hub at the top.
  if (currentSlug.startsWith("/comparison/")) {
    return [COMPARISON_HUB, ...links.slice(0, MAX_RELATED)];
  }
  if (currentSlug === "/comparison") {
    // Hub itself — surface a few learn pages.
    const learn = getLearnEntries()
      .slice(0, MAX_RELATED)
      .map((e) => ({ href: e.slug, label: e.frontmatter.title }));
    return [LEARN_HUB, ...learn];
  }
  if (currentSlug.startsWith("/learn/")) {
    return [LEARN_HUB, ...links.slice(0, MAX_RELATED)];
  }

  // Root content pages: a mix of both hubs.
  return [COMPARISON_HUB, LEARN_HUB, ...links.slice(0, MAX_RELATED - 2)];
}

export function RelatedPages({ currentSlug }: { currentSlug: string }) {
  const t = useTranslations("relatedPages");
  const links = getRelatedLinks(currentSlug);

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
