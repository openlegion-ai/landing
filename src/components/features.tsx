import Link from "next/link";
import { Shield, DollarSign, Monitor } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionWrapper } from "@/components/ui/section-wrapper";
import { AnimateIn, StaggerContainer, StaggerItem } from "@/components/ui/animate-in";

const OUTCOMES = [
  {
    icon: Shield,
    link: { href: "/ai-agent-security" },
  },
  {
    icon: DollarSign,
    link: { href: "/ai-agent-platform" },
  },
  {
    icon: Monitor,
    link: { href: "/ai-agent-orchestration" },
  },
];

export function Features() {
  const t = useTranslations("features");

  return (
    <SectionWrapper id="features" glow>
      <AnimateIn>
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">
            {t("sectionLabel")}
          </p>
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            {t("heading")}
            <span className="gradient-text">{t("headingHighlight")}</span>{t("headingEnd")}
          </h2>
          <p className="mx-auto max-w-xl text-sm text-muted">
            {t("subtitle")}
          </p>
        </div>
      </AnimateIn>

      <StaggerContainer className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
        {OUTCOMES.map((outcome, i) => {
          const Icon = outcome.icon;
          return (
            <StaggerItem key={i}>
              <div className="card-hover gradient-border glass-shine group flex h-full flex-col rounded-xl border border-border/50 glass-card p-6">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-accent/15 bg-accent/[0.07] transition group-hover:border-accent/30 group-hover:scale-110">
                    <Icon className="h-[18px] w-[18px] text-accent-light" />
                  </div>
                  <h3 className="text-[15px] font-medium leading-snug text-foreground">
                    {t(`outcomes.${i}.title`)}
                  </h3>
                </div>
                <p className="mb-4 flex-1 text-[13px] leading-relaxed text-muted">
                  {t(`outcomes.${i}.description`)}
                </p>
                <Link
                  href={outcome.link.href}
                  className="text-xs font-medium text-accent-light transition-colors hover:text-accent hover:underline"
                >
                  {t(`outcomes.${i}.linkLabel`)}
                </Link>
              </div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      <AnimateIn delay={0.15}>
        <p className="mt-8 text-center text-sm text-muted">
          <Link
            href="/ai-agent-platform"
            className="text-accent-light underline underline-offset-2 transition-colors hover:text-accent"
          >
            {t("allFeaturesLink")}
          </Link>
        </p>
      </AnimateIn>
    </SectionWrapper>
  );
}
