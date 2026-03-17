import { Check, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionWrapper } from "@/components/ui/section-wrapper";
import { AnimateIn } from "@/components/ui/animate-in";

const SIGNAL_COUNT = 6;

export function Enterprise() {
  const t = useTranslations("enterprise");

  return (
    <SectionWrapper id="enterprise" glow>
      <AnimateIn>
        <div className="gradient-border glass-shine mx-auto max-w-[620px] rounded-xl border border-border/50 glass-card p-8 text-center md:p-10">
          <h2 className="mb-3 text-2xl font-bold tracking-tight md:text-3xl">
            {t("heading")}
          </h2>
          <p className="mx-auto mb-6 max-w-[500px] text-sm leading-relaxed text-muted">
            {t("description")}
          </p>
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {Array.from({ length: SIGNAL_COUNT }, (_, i) => (
              <span
                key={i}
                className="flex items-center gap-1.5 rounded-full border border-success/15 bg-success/[0.05] px-3 py-1 text-xs font-medium text-muted"
              >
                <Check className="h-3 w-3 text-success/70" aria-hidden="true" />
                {t(`signals.${i}`)}
              </span>
            ))}
          </div>
          <a
            href="mailto:sales@openlegion.ai"
            className="group inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground transition-all hover:border-accent/40 hover:bg-accent/5"
          >
            {t("cta")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </a>
        </div>
      </AnimateIn>
    </SectionWrapper>
  );
}
