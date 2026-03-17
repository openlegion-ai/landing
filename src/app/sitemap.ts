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
 * Non-default locales get a `?lang=` param. The proxy handles this param
 * by setting the locale cookie on both request (visible to server components
 * in the same cycle) and response (persisted for future visits). This lets
 * search engine crawlers receive correctly localised content.
 */
function alternatesForPath(base: string, path: string) {
  const url = path === "/" ? base : `${base}${path}`;
  const languages: Record<string, string> = { "x-default": url };
  for (const locale of SUPPORTED_LOCALES) {
    languages[locale] = locale === "en" ? url : `${url}?lang=${locale}`;
  }
  return { languages };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.openlegion.ai";
  const pages = getAllContentPages();

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
      alternates: alternatesForPath(base, "/"),
    },
    {
      url: `${base}/pricing`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
      alternates: alternatesForPath(base, "/pricing"),
    },
    {
      url: `${base}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
      alternates: alternatesForPath(base, "/faq"),
    },
    {
      url: `${base}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
      alternates: alternatesForPath(base, "/terms"),
    },
    {
      url: `${base}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
      alternates: alternatesForPath(base, "/privacy"),
    },
    ...pages.map((page) => ({
      url: `${base}${page.slug}`,
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
