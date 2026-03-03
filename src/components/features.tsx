"use client";

import { motion } from "framer-motion";
import { SectionWrapper } from "@/components/ui/section-wrapper";
import { AnimateIn, StaggerContainer, StaggerItem } from "@/components/ui/animate-in";
import { FEATURES } from "@/lib/constants";

const SIZE_CLASSES = {
  large: "md:col-span-2 md:row-span-2",
  medium: "md:col-span-1 md:row-span-2",
  standard: "md:col-span-1 md:row-span-1",
  wide: "md:col-span-2",
} as const;

/* ── Shared motion variants for inline visual stagger ── */

const vContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.3 } },
};

const vItem = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

const vBarFill = {
  hidden: { scaleX: 0 },
  visible: { scaleX: 1, transition: { duration: 0.6, ease: "easeOut" as const } },
};

/* ── Inline visuals for the 4 larger feature cards ── */

const SECURITY_LAYERS = [
  { label: "Runtime Isolation", w: "w-full" },
  { label: "Container Hardening", w: "w-[90%]" },
  { label: "Credential Vault", w: "w-[80%]" },
  { label: "ACL Matrix", w: "w-[70%]" },
  { label: "Input Validation", w: "w-[60%]" },
  { label: "Unicode Sanitizer", w: "w-[52%]" },
];

const BUDGET_BARS = [
  { agent: "researcher", pct: 62, color: "bg-accent" },
  { agent: "engineer", pct: 94, color: "bg-amber-400" },
  { agent: "writer", pct: 28, color: "bg-accent" },
  { agent: "qualifier", pct: 48, color: "bg-accent" },
];

const AGENT_STATES = [
  { state: "streaming", color: "bg-accent" },
  { state: "thinking", color: "bg-amber-400" },
  { state: "tool", color: "bg-green-400" },
  { state: "idle", color: "bg-muted" },
];

const CHANNELS = ["CLI", "Telegram", "Discord", "Slack", "WhatsApp", "API", "Cron", "Webhooks"];

const WORKFLOW_STEPS = [
  { label: "intake", next: true },
  { label: "research", next: true },
  { label: "draft", next: true },
  { label: "review", next: false },
];

const MEMORY_ENTRIES = [
  { time: "2m ago", label: "recalled API schema", kind: "vector" },
  { time: "8m ago", label: "saved error pattern", kind: "learning" },
  { time: "1h ago", label: "loaded workspace ctx", kind: "file" },
];

const MCP_SERVERS = [
  { name: "postgres", status: "connected" },
  { name: "github", status: "connected" },
  { name: "filesystem", status: "connected" },
];

const SKILL_LINES = [
  { text: "def search(q):", color: "text-accent" },
  { text: '  """Auto-generated skill"""', color: "text-muted/60" },
  { text: "  results = web.get(q)", color: "text-muted" },
  { text: "  return rank(results)", color: "text-muted" },
];

const DEP_STACK = [
  { name: "Python 3.11+", icon: "◆" },
  { name: "SQLite", icon: "◆" },
  { name: "That's it.", icon: "✓" },
];

function SecurityLayersVisual() {
  return (
    <motion.div variants={vContainer} className="mt-auto flex flex-col gap-1.5 pt-6" aria-hidden="true">
      {SECURITY_LAYERS.map((l) => (
        <motion.div
          key={l.label}
          variants={vItem}
          className={`${l.w} flex items-center gap-2.5 rounded-md border border-accent/15 bg-accent/[0.06] px-3 py-1.5`}
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
          <span className="text-xs font-medium text-muted">{l.label}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

function BudgetBarsVisual() {
  return (
    <motion.div variants={vContainer} className="mt-auto flex flex-col gap-3 pt-6" aria-hidden="true">
      {BUDGET_BARS.map((b) => (
        <motion.div key={b.agent} variants={vItem} className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-muted">{b.agent}</span>
            <span className={`font-mono text-xs ${b.pct > 90 ? "text-amber-400" : "text-muted"}`}>
              {b.pct}%
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/[0.06]">
            <motion.div
              variants={vBarFill}
              style={{ width: `${b.pct}%`, transformOrigin: "left" }}
              className={`h-full rounded-full ${b.color}`}
            />
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

function FleetStatusVisual() {
  return (
    <motion.div variants={vContainer} className="mt-auto grid grid-cols-2 gap-2 pt-6" aria-hidden="true">
      {AGENT_STATES.map((a, i) => (
        <motion.div
          key={`${a.state}-${i}`}
          variants={vItem}
          className="flex items-center gap-2 rounded-md border border-border/50 bg-white/[0.03] px-3 py-1.5"
        >
          <span className={`h-2 w-2 shrink-0 rounded-full ${a.color}`} />
          <span className="font-mono text-xs text-muted">{a.state}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

function ChannelBadgesVisual() {
  return (
    <motion.div variants={vContainer} className="mt-auto flex flex-wrap gap-2 pt-6" aria-hidden="true">
      {CHANNELS.map((ch) => (
        <motion.span
          key={ch}
          variants={vItem}
          className="rounded-md border border-accent/15 bg-accent/[0.06] px-3 py-1 font-mono text-xs text-muted"
        >
          {ch}
        </motion.span>
      ))}
    </motion.div>
  );
}

function OrchestrationVisual() {
  return (
    <motion.div variants={vContainer} className="mt-auto flex items-center gap-1 pt-4" aria-hidden="true">
      {WORKFLOW_STEPS.map((s) => (
        <motion.div key={s.label} variants={vItem} className="flex items-center gap-1">
          <span className="rounded border border-accent/15 bg-accent/[0.06] px-2 py-0.5 font-mono text-[10px] text-muted">
            {s.label}
          </span>
          {s.next && (
            <span className="text-[10px] text-accent/40">→</span>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}

function BrowserVisual() {
  return (
    <motion.div variants={vItem} className="mt-auto pt-4" aria-hidden="true">
      <div className="overflow-hidden rounded-md border border-border/50">
        <div className="flex items-center gap-1.5 border-b border-border/50 bg-white/[0.03] px-2.5 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400/50" />
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400/50" />
          <span className="h-1.5 w-1.5 rounded-full bg-green-400/50" />
          <span className="ml-1.5 flex-1 rounded bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-muted/60">
            localhost:3000
          </span>
        </div>
        <div className="flex items-center justify-center bg-white/[0.02] px-3 py-2">
          <span className="font-mono text-[10px] text-accent/50">● CDP connected</span>
        </div>
      </div>
    </motion.div>
  );
}

function MemoryVisual() {
  return (
    <motion.div variants={vContainer} className="mt-auto flex flex-col gap-1.5 pt-4" aria-hidden="true">
      {MEMORY_ENTRIES.map((m) => (
        <motion.div key={m.label} variants={vItem} className="flex items-center gap-2">
          <span className="shrink-0 font-mono text-[10px] text-muted/50">{m.time}</span>
          <span className="h-px flex-1 bg-border/30" />
          <span className="font-mono text-[10px] text-muted">{m.label}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

function McpVisual() {
  return (
    <motion.div variants={vContainer} className="mt-auto flex flex-col gap-1 pt-4" aria-hidden="true">
      {MCP_SERVERS.map((s) => (
        <motion.div key={s.name} variants={vItem} className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-400" />
          <span className="font-mono text-[10px] text-muted">{s.name}</span>
        </motion.div>
      ))}
      <motion.span variants={vItem} className="mt-0.5 font-mono text-[10px] text-muted/40">+ 44 built-in skills</motion.span>
    </motion.div>
  );
}

function ToolBuilderVisual() {
  return (
    <motion.div variants={vItem} className="mt-auto pt-4" aria-hidden="true">
      <div className="overflow-hidden rounded-md border border-border/50">
        <div className="flex items-center gap-2 border-b border-border/50 bg-white/[0.03] px-3 py-1">
          <span className="rounded bg-accent/10 px-2 py-0.5 font-mono text-[10px] text-accent">search.py</span>
          <span className="font-mono text-[10px] text-muted/30">skill</span>
        </div>
        <div className="bg-white/[0.02] px-3 py-2">
          {SKILL_LINES.map((l) => (
            <div key={l.text} className={`font-mono text-[10px] leading-relaxed ${l.color}`}>
              {l.text}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function ZeroDepsVisual() {
  return (
    <motion.div variants={vContainer} className="mt-auto flex flex-col gap-1 pt-4" aria-hidden="true">
      {DEP_STACK.map((d) => (
        <motion.div key={d.name} variants={vItem} className="flex items-center gap-2">
          <span className={`text-[10px] ${d.icon === "✓" ? "text-green-400" : "text-accent"}`}>
            {d.icon}
          </span>
          <span className="font-mono text-[10px] text-muted">{d.name}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

const FEATURE_VISUALS: Record<string, React.ReactNode> = {
  "Six Security Layers, Zero Trust": <SecurityLayersVisual />,
  "Per-Agent Cost Control": <BudgetBarsVisual />,
  "Fleet Dashboard": <FleetStatusVisual />,
  "Deterministic Orchestration": <OrchestrationVisual />,
  "Built-In Browser Automation": <BrowserVisual />,
  "Persistent Agent Memory": <MemoryVisual />,
  "MCP-Compatible Extensibility": <McpVisual />,
  "Agents Build Their Own Tools": <ToolBuilderVisual />,
  "Zero External Dependencies": <ZeroDepsVisual />,
  "Agents That Work While You Sleep": <ChannelBadgesVisual />,
};

export function Features() {
  return (
    <SectionWrapper id="features" glow>
      <AnimateIn>
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">
            Features
          </p>
          <h2 className="mb-5 text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            AI agent platform built for{" "}
            <span className="gradient-text">production</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted">
            Security, cost control, and observability baked into every
            layer — so nothing slips through.
          </p>
        </div>
      </AnimateIn>

      <StaggerContainer className="grid gap-4 md:grid-cols-3 md:auto-rows-[minmax(140px,auto)]">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          const isLarge = f.size === "large";
          const isWide = f.size === "wide";
          const sizeClass = SIZE_CLASSES[f.size];
          return (
            <StaggerItem key={f.title} className={sizeClass}>
              <div
                className={`card-hover gradient-border glass-shine group relative flex h-full flex-col overflow-hidden rounded-xl border glass-card p-6 md:p-8 ${
                  isLarge
                    ? "border-accent/15 bg-gradient-to-br from-accent/[0.06] to-transparent"
                    : isWide
                      ? "border-accent/10 bg-gradient-to-r from-accent/[0.04] via-transparent to-accent/[0.04]"
                      : "border-border/50"
                }`}
              >
                {isLarge && (
                  <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-accent/[0.06] blur-3xl transition-opacity group-hover:opacity-100 opacity-50" aria-hidden="true" />
                )}
                <div className="relative flex h-full flex-col">
                  <div className={`mb-3 flex items-center gap-3 ${isLarge ? "mb-4" : ""}`}>
                    <div
                      className={`flex shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 transition group-hover:border-accent/30 group-hover:scale-110 ${
                        isLarge ? "h-10 w-10" : "h-8 w-8 rounded-lg border-accent/15 bg-accent/[0.07]"
                      }`}
                    >
                      <Icon className={`text-accent-light ${isLarge ? "h-5 w-5" : "h-4 w-4"}`} />
                    </div>
                    <h3
                      className={`font-semibold tracking-tight text-foreground ${
                        isLarge ? "text-xl" : "text-base md:text-lg"
                      }`}
                    >
                      {f.title}
                    </h3>
                  </div>
                  <p
                    className={`leading-relaxed text-muted ${
                      isLarge ? "text-sm md:text-base md:leading-relaxed" : "text-sm"
                    }`}
                  >
                    {f.description}
                  </p>
                  {FEATURE_VISUALS[f.title]}
                </div>
              </div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </SectionWrapper>
  );
}
