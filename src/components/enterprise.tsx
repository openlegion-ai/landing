"use client";

import { motion } from "framer-motion";
import { SectionWrapper } from "@/components/ui/section-wrapper";
import { AnimateIn, StaggerContainer, StaggerItem } from "@/components/ui/animate-in";
import { ENTERPRISE_FEATURES } from "@/lib/constants";

/* ── Shared motion variants for inline visual stagger ── */

const vContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.3 } },
};

const vItem = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

/* ── Inline visuals (top + middle rows only) ── */

function OnPremVisual() {
  return (
    <motion.div variants={vItem} aria-hidden="true">
      <div className="overflow-hidden rounded-lg border border-accent/15">
        <div className="flex items-center gap-2 border-b border-accent/10 bg-accent/[0.04] px-3 py-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-accent/70">
            your infrastructure
          </span>
        </div>
        <motion.div variants={vContainer} className="flex flex-col gap-2 bg-white/[0.02] px-3 py-3">
          <motion.div variants={vItem} className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              <span className="font-mono text-[10px] text-muted">app server</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              <span className="font-mono text-[10px] text-muted">db server</span>
            </div>
          </motion.div>
          <motion.div variants={vItem} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent" />
            <span className="font-mono text-[10px] text-muted">agent fleet</span>
          </motion.div>
          <motion.div variants={vItem} className="mt-1 border-t border-dashed border-accent/15 pt-1.5">
            <span className="font-mono text-[10px] text-accent/50">── air-gapped ──</span>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function AuditVisual() {
  return (
    <motion.div variants={vItem} className="mt-auto pt-4" aria-hidden="true">
      <div className="flex items-center justify-center gap-3 rounded-lg border border-border/50 bg-white/[0.03] px-3 py-2.5">
        <span className="font-mono text-xs font-medium text-foreground/70">25K LOC</span>
        <span className="text-accent/30">·</span>
        <span className="font-mono text-xs font-medium text-foreground/70">1,607 tests</span>
        <span className="text-accent/30">·</span>
        <span className="font-mono text-xs font-medium text-foreground/70">1 day audit</span>
      </div>
    </motion.div>
  );
}

function WorkflowVisual() {
  const steps = [
    { label: "intake", next: true },
    { label: "route", next: true },
    { label: "execute", next: true },
    { label: "log", next: false },
  ];
  return (
    <motion.div variants={vContainer} className="mt-auto flex items-center gap-1 pt-4" aria-hidden="true">
      {steps.map((s) => (
        <motion.div key={s.label} variants={vItem} className="flex items-center gap-1">
          <span className="rounded border border-accent/15 bg-accent/[0.06] px-2 py-0.5 font-mono text-[10px] text-muted">
            {s.label}
          </span>
          {s.next && <span className="text-[10px] text-accent/40">→</span>}
        </motion.div>
      ))}
    </motion.div>
  );
}

const ENTERPRISE_VISUALS: Record<string, React.ReactNode> = {
  "On-Premises Deployment": <OnPremVisual />,
  "Audit-Ready Codebase": <AuditVisual />,
  "Deterministic Workflows": <WorkflowVisual />,
};

export function Enterprise() {
  const heroCard = ENTERPRISE_FEATURES.find((f) => f.size === "large")!;
  const midCards = ENTERPRISE_FEATURES.filter((f) => f.size === "medium");
  const baseCards = ENTERPRISE_FEATURES.filter((f) => f.size === "standard");
  const HeroIcon = heroCard.icon;

  return (
    <SectionWrapper id="enterprise" glow>
      <AnimateIn>
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">
            Enterprise
          </p>
          <h2 className="mb-5 text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Built for{" "}
            <span className="gradient-text">enterprise</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted">
            Production security, governance, and compliance — every layer
            enforced by default.
          </p>
        </div>
      </AnimateIn>

      <div className="flex flex-col gap-4">
        {/* Row 1 — single hero card, full width */}
        <AnimateIn>
          <div className="card-hover gradient-border glass-shine group relative flex flex-col overflow-hidden rounded-xl border border-accent/15 bg-gradient-to-br from-accent/[0.06] to-transparent glass-card p-6 md:flex-row md:items-center md:gap-10 md:p-10">
            <div
              className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/[0.06] blur-3xl transition-opacity group-hover:opacity-100 opacity-50"
              aria-hidden="true"
            />
            <div className="relative flex flex-1 flex-col">
              <span className="mb-4 inline-flex w-fit rounded-full border border-accent/15 bg-accent/[0.06] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent transition-colors hover:bg-accent/10">
                {heroCard.tag}
              </span>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 transition group-hover:border-accent/30 group-hover:scale-110">
                  <HeroIcon className="h-5 w-5 text-accent-light" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-foreground">
                  {heroCard.title}
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-muted md:text-base md:leading-relaxed">
                {heroCard.description}
              </p>
            </div>
            <div className="mt-6 md:mt-0 md:w-80 md:shrink-0">
              {ENTERPRISE_VISUALS[heroCard.title]}
            </div>
          </div>
        </AnimateIn>

        {/* Row 2 — two medium cards with visuals */}
        <StaggerContainer className="grid gap-4 md:grid-cols-2">
          {midCards.map((f) => {
            const Icon = f.icon;
            return (
              <StaggerItem key={f.title}>
                <div className="card-hover gradient-border glass-shine group relative flex h-full flex-col overflow-hidden rounded-xl border border-border/50 glass-card p-6 md:p-8">
                  <div className="relative flex h-full flex-col">
                    <span className="mb-4 inline-flex w-fit rounded-full border border-accent/15 bg-accent/[0.06] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent transition-colors hover:bg-accent/10">
                      {f.tag}
                    </span>
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent/15 bg-accent/[0.07] transition group-hover:border-accent/30 group-hover:scale-110">
                        <Icon className="h-4 w-4 text-accent-light" />
                      </div>
                      <h3 className="text-base font-semibold tracking-tight text-foreground md:text-lg">
                        {f.title}
                      </h3>
                    </div>
                    <p className="text-sm leading-relaxed text-muted">
                      {f.description}
                    </p>
                    {ENTERPRISE_VISUALS[f.title]}
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        {/* Row 3 — three compact cards */}
        <StaggerContainer className="grid gap-4 md:grid-cols-3">
          {baseCards.map((f) => {
            const Icon = f.icon;
            return (
              <StaggerItem key={f.title}>
                <div className="card-hover gradient-border glass-shine group relative flex h-full flex-col overflow-hidden rounded-xl border border-border/50 glass-card p-6">
                  <div className="relative flex h-full flex-col">
                    <span className="mb-3 inline-flex w-fit rounded-full border border-accent/15 bg-accent/[0.06] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent transition-colors hover:bg-accent/10">
                      {f.tag}
                    </span>
                    <div className="mb-3 flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent/15 bg-accent/[0.07] transition group-hover:border-accent/30 group-hover:scale-110">
                        <Icon className="h-4 w-4 text-accent-light" />
                      </div>
                      <h3 className="text-sm font-semibold tracking-tight text-foreground md:text-base">
                        {f.title}
                      </h3>
                    </div>
                    <p className="text-sm leading-relaxed text-muted">
                      {f.description}
                    </p>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </SectionWrapper>
  );
}
