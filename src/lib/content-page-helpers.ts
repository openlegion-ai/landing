import type { Metadata } from "next";
import type { ContentEntry, ContentFrontmatter } from "@/lib/markdown";
import { SITE_URL } from "@/lib/seo";

const BASE_URL = SITE_URL;

export function normalizeDate(dateStr: string): string {
  if (/^\d{4}-\d{2}$/.test(dateStr)) return `${dateStr}-01`;
  return dateStr;
}

export function buildMetadata(frontmatter: ContentFrontmatter): Metadata {
  const lastUpdated = normalizeDate(frontmatter.last_updated);
  const published = frontmatter.date_published
    ? normalizeDate(frontmatter.date_published)
    : lastUpdated;
  const slugForOg = frontmatter.slug.replace(/^\//, "").replace(/\//g, "-");

  const titleAlreadyBranded = frontmatter.title.includes("OpenLegion");

  const canonical = `${BASE_URL}/en${frontmatter.slug}`;

  return {
    title: titleAlreadyBranded
      ? { absolute: frontmatter.title }
      : frontmatter.title,
    description: frontmatter.description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: frontmatter.title,
      description: frontmatter.description,
      type: "article",
      siteName: "OpenLegion",
      url: canonical,
      locale: "en_US",
      images: [
        {
          url: `/og/${slugForOg}.png`,
          width: 1200,
          height: 630,
          alt: frontmatter.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@openlegion",
      title: frontmatter.title,
      description: frontmatter.description,
      images: [`/og/${slugForOg}.png`],
    },
    other: {
      "article:modified_time": lastUpdated,
      "article:published_time": published,
      "article:author": frontmatter.author ?? "OpenLegion",
      "article:section": "AI Agents",
    },
    keywords: [frontmatter.primary_keyword, ...(frontmatter.secondary_keywords ?? [])],
    robots: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large" as const,
      "max-video-preview": -1,
    },
  };
}

/**
 * Layer locale-aware alternates + index/noindex onto base metadata.
 *
 * - hreflang map is gated on `entry.availableLocales` so we never advertise
 *   English content under a foreign-language URL (avoids the duplicate-content
 *   trap that bloats the index with near-duplicates).
 * - When the current locale has a translation, canonical is self-referential
 *   (the locale-prefixed URL). When it doesn't, canonical falls back to the
 *   English authority page AND we emit `noindex,follow` so Google won't
 *   surface the English-content-under-foreign-URL as a separate result.
 */
export function withLocaleAlternates(
  base: Metadata,
  entry: ContentEntry,
  currentLocale: string
): Metadata {
  const slug = entry.slug;
  const englishUrl = `${BASE_URL}/en${slug}`;
  const languages: Record<string, string> = {
    en: englishUrl,
    "x-default": englishUrl,
  };
  for (const locale of entry.availableLocales) {
    languages[locale] = `${BASE_URL}/${locale}${slug}`;
  }

  const hasTranslation =
    currentLocale === "en" || entry.availableLocales.includes(currentLocale);

  const canonical = hasTranslation
    ? `${BASE_URL}/${currentLocale}${slug}`
    : englishUrl;

  return {
    ...base,
    alternates: {
      canonical,
      languages,
    },
    robots: hasTranslation
      ? base.robots
      : {
          index: false,
          follow: true,
          "max-snippet": -1,
          "max-image-preview": "large" as const,
          "max-video-preview": -1,
        },
  };
}
