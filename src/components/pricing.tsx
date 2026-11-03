"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Coins,
  Mail,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { AnimateIn, StaggerContainer, StaggerItem } from "@/components/ui/animate-in";
import { WAITLIST_URL } from "@/lib/constants";
import { trackCtaClick, trackEvent } from "@/lib/analytics";

interface Plan {
  /** Billing id, used in analytics events. */
  name: string;
  /** Index into the locale `plans.*` catalog. */
  localeIndex: number;
  popular?: boolean;
  monthlyPrice: number;
  /** Number of feature bullets this plan's locale entry carries. */
  featureCount: number;
}

// Pricing decision 5 (2026-08-27) + the 2a credit re-denomination: Free $0 with
// 1,000 one-time credits and no card, Pro $29 with 10,000/month, Team $99 with
// 35,000/month, Enterprise from $1,500. There is no yearly price and no anchor
// price — inventing either would be inventing a number.
const PLANS: Plan[] = [
  { name: "free", localeIndex: 0, monthlyPrice: 0, featureCount: 4 },
  { name: "pro", localeIndex: 1, popular: true, monthlyPrice: 29, featureCount: 5 },
  { name: "team", localeIndex: 2, monthlyPrice: 99, featureCount: 4 },
];

const ENTERPRISE_FEATURE_KEYS = [
  "enterprise.features.0",
  "enterprise.features.1",
  "enterprise.features.2",
  "enterprise.features.3",
];

const EVERY_PLAN_KEYS = ["0", "1", "2", "3", "4", "5", "6", "7"] as const;
const BAND_KEYS = ["0", "1", "2", "3"] as const;
const PRESET_KEYS = ["0", "1", "2"] as const;
const PRICING_FAQ_INDICES = [0, 1, 2, 3, 4, 5, 6];
const TRUST_KEYS = ["trust.cancel", "trust.switch"] as const;

export function Pricing() {
  const t = useTranslations("pricing");

  // GA4 ecommerce `view_item_list` — fires when the pricing list is visible,
  // so later select_item / begin_checkout events stitch to the list view.
  useEffect(() => {
    trackEvent("view_item_list", {
      item_list_id: "landing_pricing_tiers",
      item_list_name: "Landing /pricing — Tier List",
      items: PLANS.map((p) => ({
        item_id: p.name,
        item_name: p.name,
        item_category: "subscription",
        price: p.monthlyPrice,
        quantity: 1,
      })),
    });
  }, []);

  return (
    <section
      aria-labelledby="pricing-heading"
      className="relative px-5 pt-20 pb-16 sm:px-6 md:px-8 md:pt-28 md:pb-20 lg:pt-32"
    >
      <div className="mx-auto max-w-6xl">
        {/* Hero */}
        <AnimateIn>
          <div className="mb-12 text-center md:mb-14">
            <p className="sr-only">
              {t("sectionLabel")}
            </p>
            <h1
              id="pricing-heading"
              className="mb-5 text-balance text-4xl font-bold tracking-tight md:text-5xl"
            >
              {t("heading")}
              <span className="gradient-text">{t("headingHighlight")}</span>
              {t("headingEnd")}
            </h1>
            <p className="mx-auto max-w-xl text-balance text-base text-muted md:text-lg">
              {t("subtitle")}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
              <span className="inline-flex items-center gap-1.5 text-foreground/90">
                <Zap className="h-4 w-4 shrink-0 text-accent-light" aria-hidden="true" />
                <span className="font-medium">{t("trustTrio.freeStart")}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-foreground/90">
                <ShieldCheck className="h-4 w-4 shrink-0 text-accent-light" aria-hidden="true" />
                <span className="font-medium">{t("trustTrio.moneyBack")}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-foreground/90">
                <Check className="h-4 w-4 shrink-0 text-accent-light" aria-hidden="true" />
                <span className="font-medium">{t("trustTrio.noCoding")}</span>
              </span>
            </div>
          </div>
        </AnimateIn>

        {/* Self-serve plans — Free / Pro / Team */}
        <StaggerContainer className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PLANS.map((plan) => {
            const planName = t(`plans.${plan.localeIndex}.name`);
            const isFree = plan.monthlyPrice === 0;

            return (
              <StaggerItem key={plan.name}>
                <div
                  className={`card-hover gradient-border glass-shine group relative flex h-full flex-col rounded-2xl border glass-card p-6 ${
                    plan.popular
                      ? "border-accent/50 bg-gradient-to-br from-accent/[0.08] to-transparent shadow-lg shadow-accent/10 ring-1 ring-accent/20"
                      : "border-border/50"
                  }`}
                >
                  {plan.popular && (
                    <div
                      className="absolute -top-3 left-1/2 z-10 -translate-x-1/2"
                      aria-hidden="true"
                    >
                      <span className="rounded-full border border-accent/30 bg-background px-3 py-1 text-xs font-semibold text-accent">
                        {t("popularBadge")}
                      </span>
                    </div>
                  )}

                  <h2 className="text-lg font-semibold text-foreground">
                    {plan.popular && (
                      <span className="sr-only">{t("a11y.mostPopular")} — </span>
                    )}
                    {planName}
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    {t(`plans.${plan.localeIndex}.tagline`)}
                  </p>

                  <div className="mt-4 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                    <span className="text-4xl font-bold tracking-tight text-foreground">
                      ${plan.monthlyPrice}
                    </span>
                    <span className="text-muted">/{t("priceSuffixMonthly")}</span>
                  </div>
                  <p className="mt-2 min-h-[1.25rem] text-xs text-muted">
                    {isFree ? t("freePriceNote") : t("monthlyNote")}
                  </p>

                  <a
                    href={WAITLIST_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      trackCtaClick({ location: "pricing_card", plan: plan.name });
                      trackEvent("select_item", {
                        item_list_id: "landing_pricing_tiers",
                        item_list_name: "Landing /pricing — Tier List",
                        items: [{
                          item_id: plan.name,
                          item_name: plan.name,
                          item_category: "subscription",
                          price: plan.monthlyPrice,
                          quantity: 1,
                        }],
                      });
                    }}
                    aria-label={t("a11y.ctaAria", { plan: planName })}
                    className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                      plan.popular
                        ? "btn-shine btn-glow btn-gradient text-white"
                        : "border border-border text-foreground hover:border-accent/40 hover:bg-accent/5"
                    }`}
                  >
                    {isFree ? t("startFree") : t("getStarted")}
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </a>

                  {!isFree && (
                    <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-muted">
                      <ShieldCheck className="h-3 w-3 shrink-0" aria-hidden="true" />
                      <span>{t("moneyBackDetail")}</span>
                    </p>
                  )}

                  <div className="mt-6 flex items-center gap-2 border-t border-border/50 pt-6 text-sm">
                    <Coins className="h-3.5 w-3.5 shrink-0 text-accent-light" aria-hidden="true" />
                    <span className="font-medium text-foreground">
                      {t(`plans.${plan.localeIndex}.credits`)}
                    </span>
                  </div>

                  <ul className="mt-4 flex-1 space-y-3">
                    {Array.from({ length: plan.featureCount }, (_, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-sm text-muted"
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                        <span className="break-words">
                          {t(`plans.${plan.localeIndex}.features.${i}`)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>

      <div className="mx-auto max-w-6xl">
        {/* Trust strip */}
        <AnimateIn delay={0.08}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted">
            {TRUST_KEYS.map((key) => (
              <span key={key} className="flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                {t(key)}
              </span>
            ))}
          </div>
        </AnimateIn>

        {/* In every plan */}
        <AnimateIn delay={0.1}>
          <div className="mt-12 rounded-2xl border border-border/50 glass-card p-6 md:p-8">
            <h2 className="text-lg font-semibold text-foreground">{t("everyPlan.heading")}</h2>
            <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
              {EVERY_PLAN_KEYS.map((key) => (
                <li key={key} className="flex items-center gap-2 text-sm text-muted">
                  <Check className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
                  <span className="break-words">{t(`everyPlan.items.${key}`)}</span>
                </li>
              ))}
            </ul>
          </div>
        </AnimateIn>

        {/* What a task costs (credit bands) + model presets */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <AnimateIn delay={0.12}>
            <div className="h-full rounded-2xl border border-border/50 glass-card p-6 md:p-8">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <Coins className="h-4 w-4 shrink-0 text-accent-light" aria-hidden="true" />
                {t("bands.heading")}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {BAND_KEYS.map((key) => (
                  <li key={key} className="flex items-start gap-2.5 text-sm text-muted">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                    <span className="break-words">{t(`bands.items.${key}`)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[13px] leading-relaxed text-muted">
                {t("bands.freeEquivalent")}
              </p>
              <p className="mt-3 border-t border-border/50 pt-3 text-xs leading-relaxed text-muted/80">
                {t("bands.note")}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted/80">
                {t("bands.rate")}
              </p>
            </div>
          </AnimateIn>

          <AnimateIn delay={0.14}>
            <div className="h-full rounded-2xl border border-border/50 glass-card p-6 md:p-8">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <Sparkles className="h-4 w-4 shrink-0 text-accent-light" aria-hidden="true" />
                {t("presets.heading")}
              </h2>
              <dl className="mt-4 space-y-3">
                {PRESET_KEYS.map((key) => (
                  <div key={key}>
                    <dt className="text-sm font-semibold text-foreground">
                      {t(`presets.items.${key}.name`)}
                    </dt>
                    <dd className="text-[13px] leading-relaxed text-muted">
                      {t(`presets.items.${key}.description`)}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 border-t border-border/50 pt-3 text-xs leading-relaxed text-muted/80">
                {t("presets.note")}
              </p>
            </div>
          </AnimateIn>
        </div>

        {/* Enterprise band */}
        <AnimateIn delay={0.16}>
          <div className="mt-6 rounded-2xl border border-border/50 glass-card p-6 md:p-8">
            <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center md:gap-10">
              <div>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2 className="text-lg font-semibold text-foreground">
                    {t("enterprise.name")}
                  </h2>
                  <span className="text-sm text-muted">
                    {t("enterprise.subtitle")}
                  </span>
                  <span className="ml-auto text-base font-semibold text-foreground md:hidden">
                    {t("enterprise.price")}
                  </span>
                </div>
                <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                  {ENTERPRISE_FEATURE_KEYS.map((key) => (
                    <li key={key} className="flex items-center gap-2 text-sm text-muted">
                      <Check className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
                      <span className="break-words">{t(key)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col items-stretch gap-2 md:items-end">
                <span className="hidden text-2xl font-bold tracking-tight text-foreground md:inline">
                  {t("enterprise.price")}
                </span>
                <a
                  href="mailto:sales@openlegion.ai"
                  onClick={() => trackCtaClick({ location: "pricing_enterprise" })}
                  aria-label={t("a11y.ctaAria", { plan: t("enterprise.name") })}
                  className="flex items-center justify-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground transition-all hover:border-accent/40 hover:bg-accent/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background md:min-w-[180px]"
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  {t("enterprise.cta")}
                </a>
              </div>
            </div>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}

export function PricingFAQ() {
  const t = useTranslations("pricing");

  return (
    <section
      aria-labelledby="pricing-faq-heading"
      className="relative px-5 pb-20 sm:px-6 md:px-8 md:pb-28"
    >
      <AnimateIn>
        <div className="mx-auto max-w-3xl">
          <h2
            id="pricing-faq-heading"
            className="mb-8 text-center text-2xl font-bold tracking-tight md:text-3xl"
          >
            {t("faqHeading")}
          </h2>
          <div className="space-y-3">
            {PRICING_FAQ_INDICES.map((i) => (
              <details
                key={i}
                className="faq-details gradient-border glass-shine group overflow-hidden rounded-xl border border-border/50 glass-card transition-all duration-300"
              >
                <summary className="flex w-full cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset [&::-webkit-details-marker]:hidden">
                  <span className="text-sm font-medium text-foreground md:text-base">
                    {t(`faq.${i}.question`)}
                  </span>
                  <ChevronDown
                    className="h-4 w-4 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <div className="faq-answer px-6 pb-5">
                  <p className="text-sm leading-relaxed text-muted">
                    {t(`faq.${i}.answer`)}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </AnimateIn>
    </section>
  );
}
