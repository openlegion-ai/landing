import {
  Workflow,
  Code,
  TrendingUp,
  Pen,
  Wallet,
  type LucideIcon,
} from "lucide-react";

// ── i18n ─────────────────────────────────────────────────────────────────────

export const SUPPORTED_LOCALES = [
  "en",      // English
  "zh",      // Chinese (Simplified)
  "zh-TW",   // Chinese (Traditional)
  "ja",      // Japanese
  "ko",      // Korean
  "es",      // Spanish
  "fr",      // French
  "de",      // German
  "pt",      // Portuguese
  "ar",      // Arabic
  "hi",      // Hindi
  "ru",      // Russian
  "th",      // Thai
];

export const DEFAULT_LOCALE = "en";

/** Locales that use right-to-left script direction. */
export const RTL_LOCALES = new Set(["ar", "he", "fa", "ur"]);

/** Display labels for each locale — shown in the language switcher (always in the native language). */
export const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  zh: "简体中文",
  "zh-TW": "繁體中文",
  ja: "日本語",
  ko: "한국어",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  pt: "Português",
  ar: "العربية",
  hi: "हिन्दी",
  ru: "Русский",
  th: "ไทย",
};

// ── Nav ──────────────────────────────────────────────────────────────────────

export const NAV_LINKS = [
  { key: "features", label: "Features", href: "/#features" },
  { key: "useCases", label: "Use Cases", href: "/#use-cases" },
  { key: "architecture", label: "Architecture", href: "/#architecture" },
  { key: "security", label: "Security", href: "/#security" },
  { key: "pricing", label: "Pricing", href: "/pricing" },
  { key: "docs", label: "Docs", href: "https://docs.openlegion.ai" },
] as const;

export const APP_URL = "https://app.openlegion.ai";
export const PRICING_URL = "/pricing";
export const GITHUB_URL = "https://github.com/openlegion-ai/openlegion";
export const DOCS_URL = "https://docs.openlegion.ai";
export const DISCORD_URL = "https://discord.gg/mXNkjpDvvr";
export const TWITTER_URL = "https://x.com/openlegion";
export const DEMO_URL = "https://calendly.com/admin-openlegion/30min";

// ── Hero ─────────────────────────────────────────────────────────────────────

export const HERO = {
  subtitle:
    "Pick a fleet template — Content Studio, Sales Pipeline, Dev Team, Research Desk — or compose your own. OpenLegion deploys the stack with budgets, permissions, and vault-proxied credentials built in. From signup to running fleet in ~10 minutes on a dedicated VPS.",
  ctaPrimary: "Get Started",
  ctaSecondary: "Read the docs",
} as const;

// ── Use Cases (team templates) ───────────────────────────────────────────────

export interface UseCase {
  id: string;
  icon: LucideIcon;
  name: string;
  agents: string[];
  description: string;
}

export const USE_CASES: UseCase[] = [
  {
    id: "uc-engineering",
    icon: Code,
    name: "Your engineering team",
    agents: ["PM", "Engineer", "Reviewer"],
    description:
      "OpenLegion's Dev Team template automates task planning, code generation, and PR review. Ship features while your agent fleet handles the boilerplate.",
  },
  {
    id: "uc-sales",
    icon: TrendingUp,
    name: "Your sales team",
    agents: ["Researcher", "Qualifier", "Outreach"],
    description:
      "OpenLegion's Sales Pipeline template runs lead research, scoring, and personalized outreach — 24/7 without human babysitting.",
  },
  {
    id: "uc-content",
    icon: Pen,
    name: "Your content team",
    agents: ["Researcher", "Writer"],
    description:
      "OpenLegion's Content Studio template pairs a researcher and a writer to handle topic research and long-form drafts with consistent brand voice across every piece.",
  },
  {
    id: "uc-treasury",
    icon: Wallet,
    name: "Your treasury team",
    agents: ["Researcher", "Executor", "Monitor"],
    description:
      "Wallet-aware agents execute onchain — swaps, transfers, DeFi positions — while private keys stay locked in the vault and are signed server-side. Per-agent spend limits, daily caps, and EVM + Solana support.",
  },
  {
    id: "uc-custom",
    icon: Workflow,
    name: "Your custom team",
    agents: ["Any Role", "Any Tool", "Any Budget"],
    description:
      "Don't see your use case? Define any combination of roles, tools, and budgets. Agents get their own containers, credentials, and spending limits — whatever the job requires.",
  },
];

// ── Comparison ───────────────────────────────────────────────────────────────

export interface ComparisonRow {
  aspect: string;
  them: string;
  openlegion: string;
}

export const COMPARISON_ROWS: ComparisonRow[] = [
  {
    aspect: "API Key Storage",
    them: "In agent config files",
    openlegion: "Vault proxy — agents never see keys",
  },
  {
    aspect: "Agent Isolation",
    them: "Process-level",
    openlegion: "Docker containers / microVMs",
  },
  {
    aspect: "Cost Controls",
    them: "None",
    openlegion: "Per-agent daily & monthly budgets",
  },
  {
    aspect: "Task Routing",
    them: "LLM CEO agent decides",
    openlegion: "Fleet model — blackboard + pub/sub + handoff (no CEO agent)",
  },
  {
    aspect: "Test Coverage",
    them: "Minimal",
    openlegion: "5,800+ tests across 155 files (unit + integration + E2E)",
  },
  {
    aspect: "Codebase Size",
    them: "Hundreds of thousands of lines",
    openlegion: "~77,000 lines in src/ (engine, auditable)",
  },
];

// ── Architecture ─────────────────────────────────────────────────────────────

export const ARCHITECTURE = {
  title: "Defense-in-depth — trust zones at every layer",
  summary:
    "Your multi-agent fleet runs across four trust tiers — untrusted input, sandboxed agents, the trusted mesh, and a loopback-only internal tier. Agents only message each other through the mesh, gated by per-agent ACLs; the mesh holds the keys.",
  zones: [
    {
      name: "User Zone",
      trust: "Untrusted Input",
      color: "accent" as const,
      items: [
        "CLI / Telegram / Discord",
        "Slack / WhatsApp / Webhooks",
        "Sanitized via prompt-injection guards",
      ],
    },
    {
      name: "Mesh Host",
      trust: "Trusted (Zone 2)",
      color: "success" as const,
      items: [
        "FastAPI on :8420",
        "Blackboard (SQLite + WAL)",
        "PubSub + Message Router",
        "Credential Vault (API Proxy)",
        "ACL Matrix + Lane Router",
        "Browser Service :8500 (per-agent Camoufox)",
      ],
    },
    {
      name: "Agent Containers",
      trust: "Sandboxed (Zone 1)",
      color: "danger" as const,
      items: [
        "FastAPI :8400 (per container)",
        "Own /data volume",
        "Own memory DB (SQLite + vec)",
        "384MB RAM / 0.15 CPU default",
        "UID 1000, cap_drop=ALL, no-new-privileges, read-only FS",
      ],
    },
  ],
} as const;

// ── Quick Start ──────────────────────────────────────────────────────────────

export const QUICKSTART = {
  requirements:
    "Python 3.10+, Docker (running), an LLM API key (any of 15+ supported providers — Anthropic / OpenAI / Gemini / Mistral / Groq / DeepSeek / OpenRouter / etc.)",
  tabs: [
    {
      id: "unix",
      label: "macOS / Linux",
      code: `git clone https://github.com/openlegion-ai/openlegion.git && cd openlegion
./install.sh                     # checks deps, creates venv, makes CLI global
openlegion start                 # inline setup on first run, then launch agents`,
      lang: "bash",
    },
    {
      id: "windows",
      label: "Windows (PowerShell)",
      code: `git clone https://github.com/openlegion-ai/openlegion.git
cd openlegion
powershell -ExecutionPolicy Bypass -File install.ps1
openlegion start`,
      lang: "powershell",
    },
  ],
} as const;

// ── Security Layers ──────────────────────────────────────────────────────────

export interface SecurityLayer {
  number: number;
  title: string;
  description: string;
}

export const SECURITY_LAYERS: SecurityLayer[] = [
  {
    number: 1,
    title: "Each agent runs in its own container",
    description:
      "Docker containers or Docker Sandbox microVMs per agent — no shared process space.",
  },
  {
    number: 2,
    title: "Agents can't escalate privileges or consume your resources",
    description:
      "Non-root user (UID 1000), no-new-privileges flag, memory and CPU resource limits enforced.",
  },
  {
    number: 3,
    title: "API keys and wallet keys live in a vault the agent never touches",
    description:
      "Vault proxy holds API keys and wallet private keys — agents call through the proxy, never see secrets. Transactions are signed server-side.",
  },
  {
    number: 4,
    title: "Each agent only accesses what you explicitly allow",
    description:
      "Per-agent ACL matrix controls which tools, files, and mesh operations are allowed.",
  },
  {
    number: 5,
    title: "Malicious inputs blocked before they reach the LLM",
    description:
      "Path traversal prevention, SSRF protection (DNS pinning, RFC1918 + loopback + CGNAT blocking, fail-closed on DNS error), and per-agent daily/monthly USD budget enforcement.",
  },
  {
    number: 6,
    title: "Hidden characters stripped before prompt injection hits",
    description:
      "Invisible-character sanitization at every input boundary — bidi overrides, tag chars, and zero-width chars are stripped before reaching LLM context.",
  },
];

// ── Footer ───────────────────────────────────────────────────────────────────

export const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Use Cases", href: "/#use-cases" },
      { label: "Dashboard", href: "/#dashboard" },
      { label: "Security", href: "/#security" },
      { label: "Pricing", href: "/pricing" },
      { label: "Quick Start", href: "/#quickstart" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Learn",
    links: [
      { label: "AI Agent Platform", href: "/learn/ai-agent-platform" },
      { label: "AI Agent Orchestration", href: "/learn/ai-agent-orchestration" },
      { label: "AI Agent Frameworks", href: "/learn/ai-agent-frameworks" },
      { label: "AI Agent Security", href: "/learn/ai-agent-security" },
      { label: "DeepSeek V4 Agents", href: "/deepseek-v4-agents" },
    ],
  },
  {
    title: "Comparisons",
    links: [
      { label: "All Comparisons", href: "/comparison" },
      { label: "OpenClaw Alternative", href: "/openclaw-alternative" },
      { label: "vs OpenClaw", href: "/comparison/openclaw" },
      { label: "vs LangGraph", href: "/comparison/langgraph" },
      { label: "vs CrewAI", href: "/comparison/crewai" },
      { label: "vs AutoGen", href: "/comparison/autogen" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: DOCS_URL },
      { label: "GitHub", href: GITHUB_URL },
      { label: "Issues", href: `${GITHUB_URL}/issues` },
      { label: "Discussions", href: `${GITHUB_URL}/discussions` },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Discord", href: DISCORD_URL },
      { label: "Twitter / X", href: TWITTER_URL },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "PolyForm Perimeter License 1.0.1", href: `${GITHUB_URL}/blob/main/LICENSE` },
    ],
  },
] as const;

// ── FAQ ─────────────────────────────────────────────────────────────────────

export interface FAQItem {
  question: string;
  answer: string;
}

// All FAQ items — used by JSON-LD schema (must keep all for AEO)
export const ALL_FAQ_ITEMS: FAQItem[] = [
  {
    question: "Do I need to be a developer to use OpenLegion?",
    answer:
      "No. The managed hosting at app.openlegion.ai requires no coding — sign up, pick a template, add your LLM API key, and your agents are live in minutes. The self-hosted version requires Python 3.10+ and Docker. Either way, the built-in team templates (Dev Team, Sales Pipeline, Content Studio) work out of the box with no configuration needed.",
  },
  {
    question: "Do I pay for LLM usage on top of the subscription?",
    answer:
      "Every paid subscription includes a welcome bundle of LLM credits that never expire — use them from day one with no API keys needed. You can also bring your own API keys from Anthropic, OpenAI, Google, or any of 100+ supported providers and pay those providers directly with zero markup on model usage.",
  },
  {
    question: "What kinds of tasks can OpenLegion agents actually automate?",
    answer:
      "Any task a human performs on a computer with a browser or terminal. Agents can browse and interact with any website, log into web applications, fill out forms, extract data from any page, send emails and messages, manage files and folders, write and execute code, process documents, post to social platforms, monitor pages for changes, and run custom automations — all 24/7 without supervision. Common deployments include sales outreach pipelines, competitive research, lead qualification, developer workflows, invoice processing, content production, and internal task automation.",
  },
  {
    question: "What is OpenLegion?",
    answer:
      "OpenLegion is a production-grade, container-isolated multi-agent runtime that deploys autonomous agent fleets in isolated Docker containers. Each agent gets its own budget, permissions, and credential vault — with defense-in-depth via container isolation, vault proxy, per-agent ACLs, and bounded execution. It requires only Python, Docker, and an API key. No Redis, no Kubernetes, no LangChain. Licensed under PolyForm Perimeter License 1.0.1 (source-available).",
  },
  {
    question: "How is OpenLegion different from CrewAI or other agent frameworks?",
    answer:
      "OpenLegion container-isolates every agent, proxies all credentials through a vault, and enforces per-agent budgets — most frameworks don't. CrewAI and similar frameworks run agents in shared processes with no isolation, no cost controls, and API keys stored in config files. OpenLegion uses a fleet model (no CEO agent) with blackboard coordination and structured handoff — no LLM in the control plane deciding task routing.",
  },
  {
    question: "What LLM providers does OpenLegion support?",
    answer:
      "100+ LLM providers through LiteLLM. This includes Anthropic (Claude), OpenAI (GPT), Google (Gemini), Mistral, Moonshot, and any OpenAI-compatible API. You can assign different models to different agents in the same fleet — no vendor lock-in.",
  },
  {
    question: "How does OpenLegion handle API key security?",
    answer:
      "Through the vault proxy — agents never see API keys. Keys are held in the mesh process on the mesh host. When an agent calls an LLM, the request goes through a vault proxy that injects the credential at the network layer, tracks token usage, and enforces budget limits. Even a fully compromised agent cannot access your API keys.",
  },
  {
    question: "Do I need Kubernetes or cloud infrastructure to run OpenLegion?",
    answer:
      "No. OpenLegion runs on a single machine with no external services. You need only Python 3.10+, Docker, and an LLM API key — no Redis, no Kubernetes, no LangChain, no external databases.",
  },
  {
    question: "Can I run OpenLegion in production?",
    answer:
      "Yes — OpenLegion is designed for production deployment. It includes on-premises support, a fleet model with blackboard + pub/sub + handoff coordination, per-agent cost governance, a per-agent permission matrix, credential isolation via vault proxy, and an auditable codebase of ~77,000 lines with 5,800+ tests. Defense-in-depth controls are enabled by default.",
  },
  {
    question: "Can OpenLegion run on-premises?",
    answer:
      "Yes. The engine runs on a single machine with Python + Docker, no external services required. For fully local inference, point the LLM provider at Ollama; for hosted models (Anthropic, OpenAI, Google, etc.) the mesh proxy reaches out to whichever provider you configure. Mesh host, agents, vault, and dashboard all run on the same machine.",
  },
  {
    question: "What is an AI agent framework?",
    answer:
      "An AI agent framework is the runtime and library layer for deploying, coordinating, and governing autonomous AI agents in production. Unlike raw SDK libraries that only provide agent logic primitives, a framework like OpenLegion handles container isolation, credential vaulting, per-agent cost controls, observability, and deployment — so teams can ship agents without building DevOps from scratch.",
  },
  {
    question: "What is an AI agent framework vs managed hosting?",
    answer:
      "A framework is a code library and runtime for building and running agent logic — tools, prompts, memory, coordination. Managed hosting adds an operational layer on top: dedicated VPS provisioning, dashboard, billing, and credit proxy. OpenLegion is both: a Python framework (container-isolated multi-agent runtime) for authoring and running agents, and an optional managed hosting service for teams that don't want to manage infrastructure.",
  },
  {
    question: "How does agent coordination work in OpenLegion?",
    answer:
      "OpenLegion uses a fleet model — blackboard + pub/sub + handoff (no CEO agent). Agents coordinate through a SQLite-backed blackboard with atomic compare-and-set, a pub/sub event bus, and a structured handoff protocol. Each agent has its own permissions, budget, and tool set. Users talk to agents directly; there is no LLM in the control plane deciding task routing.",
  },
  {
    question: "What does AI agent security mean for autonomous agents?",
    answer:
      "AI agent security addresses the unique threats autonomous agents introduce: credential leakage, prompt injection, resource abuse, and data exfiltration. OpenLegion's defense-in-depth — container isolation, credential vault proxy, per-agent permission matrix, input sanitization, SSRF protection, and Unicode/path-traversal hardening — mitigates each threat independently, so a breach in one layer does not compromise the others.",
  },
];

// 5 visible FAQ items on homepage — the objection-killers
export const FAQ_ITEMS: FAQItem[] = ALL_FAQ_ITEMS.filter((item) =>
  [
    "Do I need to be a developer to use OpenLegion?",
    "What kinds of tasks can OpenLegion agents actually automate?",
    "Do I pay for LLM usage on top of the subscription?",
    "How does OpenLegion handle API key security?",
    "Can I run OpenLegion in production?",
  ].includes(item.question)
);
