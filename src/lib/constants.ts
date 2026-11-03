import {
  Workflow,
  Code,
  TrendingUp,
  Pen,
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
  { key: "architecture", label: "Architecture", href: "/learn/ai-agent-orchestration" },
  { key: "security", label: "Security", href: "/security" },
  { key: "pricing", label: "Pricing", href: "/pricing" },
  { key: "docs", label: "v1 docs", href: "https://docs.openlegion.ai" },
] as const;

export const APP_URL = "https://app.openlegion.ai";
export const PRICING_URL = "/pricing";
// Sign-up is waitlist-only until the v2 platform opens. The legacy app's
// sign-in page is the waitlist: signing in with Google joins it (nothing is
// charged) and existing customers can still manage their account.
export const WAITLIST_URL = `${APP_URL}/signin`;
export const GITHUB_URL = "https://github.com/openlegion-ai/openlegion";
export const DOCS_URL = "https://docs.openlegion.ai";
export const DISCORD_URL = "https://discord.gg/mXNkjpDvvr";
export const TWITTER_URL = "https://x.com/openlegion";
export const DEMO_URL = "https://calendly.com/admin-openlegion/30min";

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
      "Ask for a delivery desk and you get agents that triage what comes in, plan the work, run code in a sandbox, and hand the result back for review.",
  },
  {
    id: "uc-sales",
    icon: TrendingUp,
    name: "Your sales team",
    agents: ["Researcher", "Qualifier", "Outreach"],
    description:
      "Research a list, score it against criteria you wrote, and draft the follow-ups — on a schedule, with your approval before anything leaves the workspace.",
  },
  {
    id: "uc-content",
    icon: Pen,
    name: "Your content team",
    agents: ["Researcher", "Writer"],
    description:
      "A researcher and a writer working to your brief and your voice: sources gathered, draft written, finished piece handed back as a file you can share with a link.",
  },
  {
    id: "uc-custom",
    icon: Workflow,
    name: "Your custom team",
    agents: ["Any role", "Any tool", "Any budget"],
    description:
      "Describe any combination of roles, tools, and budgets. Every agent gets its own thread, its own permissions, and its own spending limit.",
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
    aspect: "API key storage",
    them: "In agent config files",
    openlegion: "Vault + broker — the model only ever sees a handle",
  },
  {
    aspect: "Code execution",
    them: "Your own process",
    openlegion: "Firecracker microVM sandbox, deny-all egress by default",
  },
  {
    aspect: "Cost controls",
    them: "None",
    openlegion: "Per-agent budgets and a receipt for every action",
  },
  {
    aspect: "Coordination",
    them: "An LLM in the middle decides",
    openlegion: "Goals and tasks in one database; the assistant delegates, deadlines escalate",
  },
  {
    aspect: "Irreversible actions",
    them: "Run, then tell you",
    openlegion: "Stop for an approval card at three walls",
  },
  {
    aspect: "Setup",
    them: "Python, Docker, config files",
    openlegion: "Sign in with Google — nothing to install",
  },
];

// ── Architecture ─────────────────────────────────────────────────────────────

export const ARCHITECTURE = {
  title: "Agents are records. Work runs on demand, then stops.",
  summary:
    "An agent is a row in a database, not a server. When a message, a schedule, or another agent gives it work, a single run starts under a lease, goes through one policy engine for every tool call, writes its receipts, and ends.",
  zones: [
    {
      name: "What arrives",
      trust: "Untrusted",
      color: "accent" as const,
      items: [
        "Slack · Telegram · email · webhooks",
        "Web pages and search results",
        "Files and connector data",
        "Labelled untrusted, end to end",
      ],
    },
    {
      name: "The platform",
      trust: "Policy and receipts",
      color: "success" as const,
      items: [
        "Agents, tasks, memory, receipts — one database",
        "Policy engine — every tool call is an intent",
        "Credential vault + broker",
        "Approval cards, decided by a human",
        "Per-minute scheduler and event dispatch",
      ],
    },
    {
      name: "One task run",
      trust: "Sandboxed",
      color: "danger" as const,
      items: [
        "Starts on demand, ends when the task is done",
        "Fenced lease for the length of the run",
        "Code sandbox with deny-all egress",
        "Budget reserved before the first step",
      ],
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
    title: "Every tool call is checked before it runs",
    description:
      "Every tool call is an intent, policy-checked before execution, with a receipt the owner can read.",
  },
  {
    number: 2,
    title: "Secrets stay in a vault",
    description:
      "Secrets live in a vault; brokered credentials are injected outside the model, which sees a handle.",
  },
  {
    number: 3,
    title: "Code runs in a sealed sandbox",
    description:
      "Code runs in a Firecracker microVM sandbox with explicit deny-all egress and a wake-bound lease.",
  },
  {
    number: 4,
    title: "Untrusted content can't act on its own",
    description:
      "Content that arrives from the web, email, Slack or connectors is tracked as untrusted and cannot cause an external send, a deletion or an irreversible action without an owner's approval card.",
  },
  {
    number: 5,
    title: "One workspace can never read another",
    description:
      "Tenant isolation is row-level security on every table, verified by a cross-tenant test suite in CI.",
  },
  {
    number: 6,
    title: "Only a human approves",
    description:
      "Approvals are asynchronous rows decided only by a workspace owner or admin; an agent cannot approve itself.",
  },
  {
    number: 7,
    title: "Every inbound message is verified",
    description:
      "Stripe, Slack, Telegram and generic webhooks are signature-verified; production refuses to boot without its secrets.",
  },
  {
    number: 8,
    title: "Your conversations are not training data",
    description:
      "Model traffic on our platform keys is zero-retention and opted out of training.",
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
      { label: "Security", href: "/security" },
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
      { label: "v1 docs", href: DOCS_URL },
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
    question:
      "Do I need to be a developer to use OpenLegion?",
    answer:
      "No. Sign in with Google, say what you need in one sentence, and your assistant staffs the team and starts the work. There is nothing to install and no configuration file to write. You will be asked to approve the first action that reaches outside your workspace — that card is the whole learning curve.",
  },
  {
    question:
      "Do I pay for LLM usage on top of the subscription?",
    answer:
      "No. Model usage is drawn from credits, and every plan includes an allowance: 1,000 credits once on Free, 10,000 a month on Pro, 35,000 on Team. One credit costs $0.001. When the allowance runs out you can buy a credit pack at the same rate, and purchased credits never expire.",
  },
  {
    question:
      "What kinds of tasks can OpenLegion agents actually automate?",
    answer:
      "Research and summarising, drafting and rewriting, watching a channel and replying, keeping a schedule, running code in a sandbox, and producing a deliverable you can share with a link. Agents work in the web app, in Slack and Telegram, over inbound email, and through webhooks, and they can read your Google Calendar and the Drive files you pick. What they do not do yet: browse the web signed in as you, make phone calls, or send email on your behalf.",
  },
  {
    question:
      "What is OpenLegion?",
    answer:
      "OpenLegion is a hosted platform for AI agent teams. You describe the work in one sentence; an assistant creates the teammates it needs and delegates to them. Each agent is a durable record that runs when there is something to do, so an idle agent costs nothing. Every tool call is checked by one policy engine and leaves a receipt, and anything that reaches a third party, deletes data, or acts on untrusted content stops for your approval.",
  },
  {
    question:
      "How is OpenLegion different from CrewAI or other agent frameworks?",
    answer:
      "Frameworks give you the parts; OpenLegion is the running product. You do not assemble a runtime, a queue, a vault, and a dashboard — you sign in and describe the job. Where a framework leaves permissions and cost to you, OpenLegion enforces them: every tool call is an intent through one policy engine, every agent has a budget, secrets stay in a vault the model never sees, and irreversible actions wait for a human.",
  },
  {
    question:
      "What LLM providers does OpenLegion support?",
    answer:
      "You choose a preset, not a model id: Smartest for work you would hand to your best person, Smart for everyday reasoning, Normal for fast, cheap chores. Presets map to current frontier models from Anthropic, OpenAI, and Google, reached through a single gateway, and you can set a preset per agent or a default for the workspace. Traffic on our platform keys is zero-retention and opted out of training.",
  },
  {
    question:
      "How does OpenLegion handle API key security?",
    answer:
      "Credentials live in a vault and are injected outside the model: the agent holds a handle, never a key. Every tool call is an intent that the policy engine checks before anything executes, and the result is recorded as a receipt you can read. A compromised prompt cannot read a secret that was never in its context.",
  },
  {
    question:
      "Do I need Kubernetes or cloud infrastructure to run OpenLegion?",
    answer:
      "No. OpenLegion is a hosted web app — sign in with Google and you are running. There is no server to provision, no Docker, and no infrastructure of your own to keep alive. Agents are records in our database and each task runs on demand, so a workspace with a hundred agents costs the same at rest as one with none.",
  },
  {
    question:
      "Can I run OpenLegion in production?",
    answer:
      "Yes — that is what it is for. Tenant isolation is row-level security on every table, verified by a cross-tenant test suite in CI. Every tool call is policy-checked and receipted, agents run under per-agent budgets, and irreversible actions stop for a human. Team and Enterprise add audit export, shared workspace memory, and unlimited history.",
  },
  {
    question:
      "Can OpenLegion run on-premises?",
    answer:
      "Not today. OpenLegion v2 is a hosted platform, and self-hosting is not something you can buy. The previous-generation engine is still published under the PolyForm Perimeter License 1.0.1 and can be run on your own machine, but it is a different product. If on-premises is a hard requirement, it is an Enterprise conversation.",
  },
  {
    question:
      "What is an AI agent framework?",
    answer:
      "An AI agent framework is the runtime and library layer for building, coordinating, and governing autonomous AI agents. It supplies the loop, the tool calls, memory, and coordination, and leaves security, cost control, and operations to you. OpenLegion ships those as the product rather than the exercise: policy-checked tool calls, per-agent budgets, a credential vault, approvals, and receipts.",
  },
  {
    question:
      "What is an AI agent framework vs managed hosting?",
    answer:
      "A framework is a library you build with; a hosted platform is a product you sign in to. With a framework you own the runtime, the secrets, the scaling, and the bill. OpenLegion is the second kind: agents are rows in a managed database, each task runs on demand, and the security and cost controls are enforced for you rather than assembled by you.",
  },
  {
    question:
      "How does agent coordination work in OpenLegion?",
    answer:
      "Work is organised as goals and tasks. Your assistant creates the agents a goal needs and delegates tasks to them, each with a deadline; a delegated task can spawn short-lived helpers and hands its result back for review. Agents never block on each other — every hand-off is an event with a correlation id and a deadline that escalates if it passes. You see all of it as threads, one per agent.",
  },
  {
    question:
      "What does AI agent security mean for autonomous agents?",
    answer:
      "It means treating the agent as something that can be talked into a mistake. The controls that matter are the ones that hold when the model is wrong: secrets the model never sees, a policy engine in front of every tool call, a sandbox with no egress by default, untrusted content that cannot trigger an irreversible action on its own, and a human approval for anything that reaches a third party or destroys data.",
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
