import type { Metadata } from "next";
import type { ContentEntry, ContentFrontmatter } from "@/lib/markdown";

const BASE_URL = "https://www.openlegion.ai";

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

  // Titles already containing "OpenLegion" opt out of the layout template
  // to avoid double branding (e.g. "OpenLegion vs X | OpenLegion")
  const titleAlreadyBranded = frontmatter.title.includes("OpenLegion");

  return {
    title: titleAlreadyBranded
      ? { absolute: frontmatter.title }
      : frontmatter.title,
    description: frontmatter.description,
    alternates: {
      canonical: `${BASE_URL}${frontmatter.slug}`,
    },
    openGraph: {
      title: frontmatter.title,
      description: frontmatter.description,
      type: "article",
      siteName: "OpenLegion",
      url: `${BASE_URL}${frontmatter.slug}`,
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
 *   trap that currently blasts ~280 dupes into the index).
 * - canonical always points to the English URL — that's our authority page.
 * - If the current locale is non-English and lacks a translation, we set
 *   `noindex,follow` on that locale's variant. Removing hreflang alone does
 *   not de-index pages already in Google's index; the meta directive does.
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

  return {
    ...base,
    alternates: {
      canonical: englishUrl,
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
