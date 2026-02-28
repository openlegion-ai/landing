import {
  Shield,
  DollarSign,
  Brain,
  Workflow,
  Terminal,
  Globe,
  Wrench,
  Code,
  TrendingUp,
  Pen,
  Blocks,
  LayoutDashboard,
  Monitor,
  Plug,
  Building2,
  FileSearch,
  GitBranch,
  KeyRound,
  Wallet,
  UserCog,
  type LucideIcon,
} from "lucide-react";

// ── Nav ──────────────────────────────────────────────────────────────────────

export const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Use Cases", href: "#use-cases" },
  { label: "Architecture", href: "#architecture" },
  { label: "Security", href: "#security" },
  { label: "Quick Start", href: "#quickstart" },
  { label: "Docs", href: "https://docs.openlegion.ai" },
] as const;

export const GITHUB_URL = "https://github.com/openlegion-ai/openlegion";
export const DOCS_URL = "https://docs.openlegion.ai";
export const DISCORD_URL = "https://discord.gg/mXNkjpDvvr";
export const TWITTER_URL = "https://x.com/openlegion";

// ── Hero ─────────────────────────────────────────────────────────────────────

export const HERO = {
  badge: "Security-First  ·  Production-Ready",
  titleLine1: "The AI agent framework",
  titleAccent: "built for production.",
  subtitle:
    "Deploy autonomous agent fleets where every agent is container-isolated with its own budget, permissions, and secrets vault. No surprise bills. No leaked API keys. Self-hosted. Auditable. Enterprise-ready.",
  stats: [
    { value: 1607, label: "Tests Passing", suffix: "", prefix: "" },
    { value: 100, label: "LLM Providers", suffix: "+", prefix: "" },
    { value: 25, label: "Lines of Code", suffix: "k", prefix: "~" },
  ],
  ctaPrimary: "Start in 60 Seconds",
  ctaSecondary: "Star on GitHub",
} as const;

// ── Features ─────────────────────────────────────────────────────────────────

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  size: "large" | "medium" | "standard" | "wide";
}

export const FEATURES: Feature[] = [
  {
    icon: Shield,
    title: "Six Security Layers, Zero Trust",
    description:
      "Every agent is assumed compromised from day one. Container isolation, hardening, credential vault proxy, per-agent ACLs, input validation, and Unicode sanitization — all on by default.",
    size: "large",
  },
  {
    icon: DollarSign,
    title: "Per-Agent Cost Control",
    description:
      "Set daily and monthly budgets per agent. The vault tracks every token in real time and cuts off LLM calls before limits are exceeded.",
    size: "medium",
  },
  {
    icon: LayoutDashboard,
    title: "Fleet Dashboard",
    description:
      "See every agent, every cost, every event in real time. Live streaming, cost charts, chat panels, request traces, and embedded browser viewer.",
    size: "medium",
  },
  {
    icon: Workflow,
    title: "Deterministic Orchestration",
    description:
      "Define agent workflows in YAML with deterministic routing. No LLM deciding who does what — predictable, auditable execution every time.",
    size: "standard",
  },
  {
    icon: Monitor,
    title: "Built-In Browser Automation",
    description:
      "Persistent Chrome + KasmVNC browser with Patchright CDP control. Auto-recovery, visual screenshots, accessibility snapshots, and CAPTCHA solving included.",
    size: "standard",
  },
  {
    icon: Brain,
    title: "Persistent Agent Memory",
    description:
      "Agents remember across sessions with vector search, workspace files, and error learnings. Auto context management keeps token usage efficient.",
    size: "standard",
  },
  {
    icon: Plug,
    title: "MCP-Compatible Extensibility",
    description:
      "Connect any MCP tool server — databases, filesystems, APIs — via config. Tools are auto-discovered and exposed to agents alongside 44 built-in skills.",
    size: "standard",
  },
  {
    icon: Wrench,
    title: "Agents That Build Their Own Tools",
    description:
      "Agents write and hot-reload Python skills at runtime. Install community skills from git repos or build a custom skill marketplace.",
    size: "standard",
  },
  {
    icon: Terminal,
    title: "Zero External Dependencies",
    description:
      "No Redis, no Kubernetes, no LangChain. Pure Python + SQLite. Clone, install, run — one machine, 60 seconds, working fleet.",
    size: "standard",
  },
  {
    icon: Globe,
    title: "Agents That Work While You Sleep",
    description:
      "Deploy via Telegram, Discord, Slack, WhatsApp, CLI, or API. Trigger agents with cron, webhooks, or file watchers — fully autonomous operation.",
    size: "wide",
  },
];

// ── Use Cases (team templates) ───────────────────────────────────────────────

export interface UseCase {
  icon: LucideIcon;
  name: string;
  agents: string[];
  description: string;
}

export const USE_CASES: UseCase[] = [
  {
    icon: Code,
    name: "Dev Team",
    agents: ["PM", "Engineer", "Reviewer"],
    description:
      "Task planning, code generation, and PR review on autopilot. Ship features while your fleet handles the boilerplate.",
  },
  {
    icon: TrendingUp,
    name: "Sales Pipeline",
    agents: ["Researcher", "Qualifier", "Outreach"],
    description:
      "Lead research, scoring, and personalized outreach — running 24/7 without human babysitting.",
  },
  {
    icon: Pen,
    name: "Content Studio",
    agents: ["Researcher", "Writer", "Editor"],
    description:
      "Topic research, long-form drafts, and editorial review with consistent brand voice across every piece.",
  },
  {
    icon: Blocks,
    name: "Custom Fleet",
    agents: ["Your agents", "Your tools", "Your workflows"],
    description:
      "Build any team with YAML workflows, custom tool permissions, and per-agent budget limits.",
  },
];

// ── Comparison ───────────────────────────────────────────────────────────────

export interface ComparisonRow {
  aspect: string;
  them: string;
  openlegion: string;
}

export const COMPARISON_ALERT = {
  title: "Why teams switch from OpenClaw",
  description:
    "OpenClaw is the most popular agent framework (200K+ GitHub stars) — great for prototyping. In production, researchers found 42,000+ exposed instances with no auth, 341 malicious skills stealing user data, and a critical RCE vulnerability (CVE-2026-25253). No per-agent cost controls. API keys stored in agent config files.",
  source: "Bitsight Security Research, Feb 2026 · Koi Security / The Hacker News",
};

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
    openlegion: "1,607 tests across full E2E + unit",
  },
  {
    aspect: "Codebase Size",
    them: "430,000+ lines",
    openlegion: "~25,000 lines (auditable in a day)",
  },
];

// ── Architecture ─────────────────────────────────────────────────────────────

export const ARCHITECTURE = {
  title: "Three zones of defense",
  subtitle:
    "Nested isolation boundaries between your users, the coordinator, and untrusted agent code. Every layer enforced by default.",
  zones: [
    {
      name: "User Zone",
      trust: "Full Trust",
      color: "accent" as const,
      items: [
        "CLI / Telegram / Discord",
        "Slack / WhatsApp / API",
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
        "1GB RAM / 1 CPU cap",
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
    title: "Runtime Isolation",
    description:
      "Docker containers or Docker Sandbox microVMs per agent — no shared process space.",
  },
  {
    number: 2,
    title: "Container Hardening",
    description:
      "Non-root user (UID 1000), no-new-privileges flag, memory and CPU resource limits enforced.",
  },
  {
    number: 3,
    title: "Credential Separation",
    description:
      "Vault proxy holds all API keys — agents call through the proxy, never see secrets.",
  },
  {
    number: 4,
    title: "Permission Enforcement",
    description:
      "Per-agent ACL matrix controls which tools, files, and mesh operations are allowed.",
  },
  {
    number: 5,
    title: "Input Validation",
    description:
      "Path traversal prevention, safe condition evaluation, token budget enforcement.",
  },
  {
    number: 6,
    title: "Unicode Sanitization",
    description:
      "Invisible character stripping at three choke points — bidi overrides, tag chars, zero-width chars blocked before reaching LLM context.",
  },
];

// ── Enterprise ──────────────────────────────────────────────────────────────

export interface EnterpriseFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const ENTERPRISE_FEATURES: EnterpriseFeature[] = [
  {
    icon: Building2,
    title: "On-Premises Deployment",
    description:
      "Run the entire stack on your own infrastructure. No data leaves your network — full air-gap support for regulated environments.",
  },
  {
    icon: FileSearch,
    title: "Audit-Ready Codebase",
    description:
      "~25,000 lines of Python with 1,607+ tests. Small enough for a single security engineer to audit in a day — no hidden dependencies.",
  },
  {
    icon: GitBranch,
    title: "Deterministic Workflows",
    description:
      "YAML-defined task routing with no LLM decision-making in the control plane. Every execution path is predictable, repeatable, and auditable.",
  },
  {
    icon: KeyRound,
    title: "Credential Isolation",
    description:
      "Vault proxy architecture ensures agents never see API keys or secrets. Meets SOC 2 credential separation requirements out of the box.",
  },
  {
    icon: Wallet,
    title: "Per-Agent Cost Governance",
    description:
      "Set daily and monthly budgets per agent with real-time tracking. No surprise bills — automatic cutoff before limits are exceeded.",
  },
  {
    icon: UserCog,
    title: "Role-Based Access",
    description:
      "Per-agent ACL matrix controls which tools, files, and operations each agent can access. Enforce least-privilege across your entire fleet.",
  },
];

// ── Footer ───────────────────────────────────────────────────────────────────

export const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Use Cases", href: "#use-cases" },
      { label: "Architecture", href: "#architecture" },
      { label: "Security", href: "#security" },
      { label: "Enterprise", href: "#enterprise" },
      { label: "Quick Start", href: "#quickstart" },
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
      { label: "BSL 1.1 License", href: `${GITHUB_URL}/blob/main/LICENSE` },
    ],
  },
] as const;

// ── FAQ ─────────────────────────────────────────────────────────────────────

export interface FAQItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What is OpenLegion?",
    answer:
      "OpenLegion is a production-grade AI agent framework that deploys autonomous agent fleets in isolated Docker containers. Each agent gets its own budget, permissions, and secrets vault — with six security layers enabled by default.",
  },
  {
    question: "How is OpenLegion different from CrewAI or other agent frameworks?",
    answer:
      "Most agent frameworks run agents in shared processes with no isolation, no cost controls, and API keys stored in config files. OpenLegion container-isolates every agent, proxies all credentials through a vault (agents never see API keys), enforces per-agent budgets, and uses deterministic YAML workflows instead of letting an LLM decide task routing.",
  },
  {
    question: "What LLM providers does OpenLegion support?",
    answer:
      "OpenLegion supports 100+ LLM providers through LiteLLM, including Anthropic (Claude), OpenAI (GPT), Google (Gemini), Mistral, Moonshot, and any OpenAI-compatible API. You can use different models for different agents in the same fleet.",
  },
  {
    question: "How does OpenLegion handle API key security?",
    answer:
      "API keys are stored in a vault on the mesh host — agents never see them directly. When an agent needs to call an LLM, the request goes through a vault proxy that injects credentials, tracks token usage, and enforces budget limits. Even a fully compromised agent cannot access your API keys.",
  },
  {
    question: "Do I need Kubernetes or cloud infrastructure to run OpenLegion?",
    answer:
      "No. OpenLegion requires only Python 3.10+, Docker, and an LLM API key. It runs on a single machine with zero external dependencies — no Redis, no Kubernetes, no LangChain. Clone, install, and run your first fleet in under 60 seconds.",
  },
  {
    question: "Is OpenLegion enterprise-ready?",
    answer:
      "Yes. OpenLegion is designed for enterprise deployment with on-premises support, deterministic YAML workflows, per-agent cost governance, role-based access controls, credential isolation via vault proxy, and an audit-ready codebase of ~25,000 lines with 1,607+ tests. All security layers are enabled by default.",
  },
  {
    question: "Can OpenLegion run on-premises in air-gapped environments?",
    answer:
      "Yes. OpenLegion runs entirely on your own infrastructure with no external dependencies beyond Docker and Python. No data leaves your network. The full stack — coordinator, agents, vault, and dashboard — runs on a single machine, making it suitable for air-gapped and regulated environments.",
  },
];
