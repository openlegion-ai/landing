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

// ── Hero ─────────────────────────────────────────────────────────────────────

export const HERO = {
  badge: "Open Source  ·  Security-First  ·  BSL 1.1 Licensed",
  titleLine1: "Deploy autonomous AI",
  titleAccent: "agent fleets",
  subtitle:
    "Every agent sandboxed in its own Docker container with its own budget, permissions, and memory. No shared secrets, no surprise bills, no black-box routing. Built from day one assuming agents will be compromised.",
  stats: [
    { value: 1124, label: "Tests Passing", suffix: "", prefix: "" },
    { value: 100, label: "LLM Providers", suffix: "+", prefix: "" },
    { value: 19, label: "Lines — Auditable in a Day", suffix: "k", prefix: "~" },
  ],
  ctaPrimary: "Star on GitHub",
  ctaSecondary: "Get Started",
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
    title: "Defense-in-Depth Security",
    description:
      "Six security layers: runtime isolation, container hardening, credential vault proxy, per-agent ACLs, input validation, and Unicode sanitization. Built assuming agents will be compromised.",
    large: true,
  },
  {
    icon: DollarSign,
    title: "Per-Agent Cost Control",
    description:
      "Daily and monthly budget enforcement at the vault layer. Real-time token tracking with automatic cutoffs before any LLM call is proxied. No surprise bills.",
    large: true,
  },
  {
    icon: Container,
    title: "Container Isolation",
    description:
      "Each agent in its own Docker container — 512MB RAM, 0.5 CPU cap, own /data volume, non-root user. Optional Docker Sandbox microVM support.",
  },
  {
    icon: Workflow,
    title: "Deterministic Orchestration",
    description:
      "YAML-defined DAG workflows with deterministic routing. No LLM deciding who does what — predictable, auditable execution every time.",
  },
  {
    icon: Brain,
    title: "5-Layer Memory System",
    description:
      "Salience tracking, SQLite + vector search, workspace files, learnings from errors, and auto context management with proactive flush at 60%.",
  },
  {
    icon: Globe,
    title: "6-Channel Autonomous Operation",
    description:
      "Telegram, Discord, Slack, WhatsApp, CLI, and API. Autonomous via cron, heartbeats, webhooks, and file watchers — agents work while you sleep.",
  },
  {
    icon: Wrench,
    title: "Self-Extending Agents",
    description:
      "Agents write their own Python skills and hot-reload at runtime. 38 built-in tools: browser automation, file I/O, semantic memory search, and more.",
  },
  {
    icon: Terminal,
    title: "Zero External Dependencies",
    description:
      "No Redis, no Kubernetes, no LangChain. Pure Python + SQLite. Clone, install, run — under 60 seconds to a working fleet on a single machine.",
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
      "Automated task planning, code generation, and PR review. Ship features while your fleet handles the boilerplate.",
  },
  {
    icon: TrendingUp,
    name: "Sales Pipeline",
    agents: ["Researcher", "Qualifier", "Outreach"],
    description:
      "Lead research, qualification scoring, and personalized outreach — running 24/7 without human babysitting.",
  },
  {
    icon: Pen,
    name: "Content Studio",
    agents: ["Researcher", "Writer", "Editor"],
    description:
      "Topic research, long-form draft generation, and editorial review with consistent brand voice.",
  },
  {
    icon: Blocks,
    name: "Custom Fleet",
    agents: ["Your agents", "Your tools", "Your workflows"],
    description:
      "Define any team with custom YAML workflows, tool permissions, and budget limits per agent.",
  },
];

// ── Comparison ───────────────────────────────────────────────────────────────

export interface ComparisonRow {
  aspect: string;
  them: string;
  openlegion: string;
}

export const COMPARISON_ALERT = {
  title: "Why teams switch to OpenLegion",
  description:
    "Popular agent frameworks like OpenClaw, NanoClaw, ZeroClaw, and MemuBot run agents with full access to credentials and no resource isolation. OpenClaw alone has 42,000+ exposed instances with no authentication, 341 malicious skills in the wild, and CVE-2026-25253 granting unauthenticated RCE.",
  source: "Bitsight Security Research, 2026",
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
    openlegion: "1,124 tests across full E2E + unit",
  },
  {
    aspect: "Codebase Size",
    them: "100,000–430,000+ lines",
    openlegion: "~19,000 lines (auditable in a day)",
  },
];

// ── Architecture ─────────────────────────────────────────────────────────────

export const ARCHITECTURE = {
  title: "Security architecture you can trust",
  subtitle:
    "Three nested isolation zones — designed from day one assuming agents will be compromised.",
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
    title: "Legal",
    links: [
      { label: "BSL 1.1 License", href: `${GITHUB_URL}/blob/main/LICENSE` },
    ],
  },
] as const;
