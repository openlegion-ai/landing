import Link from "next/link";

// ── Full page registry ──────────────────────────────────────────────────────

interface PageEntry {
  href: string;
  label: string;
}

const TOPIC_PAGES: PageEntry[] = [
  { href: "/ai-agent-platform", label: "AI Agent Platform" },
  { href: "/ai-agent-orchestration", label: "AI Agent Orchestration" },
  { href: "/ai-agent-frameworks", label: "AI Agent Frameworks Comparison" },
  { href: "/ai-agent-security", label: "AI Agent Security" },
  { href: "/openclaw-alternative", label: "OpenClaw Alternative" },
];

const COMPARISON_HUB: PageEntry = {
  href: "/comparison",
  label: "All Framework Comparisons",
};

const COMPARISON_PAGES: Record<string, PageEntry> = {
  openclaw: { href: "/comparison/openclaw", label: "OpenLegion vs OpenClaw" },
  langgraph: {
    href: "/comparison/langgraph",
    label: "OpenLegion vs LangGraph",
  },
  crewai: { href: "/comparison/crewai", label: "OpenLegion vs CrewAI" },
  autogen: { href: "/comparison/autogen", label: "OpenLegion vs AutoGen" },
  dify: { href: "/comparison/dify", label: "OpenLegion vs Dify" },
  "google-adk": {
    href: "/comparison/google-adk",
    label: "OpenLegion vs Google ADK",
  },
  "aws-strands": {
    href: "/comparison/aws-strands",
    label: "OpenLegion vs AWS Strands",
  },
  "openai-agents-sdk": {
    href: "/comparison/openai-agents-sdk",
    label: "OpenLegion vs OpenAI Agents SDK",
  },
  "manus-ai": {
    href: "/comparison/manus-ai",
    label: "OpenLegion vs Manus AI",
  },
  "semantic-kernel": {
    href: "/comparison/semantic-kernel",
    label: "OpenLegion vs Semantic Kernel",
  },
  zeroclaw: {
    href: "/comparison/zeroclaw",
    label: "OpenLegion vs ZeroClaw",
  },
  nanoclaw: {
    href: "/comparison/nanoclaw",
    label: "OpenLegion vs NanoClaw",
  },
  nanobot: {
    href: "/comparison/nanobot",
    label: "OpenLegion vs nanobot",
  },
  picoclaw: {
    href: "/comparison/picoclaw",
    label: "OpenLegion vs PicoClaw",
  },
  openfang: {
    href: "/comparison/openfang",
    label: "OpenLegion vs OpenFang",
  },
  memu: {
    href: "/comparison/memu",
    label: "OpenLegion vs MemU",
  },
};

// Per-comparison related siblings (4 most relevant based on cross-references)
const RELATED_MAP: Record<string, string[]> = {
  openclaw: ["zeroclaw", "nanoclaw", "openfang", "langgraph"],
  langgraph: ["crewai", "autogen", "openclaw", "openfang"],
  crewai: ["langgraph", "autogen", "openclaw", "openfang"],
  autogen: ["langgraph", "crewai", "semantic-kernel", "openai-agents-sdk"],
  dify: ["langgraph", "crewai", "manus-ai", "google-adk"],
  "google-adk": ["langgraph", "crewai", "aws-strands", "openai-agents-sdk"],
  "aws-strands": ["google-adk", "langgraph", "semantic-kernel", "openai-agents-sdk"],
  "openai-agents-sdk": ["langgraph", "crewai", "google-adk", "autogen"],
  "manus-ai": ["crewai", "openclaw", "dify", "google-adk"],
  "semantic-kernel": ["autogen", "langgraph", "aws-strands", "openai-agents-sdk"],
  zeroclaw: ["openfang", "openclaw", "nanoclaw", "picoclaw"],
  nanoclaw: ["zeroclaw", "openclaw", "picoclaw", "nanobot"],
  nanobot: ["nanoclaw", "picoclaw", "zeroclaw", "openclaw"],
  picoclaw: ["nanobot", "zeroclaw", "nanoclaw", "openclaw"],
  openfang: ["zeroclaw", "openclaw", "langgraph", "crewai"],
  memu: ["nanobot", "openclaw", "crewai", "langgraph"],
};

// ── Context-aware link selection ────────────────────────────────────────────

function getRelatedLinks(currentPath: string): PageEntry[] {
  // On comparison sub-pages: hub + 4 related comparisons
  const compMatch = currentPath.match(/^\/comparison\/(.+)$/);
  if (compMatch) {
    const slug = compMatch[1];
    const siblings = (RELATED_MAP[slug] ?? [])
      .map((s) => COMPARISON_PAGES[s])
      .filter(Boolean);
    return [COMPARISON_HUB, ...siblings];
  }

  // On the comparison hub: show topic pages
  if (currentPath === "/comparison") {
    return TOPIC_PAGES;
  }

  // On topic pages: other topic pages + comparison hub
  const otherTopics = TOPIC_PAGES.filter((p) => p.href !== currentPath);
  return [...otherTopics, COMPARISON_HUB];
}

// ── Component ───────────────────────────────────────────────────────────────

export function RelatedPages({ currentSlug }: { currentSlug: string }) {
  const links = getRelatedLinks(currentSlug);

  return (
    <nav aria-label="Related pages" className="related-pages">
      <h2>Related Pages</h2>
      <ul>
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
