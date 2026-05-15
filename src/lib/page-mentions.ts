import type { EntityMention } from "@/components/json-ld";

/**
 * Page-specific topical entity mentions, layered on top of the shared
 * ENTITY_MENTIONS (Docker / Python / LLM / SQLite) inside
 * `buildArticleSchema`.
 *
 * The intent is topical-authority: comparison pages should explicitly cite
 * the competitor (and its parent org when available); learn pages should
 * cite the concepts they cover. AI engines (Perplexity, ChatGPT Search,
 * Claude) weight schema.org `mentions` for entity-anchored retrieval, so a
 * tight mention list materially improves which queries the page surfaces
 * under.
 *
 * IMPORTANT — `sameAs` validation policy: every URL has been verified to
 * resolve to the correct entity. An incorrect Wikidata Q-ID is worse than no
 * sameAs at all (sends Google to the wrong entity record). Prefer:
 *   1. Wikidata Q-IDs only when verified.
 *   2. Wikipedia URLs for concepts (stable, reliable).
 *   3. GitHub URLs for OSS projects (canonical identity).
 *   4. Official website URLs for products/companies without Wikidata entries.
 *   5. Omit sameAs entirely if no reliable URL exists — name alone is valid.
 *
 * Keys are full URL slugs as stored in markdown frontmatter (e.g.
 * "/comparison/langgraph").
 */
export const PAGE_MENTIONS: Record<string, EntityMention[]> = {
  // ── Comparison pages ───────────────────────────────────────────────────
  "/comparison/langgraph": [
    { "@type": "SoftwareApplication", name: "LangGraph",  sameAs: "https://github.com/langchain-ai/langgraph" },
    { "@type": "SoftwareApplication", name: "LangChain",  sameAs: "https://github.com/langchain-ai/langchain" },
    { "@type": "SoftwareApplication", name: "LangSmith",  sameAs: "https://www.langchain.com/langsmith" },
  ],
  "/comparison/crewai": [
    { "@type": "SoftwareApplication", name: "CrewAI", sameAs: "https://github.com/crewAIInc/crewAI" },
  ],
  "/comparison/autogen": [
    { "@type": "SoftwareApplication", name: "AutoGen",            sameAs: "https://github.com/microsoft/autogen" },
    { "@type": "Organization",        name: "Microsoft Research", sameAs: "https://www.microsoft.com/en-us/research/" },
  ],
  "/comparison/openai-agents-sdk": [
    { "@type": "SoftwareApplication", name: "OpenAI Agents SDK", sameAs: "https://github.com/openai/openai-agents-python" },
    { "@type": "Organization",        name: "OpenAI",            sameAs: "https://www.wikidata.org/wiki/Q21708200" },
  ],
  "/comparison/semantic-kernel": [
    { "@type": "SoftwareApplication", name: "Semantic Kernel", sameAs: "https://github.com/microsoft/semantic-kernel" },
    { "@type": "Organization",        name: "Microsoft",       sameAs: "https://www.wikidata.org/wiki/Q2283" },
  ],
  "/comparison/google-adk": [
    { "@type": "SoftwareApplication", name: "Google ADK", sameAs: "https://github.com/google/adk-python" },
    { "@type": "Organization",        name: "Google",     sameAs: "https://www.wikidata.org/wiki/Q95" },
  ],
  "/comparison/aws-strands": [
    { "@type": "SoftwareApplication", name: "AWS Strands",          sameAs: "https://github.com/awslabs/strands-agents" },
    { "@type": "Organization",        name: "Amazon Web Services",  sameAs: "https://aws.amazon.com" },
  ],
  "/comparison/dify": [
    { "@type": "SoftwareApplication", name: "Dify", sameAs: "https://github.com/langgenius/dify" },
  ],
  "/comparison/manus-ai": [
    { "@type": "SoftwareApplication", name: "Manus AI", sameAs: "https://manus.im" },
  ],
  "/comparison/memu": [
    { "@type": "SoftwareApplication", name: "MemU", sameAs: "https://github.com/NevaMind-AI/memU" },
  ],
  "/comparison/openclaw": [
    { "@type": "SoftwareApplication", name: "OpenClaw" },
  ],
  "/comparison/zeroclaw": [
    { "@type": "SoftwareApplication", name: "ZeroClaw" },
    { "@type": "SoftwareApplication", name: "OpenClaw" },
  ],
  "/comparison/nanoclaw": [
    { "@type": "SoftwareApplication", name: "NanoClaw" },
    { "@type": "SoftwareApplication", name: "OpenClaw" },
  ],
  "/comparison/picoclaw": [
    { "@type": "SoftwareApplication", name: "PicoClaw" },
    { "@type": "SoftwareApplication", name: "OpenClaw" },
  ],
  "/comparison/openfang": [
    { "@type": "SoftwareApplication", name: "OpenFang" },
    { "@type": "SoftwareApplication", name: "OpenClaw" },
  ],
  "/comparison/nanobot": [
    { "@type": "SoftwareApplication", name: "nanobot" },
    { "@type": "SoftwareApplication", name: "OpenClaw" },
  ],

  // ── Learn pages ────────────────────────────────────────────────────────
  "/learn/ai-agent-platform": [
    { "@type": "Thing", name: "Container isolation",     sameAs: "https://en.wikipedia.org/wiki/OS-level_virtualization" },
    { "@type": "Thing", name: "Model Context Protocol",  sameAs: "https://modelcontextprotocol.io" },
  ],
  "/learn/ai-agent-orchestration": [
    { "@type": "Thing", name: "Orchestration (computing)", sameAs: "https://en.wikipedia.org/wiki/Orchestration_(computing)" },
    { "@type": "Thing", name: "Publish–subscribe pattern", sameAs: "https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern" },
    { "@type": "Thing", name: "Blackboard system",         sameAs: "https://en.wikipedia.org/wiki/Blackboard_system" },
  ],
  "/learn/ai-agent-frameworks": [
    { "@type": "SoftwareApplication", name: "LangGraph",       sameAs: "https://github.com/langchain-ai/langgraph" },
    { "@type": "SoftwareApplication", name: "CrewAI",          sameAs: "https://github.com/crewAIInc/crewAI" },
    { "@type": "SoftwareApplication", name: "AutoGen",         sameAs: "https://github.com/microsoft/autogen" },
    { "@type": "SoftwareApplication", name: "Semantic Kernel", sameAs: "https://github.com/microsoft/semantic-kernel" },
  ],
  "/learn/ai-agent-security": [
    { "@type": "Thing", name: "Prompt injection",            sameAs: "https://en.wikipedia.org/wiki/Prompt_injection" },
    { "@type": "Thing", name: "Server-side request forgery", sameAs: "https://en.wikipedia.org/wiki/Server-side_request_forgery" },
    { "@type": "Thing", name: "Defense in depth (computing)", sameAs: "https://en.wikipedia.org/wiki/Defense_in_depth_(computing)" },
  ],
  "/learn/ai-agent-observability": [
    { "@type": "SoftwareApplication", name: "OpenTelemetry",  sameAs: "https://opentelemetry.io" },
    { "@type": "SoftwareApplication", name: "LangSmith",      sameAs: "https://www.langchain.com/langsmith" },
    { "@type": "SoftwareApplication", name: "Langfuse",       sameAs: "https://github.com/langfuse/langfuse" },
    { "@type": "SoftwareApplication", name: "Arize Phoenix",  sameAs: "https://github.com/Arize-ai/phoenix" },
    { "@type": "SoftwareApplication", name: "Helicone",       sameAs: "https://github.com/Helicone/helicone" },
    { "@type": "SoftwareApplication", name: "Datadog",        sameAs: "https://www.datadoghq.com" },
  ],
  "/learn/model-context-protocol": [
    { "@type": "Thing",        name: "Model Context Protocol", sameAs: "https://modelcontextprotocol.io" },
    { "@type": "Organization", name: "Anthropic",              sameAs: "https://www.anthropic.com" },
    { "@type": "SoftwareApplication", name: "Claude Desktop",  sameAs: "https://claude.ai/download" },
    { "@type": "SoftwareApplication", name: "Cursor",          sameAs: "https://www.cursor.com" },
    { "@type": "SoftwareApplication", name: "LiteLLM",         sameAs: "https://github.com/BerriAI/litellm" },
  ],

  // ── Root pages ─────────────────────────────────────────────────────────
  "/deepseek-v4-agents": [
    { "@type": "Organization", name: "DeepSeek",           sameAs: "https://en.wikipedia.org/wiki/DeepSeek" },
    { "@type": "Thing",        name: "Mixture of experts", sameAs: "https://en.wikipedia.org/wiki/Mixture_of_experts" },
  ],
  "/openclaw-alternative": [
    { "@type": "SoftwareApplication", name: "OpenClaw" },
  ],
  "/ai-social-media-management": [
    { "@type": "SoftwareApplication", name: "X (Twitter)", sameAs: "https://www.wikidata.org/wiki/Q918" },
    { "@type": "SoftwareApplication", name: "LinkedIn",    sameAs: "https://www.linkedin.com" },
    { "@type": "SoftwareApplication", name: "Instagram",   sameAs: "https://www.wikidata.org/wiki/Q209330" },
    { "@type": "SoftwareApplication", name: "TikTok",      sameAs: "https://www.tiktok.com" },
  ],
};
