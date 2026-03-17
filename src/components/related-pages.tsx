import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

// ── Full page registry ──────────────────────────────────────────────────────

interface PageEntry {
  href: string;
  labelKey: string;
}

const TOPIC_PAGES: PageEntry[] = [
  { href: "/ai-agent-platform", labelKey: "topicPages.0" },
  { href: "/ai-agent-orchestration", labelKey: "topicPages.1" },
  { href: "/ai-agent-frameworks", labelKey: "topicPages.2" },
  { href: "/ai-agent-security", labelKey: "topicPages.3" },
  { href: "/openclaw-alternative", labelKey: "topicPages.4" },
  { href: "/deepseek-v4-agents", labelKey: "topicPages.5" },
];

const COMPARISON_HUB: PageEntry = {
  href: "/comparison",
  labelKey: "comparisonHub",
};

const COMPARISON_PAGES: Record<string, PageEntry> = {
  openclaw: { href: "/comparison/openclaw", labelKey: "comparisons.openclaw" },
  langgraph: { href: "/comparison/langgraph", labelKey: "comparisons.langgraph" },
  crewai: { href: "/comparison/crewai", labelKey: "comparisons.crewai" },
  autogen: { href: "/comparison/autogen", labelKey: "comparisons.autogen" },
  dify: { href: "/comparison/dify", labelKey: "comparisons.dify" },
  "google-adk": { href: "/comparison/google-adk", labelKey: "comparisons.googleAdk" },
  "aws-strands": { href: "/comparison/aws-strands", labelKey: "comparisons.awsStrands" },
  "openai-agents-sdk": { href: "/comparison/openai-agents-sdk", labelKey: "comparisons.openaiAgentsSdk" },
  "manus-ai": { href: "/comparison/manus-ai", labelKey: "comparisons.manusAi" },
  "semantic-kernel": { href: "/comparison/semantic-kernel", labelKey: "comparisons.semanticKernel" },
  zeroclaw: { href: "/comparison/zeroclaw", labelKey: "comparisons.zeroclaw" },
  nanoclaw: { href: "/comparison/nanoclaw", labelKey: "comparisons.nanoclaw" },
  nanobot: { href: "/comparison/nanobot", labelKey: "comparisons.nanobot" },
  picoclaw: { href: "/comparison/picoclaw", labelKey: "comparisons.picoclaw" },
  openfang: { href: "/comparison/openfang", labelKey: "comparisons.openfang" },
  memu: { href: "/comparison/memu", labelKey: "comparisons.memu" },
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
  const t = useTranslations("relatedPages");
  const links = getRelatedLinks(currentSlug);

  return (
    <nav aria-label={t("ariaLabel")} className="related-pages">
      <h2>{t("heading")}</h2>
      <ul>
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href}>{t(link.labelKey)}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
