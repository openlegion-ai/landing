import { useTranslations } from "next-intl";
import { AnimateIn } from "@/components/ui/animate-in";

const PILL_COUNT = 12;

export function CapabilityBand() {
  const t = useTranslations("capabilityBand");

  return (
    <section className="relative px-6 py-16 md:px-8 md:py-20" aria-label={t("ariaLabel")}>
      <div className="absolute inset-0 bg-accent/[0.015]" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl text-center">
        <AnimateIn>
          <h2 className="mx-auto mb-3 max-w-[600px] text-balance text-2xl font-medium leading-snug tracking-tight md:text-3xl">
            {t("heading")}
          </h2>
          <p className="mb-7 text-sm text-muted">
            {t("subheading")}
          </p>
        </AnimateIn>

        <AnimateIn delay={0.08}>
          <div className="mx-auto mb-7 flex max-w-[760px] flex-wrap justify-center gap-2">
            {Array.from({ length: PILL_COUNT }, (_, i) => (
              <span
                key={i}
                title={t(`pills.${i}.tip`)}
                className="pill-interactive cursor-default rounded-full border border-border/40 bg-card/50 px-4 py-2 text-[13px] font-medium text-foreground/80"
              >
                {t(`pills.${i}.label`)}
              </span>
            ))}
          </div>
        </AnimateIn>

        <AnimateIn delay={0.12}>
          <p className="mx-auto max-w-[480px] text-[13px] text-muted">
            {t("footer")}
          </p>
        </AnimateIn>
      </div>
    </section>
  );
}
