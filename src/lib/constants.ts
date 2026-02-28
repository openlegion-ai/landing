import {
  Shield,
  DollarSign,
  Container,
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
  type LucideIcon,
} from "lucide-react";

// ── Nav ──────────────────────────────────────────────────────────────────────

export const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Use Cases", href: "#use-cases" },
  { label: "Architecture", href: "#architecture" },
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
    "Deploy autonomous agent fleets where every agent is container-isolated with its own budget, permissions, and secrets vault. No surprise bills. No leaked API keys.",
  stats: [
    { value: 1276, label: "Tests Passing", suffix: "", prefix: "" },
    { value: 100, label: "LLM Providers", suffix: "+", prefix: "" },
    { value: 21, label: "Lines of Code", suffix: "k", prefix: "~" },
  ],
  ctaPrimary: "Start in 60 Seconds",
  ctaSecondary: "Star on GitHub",
} as const;

// ── Features ─────────────────────────────────────────────────────────────────

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  large?: boolean;
}

export const FEATURES: Feature[] = [
  {
    icon: Shield,
    title: "Six Security Layers, Zero Trust",
    description:
      "Every agent is assumed compromised from day one. Runtime isolation, container hardening, credential vault proxy, per-agent ACLs, input validation, and Unicode sanitization — all on by default.",
    large: true,
  },
  {
    icon: DollarSign,
    title: "Per-Agent Cost Control",
    description:
      "Set daily and monthly budgets per agent. The vault layer tracks every token in real time and cuts off LLM calls before limits are exceeded. You control the spend, not the agents.",
    large: true,
  },
  {
    icon: LayoutDashboard,
    title: "Fleet Dashboard",
    description:
      "See every agent, every cost, every event in real time. Live streaming, cost charts, chat panels, request traces, and embedded browser viewer — all from one screen.",
  },
  {
    icon: Container,
    title: "Container Isolation",
    description:
      "Each agent runs in its own Docker container with capped RAM, CPU, and storage. Non-root, no shared state. Optional microVM support for deeper isolation.",
  },
  {
    icon: Workflow,
    title: "Deterministic Orchestration",
    description:
      "Define agent workflows in YAML with deterministic routing. No LLM deciding who does what — predictable, auditable execution every time.",
  },
  {
    icon: Monitor,
    title: "Built-In Browser Automation",
    description:
      "Playwright, stealth Camoufox, anti-detect, or persistent KasmVNC sessions. Auto-recovery, visual screenshots, and accessibility snapshots included.",
  },
  {
    icon: Brain,
    title: "Persistent Agent Memory",
    description:
      "Agents remember across sessions with vector search, workspace files, and error learnings. Auto context management keeps token usage efficient.",
  },
  {
    icon: Globe,
    title: "Agents That Work While You Sleep",
    description:
      "Deploy via Telegram, Discord, Slack, WhatsApp, CLI, or API. Trigger agents with cron, webhooks, or file watchers — fully autonomous operation.",
  },
  {
    icon: Plug,
    title: "MCP-Compatible Extensibility",
    description:
      "Connect any MCP tool server — databases, filesystems, APIs — via config. Tools are auto-discovered and exposed to agents alongside 40 built-in skills.",
  },
  {
    icon: Wrench,
    title: "Agents That Build Their Own Tools",
    description:
      "Agents write and hot-reload Python skills at runtime. Install community skills from git repos or build a custom skill marketplace.",
  },
  {
    icon: Terminal,
    title: "Zero External Dependencies",
    description:
      "No Redis, no Kubernetes, no LangChain. Pure Python + SQLite. Clone, install, run — one machine, 60 seconds, working fleet.",
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
    openlegion: "1,276 tests across full E2E + unit",
  },
  {
    aspect: "Codebase Size",
    them: "430,000+ lines",
    openlegion: "~21,000 lines (auditable in a day)",
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
        "512MB RAM / 0.5 CPU cap",
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

// ── Footer ───────────────────────────────────────────────────────────────────

export const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Use Cases", href: "#use-cases" },
      { label: "Architecture", href: "#architecture" },
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
