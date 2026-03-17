import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { SectionWrapper } from "@/components/ui/section-wrapper";
import { AnimateIn, StaggerContainer, StaggerItem } from "@/components/ui/animate-in";

const HOMEPAGE_FAQ_INDICES = [0, 1, 2, 6, 8];

export function FAQ() {
  const t = useTranslations("faq");

  return (
    <SectionWrapper id="faq">
      <AnimateIn>
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">
            {t("sectionLabel")}
          </p>
          <h2 className="mb-5 text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            {t("heading")}
            <span className="gradient-text">{t("headingHighlight")}</span>
          </h2>
        </div>
      </AnimateIn>

      <StaggerContainer className="mx-auto max-w-3xl space-y-3">
        {HOMEPAGE_FAQ_INDICES.map((idx, i) => (
          <StaggerItem key={idx}>
            <details className="faq-details gradient-border glass-shine overflow-hidden rounded-xl border border-border/50 glass-card transition-all duration-300 group">
              <summary
                className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-white/[0.02] list-none [&::-webkit-details-marker]:hidden"
                id={`faq-question-${i}`}
              >
                <span className="text-sm font-medium text-foreground md:text-base">
                  {t(`items.${idx}.question`)}
                </span>
                <ChevronDown
                  className="h-4 w-4 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <div className="faq-answer px-6 pb-5">
                <p className="text-sm leading-relaxed text-muted">
                  {t(`items.${idx}.answer`)}
                </p>
              </div>
            </details>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <AnimateIn delay={0.15}>
        <p className="mt-8 text-center text-sm text-muted">
          {t("seeFullFaqPrefix")}{" "}
          <a href="/faq" className="text-accent-light underline underline-offset-2 transition-colors hover:text-accent">
            {t("seeFullFaqLink")}
          </a>
        </p>
      </AnimateIn>
    </SectionWrapper>
  );
}
