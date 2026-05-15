import type { MetadataRoute } from "next";

// Explicit allowlist for the AI-bot user agents that publish distinct UA
// strings. The wildcard `*` rule already permits everything else, but bots
// with first-class robots.txt directives (GPTBot, PerplexityBot, ClaudeBot,
// OAI-SearchBot, etc.) look for an explicit stanza before crawling — giving
// them one is the safer signal.
const AI_BOTS = [
  // OpenAI
  "GPTBot",            // ChatGPT training crawler
  "ChatGPT-User",      // browse-on-behalf-of-user
  "OAI-SearchBot",     // ChatGPT Search / SearchGPT index
  // Anthropic
  "ClaudeBot",         // current Claude crawler
  "Claude-Web",        // legacy Claude crawler (still in field)
  "anthropic-ai",      // legacy
  // Google
  "Google-Extended",   // opt-in for Gemini / Bard training
  // Perplexity
  "PerplexityBot",
  "Perplexity-User",
  // Apple
  "Applebot-Extended",
  // Meta
  "FacebookBot",
  "Meta-ExternalAgent",
  // Misc
  "Amazonbot",
  "Bytespider",
  "cohere-ai",
  "CCBot",             // CommonCrawl — feeds many models
  "YouBot",
  "Diffbot",
  "MistralAI-User",    // Le Chat browse
  "Timpibot",          // Timpi index
  "Webzio-Extended",   // Webz.io AI-training fetch
  "DuckAssistBot",     // DuckDuckGo AI answers
  "ImageSiftBot",      // image-focused AI training
  "PanguBot",          // Huawei
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/_next/", "/api/"] },
      ...AI_BOTS.map((userAgent) => ({ userAgent, allow: "/" })),
    ],
    sitemap: "https://www.openlegion.ai/sitemap.xml",
  };
}
