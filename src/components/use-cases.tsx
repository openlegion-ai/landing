"use client";

import { motion } from "framer-motion";
import { SectionWrapper } from "@/components/ui/section-wrapper";
import { AnimateIn, StaggerContainer, StaggerItem } from "@/components/ui/animate-in";
import { USE_CASES } from "@/lib/constants";

const vContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.3 } },
};

const vItem = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

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

const CUSTOM_STEPS = [
  { label: "intake" },
  { label: "research" },
  { label: "execute" },
  { label: "deliver" },
];

function DevTeamVisual() {
  return (
    <motion.div variants={vContainer} className="flex flex-col gap-1.5" aria-hidden="true">
      {DEV_EVENTS.map((e) => (
        <motion.div key={e.label} variants={vItem} className="flex items-center gap-2">
          <span className={`shrink-0 font-mono text-[10px] ${e.done ? "text-green-400" : "text-accent"}`}>
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
    <motion.div variants={vContainer} className="flex flex-col gap-1.5" aria-hidden="true">
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
    <motion.div variants={vContainer} className="flex flex-col gap-1.5" aria-hidden="true">
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

function CustomTeamVisual() {
  return (
    <motion.div variants={vContainer} className="flex flex-wrap items-center gap-1" aria-hidden="true">
      {CUSTOM_STEPS.map((s, i) => (
        <motion.div key={s.label} variants={vItem} className="flex items-center gap-1">
          <span className="rounded border border-accent/15 bg-accent/[0.06] px-2 py-0.5 font-mono text-[10px] text-muted">
            {s.label}
          </span>
          {i < CUSTOM_STEPS.length - 1 && (
            <span className="text-[10px] text-accent/40">→</span>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}

const USE_CASE_VISUALS: Record<string, React.ReactNode> = {
  "Your engineering team": <DevTeamVisual />,
  "Your sales team": <SalesPipelineVisual />,
  "Your content team": <ContentStudioVisual />,
  "Your custom team": <CustomTeamVisual />,
};

export function UseCases() {
  return (
    <SectionWrapper id="use-cases" glow>
      <AnimateIn>
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">
            Use Cases
          </p>
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            What role does your{" "}
            <span className="gradient-text">team need</span>?
          </h2>
          <p className="mx-auto max-w-2xl text-muted">
            Pick a built-in multi-agent template or define your own autonomous agent fleet.
            Each agent gets its own container, budget, and tool permissions.
          </p>
        </div>
      </AnimateIn>

      <StaggerContainer className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {USE_CASES.map((uc) => {
          const Icon = uc.icon;
          return (
            <StaggerItem key={uc.name}>
              <div id={uc.id} className="card-hover glass-shine gradient-border group flex h-full flex-col rounded-xl border border-border/50 glass-card p-5 scroll-mt-24">
                {/* Icon */}
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-accent/15 bg-accent/[0.07] transition group-hover:border-accent/30 group-hover:scale-110 group-hover:bg-accent/10">
                  <Icon className="h-4 w-4 text-accent-light" />
                </div>

                {/* Title */}
                <h3 className="mb-3 text-[15px] font-semibold leading-snug text-foreground">
                  {uc.name}
                </h3>

                {/* Agent pills */}
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {uc.agents.map((agent) => (
                    <span
                      key={agent}
                      className="flex items-center gap-1.5 rounded-md border border-border/40 bg-background/50 px-2 py-0.5 font-mono text-[11px] text-muted"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-400" />
                      {agent}
                    </span>
                  ))}
                </div>

                {/* Activity visual — pushed to bottom */}
                <div className="mt-auto border-t border-border/20 pt-3">
                  {USE_CASE_VISUALS[uc.name]}
                </div>
              </div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </SectionWrapper>
  );
}
