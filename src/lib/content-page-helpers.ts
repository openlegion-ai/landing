import type { Metadata } from "next";
import type { ContentEntry, ContentFrontmatter } from "@/lib/markdown";
import { SITE_URL } from "@/lib/seo";

const BASE_URL = SITE_URL;

export function normalizeDate(dateStr: string): string {
  if (/^\d{4}-\d{2}$/.test(dateStr)) return `${dateStr}-01`;
  return dateStr;
}

/**
 * Resolve a content page's effective `page_type` — honoring an explicit
 * frontmatter declaration first, then falling back to slug-shape inference
 * matching CONTENT_GUIDE's promise ("Inferred from slug if omitted"). Safety
 * net for future hub pages (e.g. a `/blog` hub) whose authors forget the
 * frontmatter.
 *
 *   /comparison           → hub
 *   /learn                → hub  (markdown variant, if ever added)
 *   /comparison/<x>       → comparison
 *   /learn/<x>            → learn
 *   /<root>               → root
 */
export type PageType = "comparison" | "learn" | "alternative" | "root" | "hub";

const HUB_SLUGS = new Set<string>(["/comparison", "/learn"]);

export function resolvePageType(
  slug: string,
  declared?: string | null,
): PageType {
  if (declared && /^(comparison|learn|alternative|root|hub)$/.test(declared)) {
    return declared as PageType;
  }
  if (HUB_SLUGS.has(slug)) return "hub";
  if (slug.startsWith("/comparison/")) return "comparison";
  if (slug.startsWith("/learn/")) return "learn";
  return "root";
}

/**
 * Locales whose script the bundled OG renderer (Satori) can handle without
 * loading custom font assets. Restricted to Latin-script locales because
 * Arabic / CJK / Devanagari / Thai use OpenType glyph-substitution features
 * (GSUB lookup type 5, substFormat 3) that Satori's default fallback font
 * does not implement.
 *
 * Other locales' pages still emit a translated `og:title` and
 * `og:description` — social platforms overlay that text on the (English)
 * card image, so the visible share language is still correct.
 */
export const OG_RENDERABLE_LOCALES = new Set([
  "en",
  "es",
  "fr",
  "de",
  "pt",
]);

/** Clamp a requested locale to one whose script the OG renderer supports. */
export function ogLocaleFor(locale: string): string {
  return OG_RENDERABLE_LOCALES.has(locale) ? locale : "en";
}

/** OG image path for a given content slug under a locale (locale-clamped). */
export function ogImagePath(slug: string, locale: string = "en"): string {
  const slugForOg = slug.replace(/^\//, "").replace(/\//g, "-");
  return `/og/${ogLocaleFor(locale)}/${slugForOg}.png`;
}

export function buildMetadata(frontmatter: ContentFrontmatter): Metadata {
  const lastUpdated = normalizeDate(frontmatter.last_updated);
  const published = frontmatter.date_published
    ? normalizeDate(frontmatter.date_published)
    : lastUpdated;

  const titleAlreadyBranded = frontmatter.title.includes("OpenLegion");

  // Placeholder canonical + OG locale — `withLocaleAlternates` rewrites both
  // to the *effective* locale (page's own when a translation exists, English
  // when it falls back). Keeps buildMetadata stateless so it composes with
  // withLocaleAlternates without needing the entry's availableLocales.
  const canonical = `${BASE_URL}/en${frontmatter.slug}`;
  const ogUrl = ogImagePath(frontmatter.slug, "en");

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
          url: ogUrl,
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
      images: [ogUrl],
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

  const effectiveLocale = hasTranslation ? currentLocale : "en";
  const canonical = `${BASE_URL}/${effectiveLocale}${slug}`;
  // OG image follows the effective locale — keeps social-share cards
  // in-language and avoids serving the English-text fallback image at a
  // locale URL where the rest of the metadata is translated.
  const ogUrl = ogImagePath(slug, effectiveLocale);
  const baseImages = base.openGraph?.images;
  const firstImage = Array.isArray(baseImages) ? baseImages[0] : baseImages;
  const ogAlt =
    typeof firstImage === "object" && firstImage !== null && "alt" in firstImage
      ? (firstImage as { alt?: string }).alt
      : undefined;

  return {
    ...base,
    alternates: {
      canonical,
      languages,
    },
    openGraph: base.openGraph
      ? {
          ...base.openGraph,
          url: canonical,
          images: [{ url: ogUrl, width: 1200, height: 630, alt: ogAlt }],
        }
      : base.openGraph,
    twitter: base.twitter
      ? {
          ...base.twitter,
          images: [ogUrl],
        }
      : base.twitter,
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
