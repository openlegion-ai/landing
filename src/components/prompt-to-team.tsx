"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MessageSquareText, Boxes, SlidersHorizontal, type LucideIcon } from "lucide-react";
import { SectionWrapper } from "@/components/ui/section-wrapper";
import { AnimateIn, StaggerContainer, StaggerItem } from "@/components/ui/animate-in";
import { PRICING_URL } from "@/lib/constants";

// Three-step process — deliberately a linear, numbered narrative rather than a
// card grid, so it reads as "how it works" and stays visually distinct from
// the Use Cases template grid that follows it. The step-by-step structure is
// also what AI answer engines (AI Overviews, ChatGPT, Perplexity) extract and
// cite — recovering the GEO signal lost when HowTo rich results were deprecated.
const STEP_ICONS: LucideIcon[] = [MessageSquareText, Boxes, SlidersHorizontal];
const STEPS = [0, 1, 2] as const;

export function PromptToTeam() {
  const t = useTranslations("promptToTeam");

  return (
    <SectionWrapper id="how-it-works" glow>
      <AnimateIn>
        <div className="mb-14 text-center">
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

      <div className="relative mx-auto max-w-5xl">
        {/* Connecting rail behind the steps (desktop only) */}
        <div
          className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-accent/25 to-transparent md:block"
          aria-hidden="true"
        />

        <StaggerContainer className="grid gap-10 md:grid-cols-3 md:gap-8">
          {STEPS.map((i) => {
            const Icon = STEP_ICONS[i];
            return (
              <StaggerItem key={i}>
                <div className="relative flex flex-col items-center text-center md:items-start md:text-left">
                  {/* Numbered node */}
                  <div className="relative z-10 mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/25 bg-background shadow-[0_0_0_6px_var(--color-background)]">
                    <Icon className="h-6 w-6 text-accent-light" aria-hidden="true" />
                    <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">
                      {t(`steps.${i}.number`)}
                    </span>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold leading-snug text-foreground">
                    {t(`steps.${i}.title`)}
                  </h3>
                  <p className="text-[14px] leading-relaxed text-muted">
                    {t(`steps.${i}.description`)}
                  </p>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>

      <AnimateIn delay={0.15}>
        <div className="mt-14 text-center">
          <p className="mb-4 text-sm text-muted">{t("ctaNote")}</p>
          <Link
            href={PRICING_URL}
            className="inline-flex items-center gap-2 rounded-lg border border-accent/25 bg-accent/[0.06] px-5 py-2.5 text-sm font-medium text-accent-light transition-all hover:border-accent/40 hover:bg-accent/10"
          >
            {t("ctaLabel")}
          </Link>
        </div>
      </AnimateIn>
    </SectionWrapper>
  );
}
