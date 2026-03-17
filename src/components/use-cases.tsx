"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
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

const DEV_EVENT_META = [
  { icon: "✓", done: true },
  { icon: "✓", done: true },
  { icon: "→", done: false },
];

const FUNNEL_BAR_META = [
  { count: 240, w: "w-full" },
  { count: 82, w: "w-[58%]" },
  { count: 34, w: "w-[36%]" },
];

const CONTENT_ITEM_META = [
  { color: "bg-green-400" },
  { color: "bg-amber-400" },
  { color: "bg-muted" },
];

function DevTeamVisual({ t }: { t: (key: string) => string }) {
  return (
    <motion.div variants={vContainer} className="flex flex-col gap-1.5" aria-hidden="true">
      {DEV_EVENT_META.map((e, i) => (
        <motion.div key={i} variants={vItem} className="flex items-center gap-2">
          <span className={`shrink-0 font-mono text-[10px] ${e.done ? "text-green-400" : "text-accent"}`}>
            {e.icon}
          </span>
          <span className="font-mono text-[10px] text-muted">{t(`devEvents.${i}`)}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

function SalesPipelineVisual({ t }: { t: (key: string) => string }) {
  return (
    <motion.div variants={vContainer} className="flex flex-col gap-1.5" aria-hidden="true">
      {FUNNEL_BAR_META.map((b, i) => (
        <motion.div
          key={i}
          variants={vItem}
          className={`${b.w} flex items-center gap-2.5 rounded-md border border-accent/15 bg-accent/[0.06] px-3 py-1`}
        >
          <span className="font-mono text-[10px] text-muted">{b.count}</span>
          <span className="font-mono text-[10px] text-muted/60">{t(`funnelBars.${i}.label`)}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

function ContentStudioVisual({ t }: { t: (key: string) => string }) {
  return (
    <motion.div variants={vContainer} className="flex flex-col gap-1.5" aria-hidden="true">
      {CONTENT_ITEM_META.map((c, i) => (
        <motion.div key={i} variants={vItem} className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${c.color}`} />
          <span className="flex-1 font-mono text-[10px] text-muted">{t(`contentItems.${i}.title`)}</span>
          <span className="font-mono text-[10px] text-muted/60">{t(`contentItems.${i}.status`)}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

function CustomTeamVisual({ t }: { t: (key: string) => string }) {
  const stepCount = 4;
  return (
    <motion.div variants={vContainer} className="flex flex-wrap items-center gap-1" aria-hidden="true">
      {Array.from({ length: stepCount }, (_, i) => (
        <motion.div key={i} variants={vItem} className="flex items-center gap-1">
          <span className="rounded border border-accent/15 bg-accent/[0.06] px-2 py-0.5 font-mono text-[10px] text-muted">
            {t(`customSteps.${i}`)}
          </span>
          {i < stepCount - 1 && (
            <span className="text-[10px] text-accent/40">{"\u2192"}</span>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}

const USE_CASE_VISUAL_MAP: Record<string, (t: (key: string) => string) => React.ReactNode> = {
  "uc-engineering": (t) => <DevTeamVisual t={t} />,
  "uc-sales": (t) => <SalesPipelineVisual t={t} />,
  "uc-content": (t) => <ContentStudioVisual t={t} />,
  "uc-custom": (t) => <CustomTeamVisual t={t} />,
};

export function UseCases() {
  const t = useTranslations("useCases");

  return (
    <SectionWrapper id="use-cases" glow>
      <AnimateIn>
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">
            {t("sectionLabel")}
          </p>
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            {t("heading")}
            <span className="gradient-text">{t("headingHighlight")}</span>
            {t("headingEnd")}
          </h2>
          <p className="mx-auto max-w-2xl text-muted">
            {t("subtitle")}
          </p>
        </div>
      </AnimateIn>

      <StaggerContainer className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {USE_CASES.map((uc, idx) => {
          const Icon = uc.icon;
          return (
            <StaggerItem key={uc.id}>
              <div id={uc.id} className="card-hover glass-shine gradient-border group flex h-full flex-col rounded-xl border border-border/50 glass-card p-5 scroll-mt-24">
                {/* Icon + Title */}
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-accent/15 bg-accent/[0.07] transition group-hover:border-accent/30 group-hover:scale-110 group-hover:bg-accent/10">
                    <Icon className="h-4 w-4 text-accent-light" />
                  </div>
                  <h3 className="text-[15px] font-semibold leading-snug text-foreground">
                    {t(`items.${idx}.name`)}
                  </h3>
                </div>

                {/* Agent pills */}
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {uc.agents.map((_, agentIdx) => (
                    <span
                      key={agentIdx}
                      className="flex items-center gap-1.5 rounded-md border border-border/40 bg-background/50 px-2 py-0.5 font-mono text-[11px] text-muted"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-400" />
                      {t(`items.${idx}.agents.${agentIdx}`)}
                    </span>
                  ))}
                </div>

                {/* Activity visual — pushed to bottom */}
                <div className="mt-auto border-t border-border/20 pt-3">
                  {USE_CASE_VISUAL_MAP[uc.id]?.(t)}
                </div>
              </div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </SectionWrapper>
  );
}
