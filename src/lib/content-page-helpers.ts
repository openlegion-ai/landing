import type { Metadata } from "next";
import type { ContentFrontmatter } from "@/lib/markdown";

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
      canonical: `https://openlegion.ai${frontmatter.slug}`,
    },
    openGraph: {
      title: frontmatter.title,
      description: frontmatter.description,
      type: "article",
      siteName: "OpenLegion",
      url: `https://openlegion.ai${frontmatter.slug}`,
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
      "article:author": "OpenLegion",
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
