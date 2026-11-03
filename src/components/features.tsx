import { Link } from "@/i18n/navigation";
import { Shield, DollarSign, Monitor } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionWrapper } from "@/components/ui/section-wrapper";
import { AnimateIn, StaggerContainer, StaggerItem } from "@/components/ui/animate-in";

const OUTCOMES = [
  {
    icon: Shield,
    link: { href: "/learn/ai-agent-security" },
  },
  {
    icon: DollarSign,
    link: { href: "/learn/ai-agent-platform" },
  },
  {
    icon: Monitor,
    link: { href: "/learn/ai-agent-orchestration" },
  },
];

export function Features() {
  const t = useTranslations("features");

  return (
    <SectionWrapper id="features" glow>
      <AnimateIn>
        <div className="mb-12 text-center">
          <p className="sr-only">
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

      {/* Ruled feature list — a Linear-style asymmetric row per outcome
          (title left, argument right), not another card grid. */}
      <StaggerContainer className="mx-auto max-w-4xl">
        {OUTCOMES.map((outcome, i) => {
          const Icon = outcome.icon;
          return (
            <StaggerItem key={i}>
              <div className="grid gap-3 border-t border-border py-8 last:border-b md:grid-cols-[minmax(240px,300px)_1fr] md:gap-12">
                <div className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-accent" />
                  <h3 className="text-[17px] font-semibold leading-snug text-foreground">
                    {t(`outcomes.${i}.title`)}
                  </h3>
                </div>
                <div>
                  <p className="mb-2.5 text-[15px] leading-relaxed text-muted">
                    {t(`outcomes.${i}.description`)}
                  </p>
                  <Link
                    href={outcome.link.href}
                    className="text-sm font-medium text-accent-light transition-colors hover:text-accent hover:underline"
                  >
                    {t(`outcomes.${i}.linkLabel`)}
                  </Link>
                </div>
              </div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      <AnimateIn delay={0.15}>
        <p className="mt-8 text-center text-sm text-muted">
          <Link
            href="/learn/ai-agent-platform"
            className="text-accent-light underline underline-offset-2 transition-colors hover:text-accent"
          >
            {t("allFeaturesLink")}
          </Link>
        </p>
      </AnimateIn>
    </SectionWrapper>
  );
}
