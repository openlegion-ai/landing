"use client";

import { Code, Wrench, Rocket, Building2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionWrapper } from "@/components/ui/section-wrapper";
import { AnimateIn, StaggerContainer, StaggerItem } from "@/components/ui/animate-in";

const CARDS = [
  { icon: Code, scrollTo: "#use-cases" },
  { icon: Rocket, scrollTo: "#quickstart" },
  { icon: Wrench, scrollTo: "#use-cases" },
  { icon: Building2, scrollTo: "#enterprise" },
];

export function AudienceSelector() {
  const t = useTranslations("audienceSelector");

  return (
    <SectionWrapper id="audience-selector" fade={false}>
      <AnimateIn>
        <div className="mb-12 text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            {t("heading")}
            <span className="gradient-text">{t("headingHighlight")}</span>{t("headingEnd")}
          </h2>
        </div>
      </AnimateIn>

      <StaggerContainer className="mx-auto grid max-w-4xl grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {CARDS.map((card, i) => {
          const Icon = card.icon;
          const title = t(`cards.${i}.title`);
          return (
            <StaggerItem key={i}>
              <button
                onClick={() => {
                  const el = document.querySelector(card.scrollTo);
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="card-hover glass-shine gradient-border group flex h-full w-full cursor-pointer items-center gap-3 rounded-xl border border-border/50 glass-card p-4 text-left transition-all hover:border-accent/30 sm:flex-col sm:items-center sm:p-6 sm:text-center"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-accent/15 bg-accent/[0.07] transition group-hover:border-accent/30 group-hover:scale-110 group-hover:bg-accent/10 sm:mb-4 sm:h-10 sm:w-10">
                  <Icon className="h-4 w-4 text-accent-light sm:h-5 sm:w-5" />
                </div>
                <h3 className="text-[13px] font-semibold leading-snug text-foreground sm:text-sm">
                  {title}
                </h3>
              </button>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </SectionWrapper>
  );
}
