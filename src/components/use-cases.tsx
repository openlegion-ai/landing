"use client";

import { motion } from "framer-motion";
import { SectionWrapper } from "@/components/ui/section-wrapper";
import { AnimateIn, StaggerContainer, StaggerItem } from "@/components/ui/animate-in";
import { USE_CASES } from "@/lib/constants";

/* ── Shared motion variants for inline visual stagger ── */

const vContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.3 } },
};

const vItem = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

/* ── Inline visuals for each use-case card ── */

const DEV_EVENTS = [
  { icon: "✓", label: "PM created task #42", done: true },
  { icon: "✓", label: "Engineer opened PR #18", done: true },
  { icon: "→", label: "Reviewer reviewing…", done: false },
];

const FUNNEL_BARS = [
  { label: "leads", count: 240, w: "w-full" },
  { label: "qualified", count: 82, w: "w-[58%]" },
  { label: "converted", count: 34, w: "w-[36%]" },
];

const CONTENT_ITEMS = [
  { title: "Blog post", status: "published", color: "bg-green-400" },
  { title: "Case study", status: "in review", color: "bg-amber-400" },
  { title: "White paper", status: "drafting", color: "bg-muted" },
];

function DevTeamVisual() {
  return (
    <motion.div variants={vContainer} className="mt-auto flex flex-col gap-1 pt-4" aria-hidden="true">
      {DEV_EVENTS.map((e) => (
        <motion.div key={e.label} variants={vItem} className="flex items-center gap-2">
          <span
            className={`shrink-0 font-mono text-[10px] ${
              e.done ? "text-green-400" : "text-accent"
            }`}
          >
            {e.icon}
          </span>
          <span className="font-mono text-[10px] text-muted">{e.label}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

function SalesPipelineVisual() {
  return (
    <motion.div variants={vContainer} className="mt-auto flex flex-col gap-1.5 pt-4" aria-hidden="true">
      {FUNNEL_BARS.map((b) => (
        <motion.div
          key={b.label}
          variants={vItem}
          className={`${b.w} flex items-center gap-2.5 rounded-md border border-accent/15 bg-accent/[0.06] px-3 py-1`}
        >
          <span className="font-mono text-[10px] text-muted">{b.count}</span>
          <span className="font-mono text-[10px] text-muted/60">{b.label}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

function ContentStudioVisual() {
  return (
    <motion.div variants={vContainer} className="mt-auto flex flex-col gap-1 pt-4" aria-hidden="true">
      {CONTENT_ITEMS.map((c) => (
        <motion.div key={c.title} variants={vItem} className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${c.color}`} />
          <span className="flex-1 font-mono text-[10px] text-muted">{c.title}</span>
          <span className="font-mono text-[10px] text-muted/60">{c.status}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

const USE_CASE_VISUALS: Record<string, React.ReactNode> = {
  "Dev Team": <DevTeamVisual />,
  "Sales Pipeline": <SalesPipelineVisual />,
  "Content Studio": <ContentStudioVisual />,
};

export function UseCases() {
  return (
    <SectionWrapper id="use-cases" glow>
      <AnimateIn>
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">
            Use Cases
          </p>
          <h2 className="mb-5 text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            One command to a{" "}
            <span className="gradient-text">working team</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted">
            Pick a built-in template or define your own fleet. Each agent gets
            its own container, budget, and tool permissions.
          </p>
        </div>
      </AnimateIn>

      <StaggerContainer className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {USE_CASES.map((uc) => {
          const Icon = uc.icon;
          return (
            <StaggerItem key={uc.name}>
              <div className="card-hover glass-shine gradient-border group flex h-full flex-col rounded-xl border border-border/50 glass-card p-6">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent/15 bg-accent/[0.07] transition group-hover:border-accent/30 group-hover:scale-110 group-hover:bg-accent/10">
                    <Icon className="h-4 w-4 text-accent-light" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    {uc.name}
                  </h3>
                </div>

                <div className="mb-4 flex flex-wrap gap-1.5">
                  {uc.agents.map((agent) => (
                    <span
                      key={agent}
                      className="flex items-center gap-1.5 rounded-md border border-border/40 bg-background/50 px-2 py-0.5 font-mono text-[11px] text-muted transition-colors hover:border-accent/20 hover:bg-accent/[0.04]"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-400" />
                      {agent}
                    </span>
                  ))}
                </div>

                <p className="text-sm leading-relaxed text-muted">
                  {uc.description}
                </p>

                {USE_CASE_VISUALS[uc.name]}
              </div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      <AnimateIn delay={0.2}>
        <p className="mt-8 text-center text-sm text-muted">
          Run{" "}
          <code className="rounded-md bg-card px-2 py-0.5 font-mono text-xs text-accent-light">
            openlegion start
          </code>{" "}
          to pick a template or create your own fleet.
        </p>
      </AnimateIn>
    </SectionWrapper>
  );
}
