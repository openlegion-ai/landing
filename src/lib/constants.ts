import {
  Workflow,
  Code,
  TrendingUp,
  Pen,
  type LucideIcon,
} from "lucide-react";

// ── Nav ──────────────────────────────────────────────────────────────────────

export const NAV_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "Use Cases", href: "/#use-cases" },
  { label: "Architecture", href: "/#architecture" },
  { label: "Security", href: "/#security" },
  { label: "Pricing", href: "/pricing" },
  { label: "Docs", href: "https://docs.openlegion.ai" },
] as const;

export const APP_URL = "https://app.openlegion.ai";
export const GITHUB_URL = "https://github.com/openlegion-ai/openlegion";
export const DOCS_URL = "https://docs.openlegion.ai";
export const DISCORD_URL = "https://discord.gg/mXNkjpDvvr";
export const TWITTER_URL = "https://x.com/openlegion";

// ── Hero ─────────────────────────────────────────────────────────────────────

export const HERO = {
  badge: "Your AI workforce starts here",
  subtitle:
    "Give each agent a job and a budget — they work 24/7 while your keys stay locked in a vault they never touch.",
  subtitleSecond:
    "Anything a human does, your agents do around the clock.",
  pricingAnchor: "Starts at $19/month · Your API keys · 100+ LLM providers · No usage markup · No vendor lock-in",
  ctaPrimary: "Deploy your first AI agent →",
  ctaSecondary: "Read the Docs",
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
    agents: ["Researcher", "Writer", "Editor"],
    description:
      "OpenLegion's Content Studio template handles topic research, long-form drafts, and editorial review with consistent brand voice across every piece.",
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
    openlegion: "Deterministic YAML DAG",
  },
  {
    aspect: "Test Coverage",
    them: "Minimal",
    openlegion: "2,100+ tests across unit + integration + E2E",
  },
  {
    aspect: "Codebase Size",
    them: "430,000+ lines",
    openlegion: "~30,000 lines (engine, auditable)",
  },
];

// ── Architecture ─────────────────────────────────────────────────────────────

export const ARCHITECTURE = {
  title: "Three zones of protection",
  summary:
    "Your multi-agent fleet runs in three isolated zones — user, coordinator, and sandboxed containers. Nothing any agent touches can reach your API keys, other agents, or the host machine.",
  zones: [
    {
      name: "User Zone",
      trust: "Full Trust",
      color: "accent" as const,
      items: [
        "CLI / Telegram / Discord",
        "Slack / WhatsApp / Webhooks",
        "Direct agent communication",
      ],
    },
    {
      name: "Mesh Host",
      trust: "Trusted Coordinator",
      color: "success" as const,
      items: [
        "FastAPI on :8420",
        "Blackboard (SQLite)",
        "PubSub + Message Router",
        "Credential Vault (API Proxy)",
        "Orchestrator + Permission Matrix",
        "Container Manager + Cost Tracker",
      ],
    },
    {
      name: "Agent Containers",
      trust: "Untrusted / Sandboxed",
      color: "danger" as const,
      items: [
        "FastAPI :8400+ each",
        "Own /data volume",
        "Own memory DB (SQLite + vec)",
        "384MB RAM / 0.15 CPU default",
        "Non-root, no-new-privileges",
      ],
    },
  ],
} as const;

// ── Quick Start ──────────────────────────────────────────────────────────────

export const QUICKSTART = {
  requirements:
    "Python 3.10+, Docker (running), an LLM API key (Anthropic / Moonshot / OpenAI)",
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
    title: "API keys live in a vault the agent never touches",
    description:
      "Vault proxy holds all API keys — agents call through the proxy, never see secrets.",
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
      "Path traversal prevention, SSRF protection, safe condition evaluation, token budget enforcement.",
  },
  {
    number: 6,
    title: "Hidden characters stripped before prompt injection hits",
    description:
      "Invisible character stripping at 56 choke points — bidi overrides, tag chars, zero-width chars blocked before reaching LLM context.",
  },
];

// ── Footer ───────────────────────────────────────────────────────────────────

export const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Use Cases", href: "/#use-cases" },
      { label: "Architecture", href: "/#architecture" },
      { label: "Security", href: "/#security" },
      { label: "Enterprise", href: "/#enterprise" },
      { label: "Pricing", href: "/pricing" },
      { label: "Quick Start", href: "/#quickstart" },
    ],
  },
  {
    title: "Learn",
    links: [
      { label: "AI Agent Platform", href: "/ai-agent-platform" },
      { label: "AI Agent Orchestration", href: "/ai-agent-orchestration" },
      { label: "AI Agent Frameworks", href: "/ai-agent-frameworks" },
      { label: "AI Agent Security", href: "/ai-agent-security" },
      { label: "DeepSeek V4 Agents", href: "/deepseek-v4-agents" },
    ],
  },
  {
    title: "Comparisons",
    links: [
      { label: "All Comparisons", href: "/comparison" },
      { label: "OpenClaw Alternative", href: "/openclaw-alternative" },
      { label: "vs OpenClaw", href: "/comparison/openclaw" },
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
      { label: "BSL 1.1 License", href: `${GITHUB_URL}/blob/main/LICENSE` },
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
      "The managed hosting at app.openlegion.ai requires no coding — pick a template, add your LLM API key, and your agents are live in minutes. The self-hosted version requires Python 3.10+ and Docker. Either way, the built-in team templates (Dev Team, Sales Pipeline, Content Studio) work out of the box with no configuration needed.",
  },
  {
    question: "Do I pay for LLM usage on top of the subscription?",
    answer:
      "Yes — you bring your own API keys from Anthropic, OpenAI, Google, or any of 100+ supported providers. You pay providers directly at their published rates. OpenLegion charges for the platform and infrastructure only. There is zero markup on model usage.",
  },
  {
    question: "What kinds of tasks can OpenLegion agents actually automate?",
    answer:
      "Any task a human performs on a computer with a browser or terminal. Agents can browse and interact with any website, log into web applications, fill out forms, extract data from any page, send emails and messages, manage files and folders, write and execute code, process documents, post to social platforms, monitor pages for changes, and run custom automations — all 24/7 without supervision. Common deployments include sales outreach pipelines, competitive research, lead qualification, developer workflows, invoice processing, content production, and internal task automation.",
  },
  {
    question: "What is OpenLegion?",
    answer:
      "OpenLegion is a production-grade AI agent framework and platform that deploys autonomous agent fleets in isolated Docker containers. Each agent gets its own budget, permissions, and secrets vault — with six security layers enabled by default. It requires only Python, Docker, and an API key. No Redis, no Kubernetes, no LangChain. Licensed under BSL 1.1 (source-available).",
  },
  {
    question: "How is OpenLegion different from CrewAI or other agent frameworks?",
    answer:
      "OpenLegion container-isolates every agent, proxies all credentials through a vault, and enforces per-agent budgets — most frameworks don't. CrewAI and similar frameworks run agents in shared processes with no isolation, no cost controls, and API keys stored in config files. OpenLegion uses deterministic YAML workflows instead of letting an LLM decide task routing, making execution predictable and auditable.",
  },
  {
    question: "What LLM providers does OpenLegion support?",
    answer:
      "100+ LLM providers through LiteLLM. This includes Anthropic (Claude), OpenAI (GPT), Google (Gemini), Mistral, Moonshot, and any OpenAI-compatible API. You can assign different models to different agents in the same fleet — no vendor lock-in.",
  },
  {
    question: "How does OpenLegion handle API key security?",
    answer:
      "Through blind credential injection — agents never see API keys. Keys are stored in a vault on the mesh host. When an agent calls an LLM, the request goes through a vault proxy that injects the credential at the network layer, tracks token usage, and enforces budget limits. Even a fully compromised agent cannot access your API keys.",
  },
  {
    question: "Do I need Kubernetes or cloud infrastructure to run OpenLegion?",
    answer:
      "No. OpenLegion runs on a single machine with no external services. You need only Python 3.10+, Docker, and an LLM API key — no Redis, no Kubernetes, no LangChain, no external databases.",
  },
  {
    question: "Is OpenLegion enterprise-ready?",
    answer:
      "Yes — OpenLegion is designed for enterprise deployment. It includes on-premises support (including air-gapped environments), deterministic YAML workflows, per-agent cost governance, role-based access controls, credential isolation via vault proxy, and an audit-ready codebase of ~30,000 lines with 2,100+ tests. All security layers are enabled by default.",
  },
  {
    question: "Can OpenLegion run on-premises in air-gapped environments?",
    answer:
      "Yes. The full stack runs entirely on your own infrastructure with no external dependencies beyond Docker and Python. No data leaves your network. The coordinator, agents, vault, and dashboard all run on a single machine, making it suitable for air-gapped, regulated, and on-premises environments.",
  },
  {
    question: "What is an AI agent platform?",
    answer:
      "An AI agent platform is managed infrastructure for deploying, orchestrating, and governing autonomous AI agents in production. Unlike raw framework libraries that only provide agent logic primitives, a platform handles container isolation, credential vaulting, per-agent cost controls, observability, and deployment — so teams can ship agents without building DevOps from scratch.",
  },
  {
    question: "What is an AI agent framework vs an agent platform?",
    answer:
      "A framework is a code library for building agent logic — tools, prompts, memory, and chains. A platform adds operational infrastructure on top: container isolation, credential vaults, per-agent budgets, deployment pipelines, and fleet-wide observability. OpenLegion is both: a Python framework for authoring agents and a self-hosted platform for running them in production with security and cost governance built in.",
  },
  {
    question: "How does AI agent orchestration work in OpenLegion?",
    answer:
      "OpenLegion uses deterministic YAML DAG workflows — no LLM sits in the control plane deciding who does what. You define task graphs with sequential and parallel execution patterns, coordinated through a centralized Blackboard and pub/sub messaging. The orchestrator routes tasks based on the DAG definition, making every execution path predictable, repeatable, and auditable. Fleet model, not hierarchy — agents execute their assigned steps and report results back to the coordinator.",
  },
  {
    question: "What does AI agent security mean for autonomous agents?",
    answer:
      "AI agent security addresses the unique threats autonomous agents introduce: credential leakage, prompt injection, resource abuse, and data exfiltration. OpenLegion's six-layer defense — runtime isolation, container hardening, credential separation, permission enforcement, input validation, and Unicode sanitization — mitigates each threat independently, so a breach in one layer does not compromise the others.",
  },
];

// 5 visible FAQ items on homepage — the objection-killers
export const FAQ_ITEMS: FAQItem[] = ALL_FAQ_ITEMS.filter((item) =>
  [
    "Do I need to be a developer to use OpenLegion?",
    "What kinds of tasks can OpenLegion agents actually automate?",
    "Do I pay for LLM usage on top of the subscription?",
    "How does OpenLegion handle API key security?",
    "Is OpenLegion enterprise-ready?",
  ].includes(item.question)
);
