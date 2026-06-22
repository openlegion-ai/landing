import { Link } from "@/i18n/navigation";
import { Check, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionWrapper } from "@/components/ui/section-wrapper";
import { AnimateIn, StaggerContainer, StaggerItem } from "@/components/ui/animate-in";
import { ArchitectureDiagram } from "@/components/architecture";
import { SECURITY_LAYERS, DEMO_URL } from "@/lib/constants";

const ENTERPRISE_SIGNAL_COUNT = 6;

/**
 * Consolidated trust section. Previously three back-to-back sections —
 * Security (layer list), Architecture (trust-zone diagram), and Enterprise
 * (production-signals card) — that all re-asserted the same defense-in-depth
 * story across ~3 scroll-lengths. Now one section: the layers and the zone map
 * sit side by side (two views of one story) with the enterprise signals as a
 * closing strip. All copy/links and the `#security` + `#architecture` anchors
 * are preserved, so nothing is lost for SEO/GEO or nav.
 */
export function Security() {
  const t = useTranslations("security");
  const ta = useTranslations("architecture");
  const te = useTranslations("enterprise");

  return (
    <SectionWrapper id="security" fade={false}>
      <AnimateIn>
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">
            {t("sectionLabel")}
          </p>
          <h2 className="mb-5 text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            {t("heading")}
            <span className="gradient-text">{t("headingHighlight")}</span>{t("headingEnd")}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted">
            {t("subtitle")}
          </p>
        </div>
      </AnimateIn>

      {/* Two views of defense-in-depth: the layers (what protects you) beside
          the trust-zone map (where the boundaries are). */}
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
        {/* Layers */}
        <div>
          <StaggerContainer className="space-y-0">
            {SECURITY_LAYERS.slice(0, 4).map((layer, i) => (
              <StaggerItem key={layer.number}>
                {i > 0 && (
                  <div className="flex justify-center" aria-hidden="true">
                    <div className="connector-line h-4 w-px bg-gradient-to-b from-accent/20 to-accent/5" />
                  </div>
                )}
                <div className="card-hover gradient-border glass-shine group rounded-xl border border-accent/15 glass-card p-5 md:p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent/20 to-accent/[0.06] ring-1 ring-accent/20 transition group-hover:scale-110 group-hover:ring-accent/40">
                      <span className="font-mono text-xs font-bold text-accent-light">
                        {String(layer.number).padStart(2, "0")}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="mb-1 text-base font-semibold text-foreground">
                        {t(`layers.${i}.title`)}
                      </h3>
                      <p className="text-sm leading-relaxed text-muted">
                        {t(`layers.${i}.description`)}
                      </p>
                    </div>
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-success transition-transform group-hover:scale-110" aria-hidden="true" />
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
          <AnimateIn delay={0.2}>
            <p className="mt-6 text-center text-sm text-muted lg:text-left">
              <Link href="/learn/ai-agent-security" className="text-accent-light underline underline-offset-2 hover:text-accent transition-colors">
                {t("allLayersLink")}
              </Link>
            </p>
          </AnimateIn>
        </div>

        {/* Trust-zone diagram */}
        <div id="architecture">
          <AnimateIn>
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-accent">
              {ta("sectionLabel")}
            </p>
            <h3 className="mb-5 text-balance text-lg font-semibold text-foreground">
              {ta("title")}
            </h3>
          </AnimateIn>
          <ArchitectureDiagram />
          <AnimateIn delay={0.2}>
            <p className="mt-6 text-center text-sm text-muted lg:text-left">
              <Link href="/learn/ai-agent-orchestration" className="text-accent-light underline underline-offset-2 hover:text-accent transition-colors">
                {ta("learnMoreLink")}
              </Link>
            </p>
          </AnimateIn>
        </div>
      </div>

      {/* Enterprise production signals — demoted from a standalone section to a
          closing strip; "Book a demo" also remains the secondary CTA below. */}
      <AnimateIn delay={0.1}>
        <div className="gradient-border glass-shine mx-auto mt-14 max-w-3xl rounded-xl border border-border/50 glass-card p-6 text-center md:p-8">
          <p className="mb-4 text-base font-semibold text-foreground">
            {te("heading")}
          </p>
          <div className="mb-6 flex flex-wrap justify-center gap-2">
            {Array.from({ length: ENTERPRISE_SIGNAL_COUNT }, (_, i) => (
              <span
                key={i}
                className="flex items-center gap-1.5 rounded-full border border-success/15 bg-success/[0.05] px-3 py-1 text-xs font-medium text-muted"
              >
                <Check className="h-3 w-3 text-success/70" aria-hidden="true" />
                {te(`signals.${i}`)}
              </span>
            ))}
          </div>
          <a
            href={DEMO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground transition-all hover:border-accent/40 hover:bg-accent/5"
          >
            {te("cta")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </a>
        </div>
      </AnimateIn>
    </SectionWrapper>
  );
}
