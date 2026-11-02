import type { MetadataRoute } from "next";
import { getAllContentEntries, getContentLastUpdated } from "@/lib/markdown";
import { normalizeDate } from "@/lib/content-page-helpers";
import { SUPPORTED_LOCALES } from "@/lib/constants";

const BASE = "https://www.openlegion.ai";

type Alternates = { languages: Record<string, string> };
type SitemapEntry = MetadataRoute.Sitemap[number];

/**
 * Build hreflang alternates for nav-driven pages (home, pricing, faq, terms,
 * privacy). These are translated by next-intl message files which exist for
 * every supported locale, so we emit the full set.
 */
function alternatesForNavPath(path: string): Alternates {
  const languages: Record<string, string> = {};
  for (const locale of SUPPORTED_LOCALES) {
    const localePath = path === "/" ? `/${locale}` : `/${locale}${path}`;
    languages[locale] = `${BASE}${localePath}`;
  }
  languages["x-default"] = `${BASE}/en${path === "/" ? "" : path}`;
  return { languages };
}

/**
 * Build hreflang alternates for markdown-driven content pages. Only emit
 * locales whose translation file actually exists — emitting all 12
 * unconditionally produces near-duplicate-content URLs.
 *
 * `availableLocales` does NOT include "en" — English is the canonical and is
 * always emitted.
 */
function alternatesForContentPath(path: string, availableLocales: string[]): Alternates {
  const languages: Record<string, string> = {
    en: `${BASE}/en${path}`,
  };
  for (const locale of availableLocales) {
    languages[locale] = `${BASE}/${locale}${path}`;
  }
  languages["x-default"] = `${BASE}/en${path}`;
  return { languages };
}

/**
 * One <url> per language version, each carrying the full hreflang set.
 *
 * Google's sitemap rules for localized pages: every language version gets its
 * own <url> element listing itself and all its alternates. Listing only the
 * English URL with the others as <xhtml:link> left the translations out of the
 * submitted count (Search Console showed 100 submitted for ~800 pages) and
 * 157 translated URLs were still "unknown to Google" on 2026-11-02.
 */
function perLanguage(
  alternates: Alternates,
  fields: Omit<SitemapEntry, "url" | "alternates" | "lastModified">,
  lastModified: (locale: string) => Date,
): MetadataRoute.Sitemap {
  return Object.entries(alternates.languages)
    .filter(([locale]) => locale !== "x-default")
    .map(([locale, url]) => ({ ...fields, url, lastModified: lastModified(locale), alternates }));
}

function toDate(value: unknown): Date {
  return value instanceof Date ? value : new Date(normalizeDate(String(value)));
}

/**
 * Newest `last_updated` across the corpus. Nav pages aggregate content, so
 * the freshest content date is the right anchor for their lastmod — bouncing
 * nav lastmod on every build (`new Date()`) trains crawlers to ignore the
 * signal entirely ("always recent → always stale" antipattern).
 */
function newestContentDate(entries: ReturnType<typeof getAllContentEntries>): Date {
  let newest = new Date(0);
  for (const entry of entries) {
    const d = toDate(entry.frontmatter.last_updated);
    if (d > newest) newest = d;
  }
  return newest.getTime() > 0 ? newest : new Date();
}

const NAV_PAGES: { path: string; changeFrequency: SitemapEntry["changeFrequency"]; priority: number }[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.9 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.8 },
  { path: "/learn", changeFrequency: "weekly", priority: 0.85 },
  { path: "/money-back-guarantee", changeFrequency: "yearly", priority: 0.4 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries = getAllContentEntries();
  const navMod = newestContentDate(entries);

  const navEntries = NAV_PAGES.flatMap(({ path, changeFrequency, priority }) =>
    perLanguage(alternatesForNavPath(path), { changeFrequency, priority }, () => navMod),
  );

  const contentEntries = entries.flatMap((entry) => {
    const isHub = entry.slug === "/comparison";
    const isComparisonSubPage = entry.slug.startsWith("/comparison/");
    const priority = isHub ? 0.85 : isComparisonSubPage ? 0.75 : 0.8;
    return perLanguage(
      alternatesForContentPath(entry.slug, entry.availableLocales),
      { changeFrequency: "monthly", priority },
      (locale) => toDate(getContentLastUpdated(entry.slug, locale)),
    );
  });

  // llms.txt + llms-full.txt are generated from src/content/, so their
  // freshness mirrors the newest content date — same anchor as nav lastmod.
  const aiResources: MetadataRoute.Sitemap = [
    {
      url: `${BASE}/llms.txt`,
      lastModified: navMod,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${BASE}/llms-full.txt`,
      lastModified: navMod,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
  ];

  return [...navEntries, ...contentEntries, ...aiResources];
}
