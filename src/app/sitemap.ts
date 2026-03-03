import type { MetadataRoute } from "next";
import { getAllContentPages } from "@/lib/markdown";
import { normalizeDate } from "@/lib/content-page-helpers";

const COMPARISON_SLUGS = new Set(["/comparison/openclaw", "/openclaw-alternative"]);

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://openlegion.ai";
  const pages = getAllContentPages();

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...pages.map((page) => ({
      url: `${base}${page.slug}`,
      lastModified: new Date(normalizeDate(page.last_updated)),
      changeFrequency: "monthly" as const,
      priority: COMPARISON_SLUGS.has(page.slug) ? 0.7 : 0.8,
    })),
  ];
}
