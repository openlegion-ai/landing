import type { MetadataRoute } from "next";
import { getAllContentPages } from "@/lib/markdown";
import { normalizeDate } from "@/lib/content-page-helpers";
import { SUPPORTED_LOCALES } from "@/lib/constants";

const COMPARISON_SLUGS = new Set([
  "/comparison",
  "/comparison/openclaw",
  "/comparison/dify",
  "/comparison/openai-agents-sdk",
  "/comparison/semantic-kernel",
  "/comparison/autogen",
  "/comparison/crewai",
  "/comparison/langgraph",
  "/comparison/manus-ai",
  "/comparison/aws-strands",
  "/comparison/google-adk",
  "/comparison/zeroclaw",
  "/comparison/nanoclaw",
  "/comparison/nanobot",
  "/comparison/picoclaw",
  "/comparison/openfang",
  "/comparison/memu",
  "/openclaw-alternative",
]);

/**
 * Build hreflang alternates for a given path.
 *
 * Each locale gets its own sub-path URL: /en/pricing, /zh/pricing, etc.
 */
function alternatesForPath(base: string, path: string) {
  const languages: Record<string, string> = {};
  for (const locale of SUPPORTED_LOCALES) {
    const localePath = path === "/" ? `/${locale}` : `/${locale}${path}`;
    languages[locale] = `${base}${localePath}`;
  }
  languages["x-default"] = `${base}/en${path === "/" ? "" : path}`;
  return { languages };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.openlegion.ai";
  const pages = getAllContentPages();

  return [
    {
      url: `${base}/en`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
      alternates: alternatesForPath(base, "/"),
    },
    {
      url: `${base}/en/pricing`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
      alternates: alternatesForPath(base, "/pricing"),
    },
    {
      url: `${base}/en/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
      alternates: alternatesForPath(base, "/faq"),
    },
    {
      url: `${base}/en/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
      alternates: alternatesForPath(base, "/terms"),
    },
    {
      url: `${base}/en/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
      alternates: alternatesForPath(base, "/privacy"),
    },
    ...pages.map((page) => ({
      url: `${base}/en${page.slug}`,
      lastModified: new Date(normalizeDate(page.last_updated)),
      changeFrequency: "monthly" as const,
      priority: page.slug === "/comparison" ? 0.8 : COMPARISON_SLUGS.has(page.slug) ? 0.7 : 0.8,
      alternates: alternatesForPath(base, page.slug),
    })),
    {
      url: `${base}/llms.txt`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${base}/llms-full.txt`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
  ];
}
