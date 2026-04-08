"use client";

import { Megaphone, TrendingUp, Search, Code, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { SectionWrapper } from "@/components/ui/section-wrapper";
import { AnimateIn, StaggerContainer, StaggerItem } from "@/components/ui/animate-in";
import { APP_URL } from "@/lib/constants";

const vContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.3 } },
};

const vItem = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

/* ── Mini visuals for each card ────────────────────────────────────────────── */

const CONTENT_ITEM_META = [
  { color: "bg-green-400" },
  { color: "bg-amber-400" },
  { color: "bg-muted" },
];

function MarketingVisual({ t }: { t: (key: string) => string }) {
  return (
    <motion.div variants={vContainer} className="flex flex-col gap-1.5" aria-hidden="true">
      {CONTENT_ITEM_META.map((c, i) => (
        <motion.div key={i} variants={vItem} className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${c.color}`} />
          <span className="flex-1 font-mono text-[10px] text-muted">{t(`visuals.marketing.${i}.title`)}</span>
          <span className="font-mono text-[10px] text-muted/60">{t(`visuals.marketing.${i}.status`)}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

const FUNNEL_BAR_META = [
  { count: 240, w: "w-full" },
  { count: 82, w: "w-[58%]" },
  { count: 34, w: "w-[36%]" },
];

function SalesVisual({ t }: { t: (key: string) => string }) {
  return (
    <motion.div variants={vContainer} className="flex flex-col gap-1.5" aria-hidden="true">
      {FUNNEL_BAR_META.map((b, i) => (
        <motion.div
          key={i}
          variants={vItem}
          className={`${b.w} flex items-center gap-2.5 rounded-md border border-accent/15 bg-accent/[0.06] px-3 py-1`}
        >
          <span className="font-mono text-[10px] text-muted">{b.count}</span>
          <span className="font-mono text-[10px] text-muted/60">{t(`visuals.sales.${i}`)}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

const RESEARCH_EVENT_META = [
  { icon: "✓", done: true },
  { icon: "✓", done: true },
  { icon: "→", done: false },
];

function ResearchVisual({ t }: { t: (key: string) => string }) {
  return (
    <motion.div variants={vContainer} className="flex flex-col gap-1.5" aria-hidden="true">
      {RESEARCH_EVENT_META.map((e, i) => (
        <motion.div key={i} variants={vItem} className="flex items-center gap-2">
          <span className={`shrink-0 font-mono text-[10px] ${e.done ? "text-green-400" : "text-accent"}`}>
            {e.icon}
          </span>
          <span className="font-mono text-[10px] text-muted">{t(`visuals.research.${i}`)}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

const DEV_EVENT_META = [
  { icon: "✓", done: true },
  { icon: "✓", done: true },
  { icon: "→", done: false },
];

function DevVisual({ t }: { t: (key: string) => string }) {
  return (
    <motion.div variants={vContainer} className="flex flex-col gap-1.5" aria-hidden="true">
      {DEV_EVENT_META.map((e, i) => (
        <motion.div key={i} variants={vItem} className="flex items-center gap-2">
          <span className={`shrink-0 font-mono text-[10px] ${e.done ? "text-green-400" : "text-accent"}`}>
            {e.icon}
          </span>
          <span className="font-mono text-[10px] text-muted">{t(`visuals.dev.${i}`)}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

const TRADING_EVENT_META = [
  { icon: "↑", color: "text-green-400" },
  { icon: "↓", color: "text-amber-400" },
  { icon: "◆", color: "text-accent" },
];

function TradingVisual({ t }: { t: (key: string) => string }) {
  return (
    <motion.div variants={vContainer} className="flex flex-col gap-1.5" aria-hidden="true">
      {TRADING_EVENT_META.map((e, i) => (
        <motion.div key={i} variants={vItem} className="flex items-center gap-2">
          <span className={`shrink-0 font-mono text-[10px] ${e.color}`}>
            {e.icon}
          </span>
          <span className="font-mono text-[10px] text-muted">{t(`visuals.trading.${i}`)}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

const VISUALS = [
  (t: (key: string) => string) => <MarketingVisual t={t} />,
  (t: (key: string) => string) => <SalesVisual t={t} />,
  (t: (key: string) => string) => <ResearchVisual t={t} />,
  (t: (key: string) => string) => <DevVisual t={t} />,
  (t: (key: string) => string) => <TradingVisual t={t} />,
];

const ICONS = [Megaphone, TrendingUp, Search, Code, Wallet] as const;
const EXAMPLES = [0, 1, 2, 3, 4] as const;
const ROLE_COUNTS = [4, 4, 4, 3, 3] as const;

/* ── Component ─────────────────────────────────────────────────────────────── */

export function PromptToTeam() {
  const t = useTranslations("promptToTeam");

  return (
    <SectionWrapper id="prompt-to-team" glow>
      <AnimateIn>
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">
            {t("sectionLabel")}
          </p>
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            {t("heading")}
          </h2>
          <p className="mx-auto max-w-2xl text-muted">
            {t("subtitle")}
          </p>
        </div>
      </AnimateIn>

      <StaggerContainer className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {EXAMPLES.map((i) => {
          const Icon = ICONS[i];
          return (
            <StaggerItem key={i}>
              <div className="card-hover gradient-border glass-shine group flex h-full flex-col rounded-xl border border-border/50 glass-card p-5">
                {/* Icon + Title */}
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-accent/15 bg-accent/[0.07] transition group-hover:border-accent/30 group-hover:scale-110 group-hover:bg-accent/10">
                    <Icon className="h-4 w-4 text-accent-light" />
                  </div>
                  <h3 className="text-[15px] font-semibold leading-snug text-foreground">
                    {t(`examples.${i}.name`)}
                  </h3>
                </div>

                {/* Role pills */}
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {Array.from({ length: ROLE_COUNTS[i] }, (_, r) => (
                    <span
                      key={r}
                      className="flex items-center gap-1.5 rounded-md border border-border/40 bg-background/50 px-2 py-0.5 font-mono text-[11px] text-muted"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-400" />
                      {t(`examples.${i}.roles.${r}`)}
                    </span>
                  ))}
                </div>

                {/* Activity visual — pushed to bottom */}
                <div className="mt-auto border-t border-border/20 pt-3">
                  {VISUALS[i](t)}
                </div>
              </div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      <AnimateIn delay={0.15}>
        <p className="mt-8 text-center text-sm text-muted">
          {t("customNote")}{" "}
          <a
            href={APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-light underline underline-offset-2 transition-colors hover:text-accent"
          >
            {t("customCta")}
          </a>
        </p>
      </AnimateIn>
    </SectionWrapper>
  );
}
