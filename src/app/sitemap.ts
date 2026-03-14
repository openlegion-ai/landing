import type { MetadataRoute } from "next";
import { getAllContentPages } from "@/lib/markdown";
import { normalizeDate } from "@/lib/content-page-helpers";

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

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.openlegion.ai";
  const pages = getAllContentPages();

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/pricing`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${base}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${base}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    ...pages.map((page) => ({
      url: `${base}${page.slug}`,
      lastModified: new Date(normalizeDate(page.last_updated)),
      changeFrequency: "monthly" as const,
      priority: page.slug === "/comparison" ? 0.8 : COMPARISON_SLUGS.has(page.slug) ? 0.7 : 0.8,
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
