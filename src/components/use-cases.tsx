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
  { color: "bg-success" },
  { color: "bg-amber-500" },
  { color: "bg-muted" },
];

function DevTeamVisual({ t }: { t: (key: string) => string }) {
  return (
    <motion.div variants={vContainer} className="flex flex-col gap-1.5" aria-hidden="true">
      {DEV_EVENT_META.map((e, i) => (
        <motion.div key={i} variants={vItem} className="flex items-center gap-2">
          <span className={`shrink-0 font-mono text-[10px] ${e.done ? "text-success" : "text-accent"}`}>
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
          <p className="sr-only">
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

      {/* Alternating split rows — text beside a product-evidence panel,
          hairline-separated. Same content as the old card grid, new anatomy. */}
      <StaggerContainer className="mx-auto max-w-4xl">
        {USE_CASES.map((uc, idx) => {
          const Icon = uc.icon;
          const evidenceFirst = idx % 2 === 1;
          return (
            <StaggerItem key={uc.id}>
              <div
                id={uc.id}
                className="grid items-center gap-6 border-t border-border py-9 last:border-b md:grid-cols-2 md:gap-12 scroll-mt-24"
              >
                <div className={evidenceFirst ? "md:order-2" : ""}>
                  <div className="mb-2.5 flex items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0 text-accent" />
                    <h3 className="text-lg font-semibold leading-snug text-foreground">
                      {t(`items.${idx}.name`)}
                    </h3>
                  </div>

                  <p className="mb-4 text-[15px] leading-relaxed text-muted">
                    {t(`items.${idx}.description`)}
                  </p>

                  {/* Agent pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {uc.agents.map((_, agentIdx) => (
                      <span
                        key={agentIdx}
                        className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-0.5 font-mono text-[11px] text-muted"
                      >
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                        {t(`items.${idx}.agents.${agentIdx}`)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Product-evidence panel */}
                <div
                  className={`rounded-xl border border-border bg-card-hover p-4 ${
                    evidenceFirst ? "md:order-1" : ""
                  }`}
                >
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
