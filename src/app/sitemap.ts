import type { MetadataRoute } from "next";
import { getAllContentEntries } from "@/lib/markdown";
import { normalizeDate } from "@/lib/content-page-helpers";
import { SUPPORTED_LOCALES } from "@/lib/constants";

const BASE = "https://www.openlegion.ai";

/**
 * Build hreflang alternates for nav-driven pages (home, pricing, faq, terms,
 * privacy). These are translated by next-intl message files which exist for
 * every supported locale, so we emit the full set.
 */
function alternatesForNavPath(path: string) {
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
function alternatesForContentPath(path: string, availableLocales: string[]) {
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
 * Newest `last_updated` across the corpus. Nav pages aggregate content, so
 * the freshest content date is the right anchor for their lastmod — bouncing
 * nav lastmod on every build (`new Date()`) trains crawlers to ignore the
 * signal entirely ("always recent → always stale" antipattern).
 */
function newestContentDate(entries: ReturnType<typeof getAllContentEntries>): Date {
  let newest = new Date(0);
  for (const entry of entries) {
    const d = new Date(normalizeDate(entry.frontmatter.last_updated));
    if (d > newest) newest = d;
  }
  return newest.getTime() > 0 ? newest : new Date();
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries = getAllContentEntries();
  const navMod = newestContentDate(entries);

  const navEntries: MetadataRoute.Sitemap = [
    {
      url: `${BASE}/en`,
      lastModified: navMod,
      changeFrequency: "weekly",
      priority: 1,
      alternates: alternatesForNavPath("/"),
    },
    {
      url: `${BASE}/en/pricing`,
      lastModified: navMod,
      changeFrequency: "monthly",
      priority: 0.9,
      alternates: alternatesForNavPath("/pricing"),
    },
    {
      url: `${BASE}/en/faq`,
      lastModified: navMod,
      changeFrequency: "monthly",
      priority: 0.8,
      alternates: alternatesForNavPath("/faq"),
    },
    {
      url: `${BASE}/en/learn`,
      lastModified: navMod,
      changeFrequency: "weekly",
      priority: 0.85,
      alternates: alternatesForNavPath("/learn"),
    },
    {
      url: `${BASE}/en/money-back-guarantee`,
      lastModified: navMod,
      changeFrequency: "yearly",
      priority: 0.4,
      alternates: alternatesForNavPath("/money-back-guarantee"),
    },
    {
      url: `${BASE}/en/terms`,
      lastModified: navMod,
      changeFrequency: "yearly",
      priority: 0.3,
      alternates: alternatesForNavPath("/terms"),
    },
    {
      url: `${BASE}/en/privacy`,
      lastModified: navMod,
      changeFrequency: "yearly",
      priority: 0.3,
      alternates: alternatesForNavPath("/privacy"),
    },
  ];

  const contentEntries: MetadataRoute.Sitemap = entries.map((entry) => {
    const isHub = entry.slug === "/comparison";
    const isComparisonSubPage = entry.slug.startsWith("/comparison/");
    const priority = isHub ? 0.85 : isComparisonSubPage ? 0.75 : 0.8;
    return {
      url: `${BASE}/en${entry.slug}`,
      lastModified: new Date(normalizeDate(entry.frontmatter.last_updated)),
      changeFrequency: "monthly" as const,
      priority,
      alternates: alternatesForContentPath(entry.slug, entry.availableLocales),
    };
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
