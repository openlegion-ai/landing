"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Coins,
  FolderOpen,
  Globe,
  Mail,
} from "lucide-react";
import { AnimateIn, StaggerContainer, StaggerItem } from "@/components/ui/animate-in";
import { APP_URL } from "@/lib/constants";
import { Link } from "@/i18n/navigation";

type Billing = "monthly" | "yearly";

interface Plan {
  name: string;
  popular?: boolean;
  monthlyPrice: number;
  yearlyPrice: number;
  yearlyMonthly: number;
  agents: number;
  credits: number;
  projects: number;
  browsers: number;
  featureKeys: string[];
}

const PLANS: Plan[] = [
  {
    name: "basic",
    monthlyPrice: 19,
    yearlyPrice: 170,
    yearlyMonthly: 14,
    agents: 1,
    credits: 1500,
    projects: 0,
    browsers: 1,
    featureKeys: ["planFeatures.0", "planFeatures.1", "planFeatures.2", "planFeatures.3", "planFeatures.5"],
  },
  {
    name: "growth",
    popular: true,
    monthlyPrice: 59,
    yearlyPrice: 530,
    yearlyMonthly: 44,
    agents: 5,
    credits: 5000,
    projects: 2,
    browsers: 5,
    featureKeys: ["planFeatures.0", "planFeatures.1", "planFeatures.2", "planFeatures.3", "planFeatures.5"],
  },
  {
    name: "pro",
    monthlyPrice: 149,
    yearlyPrice: 1340,
    yearlyMonthly: 112,
    agents: 15,
    credits: 10000,
    projects: 5,
    browsers: 10,
    featureKeys: ["planFeatures.4", "planFeatures.0", "planFeatures.1", "planFeatures.2", "planFeatures.3", "planFeatures.5"],
  },
];

const ENTERPRISE_FEATURE_KEYS = [
  "enterprise.features.0",
  "enterprise.features.1",
  "enterprise.features.2",
  "enterprise.features.3",
];

const PRICING_FAQ_INDICES = [0, 1, 2, 3, 4, 5, 6];

const TRUST_KEYS = ["trust.cancel", "trust.switch"] as const;

export function Pricing() {
  const [billing, setBilling] = useState<Billing>("monthly");
  const t = useTranslations("pricing");
  const tAnchors = useTranslations("pricingAnchors");

  return (
    <section className="relative px-5 pt-28 pb-16 sm:px-6 md:px-8 md:pt-36 md:pb-24 lg:pt-40 lg:pb-32">
      <div className="mx-auto max-w-6xl">
        {/* Hero */}
        <AnimateIn>
          <div className="mb-12 text-center md:mb-14">
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-accent">
              {t("sectionLabel")}
            </p>
            <h1 className="mb-5 text-balance text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              {t("heading")}
              <span className="gradient-text">{t("headingHighlight")}</span>
              {t("headingEnd")}
            </h1>
            <p className="mx-auto max-w-xl text-balance text-base text-muted md:text-lg">
              {t("subtitle")}
            </p>
          </div>
        </AnimateIn>

        {/* Billing toggle */}
        <AnimateIn delay={0.06}>
          <div className="mb-10 flex items-center justify-center md:mb-12">
            <div
              className="inline-flex items-center rounded-full border border-border bg-card/50 p-1"
              role="group"
              aria-label={t("billingPeriodAriaLabel")}
            >
              <button
                onClick={() => setBilling("monthly")}
                aria-pressed={billing === "monthly"}
                className={`min-h-[44px] cursor-pointer rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
                  billing === "monthly"
                    ? "bg-accent text-white shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {t("billingMonthly")}
              </button>
              <button
                onClick={() => setBilling("yearly")}
                aria-pressed={billing === "yearly"}
                className={`min-h-[44px] cursor-pointer rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
                  billing === "yearly"
                    ? "bg-accent text-white shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {t("billingYearly")}
                <span className="ml-1.5 text-xs font-semibold text-emerald-400">
                  {t("billingSaveLabel")}
                </span>
              </button>
            </div>
          </div>
        </AnimateIn>

        {/* Plan cards */}
        <StaggerContainer className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((plan, planIdx) => {
            const price =
              billing === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
            const suffix = billing === "monthly" ? t("priceSuffixMonthly") : t("priceSuffixYearly");
            const anchorKey = `${plan.name}${billing === "monthly" ? "Monthly" : "Yearly"}`;
            const anchor = (() => {
              try {
                return tAnchors(anchorKey);
              } catch {
                return null;
              }
            })();
            const anchorNum = anchor ? parseInt(anchor.replace(/,/g, ""), 10) : null;
            const savingsAmount =
              anchorNum && !Number.isNaN(anchorNum) ? anchorNum - price : null;
            const savingsPercent =
              anchorNum && !Number.isNaN(anchorNum) && anchorNum > 0
                ? Math.round((1 - price / anchorNum) * 100)
                : null;

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
                    <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
                      <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-md shadow-accent/30">
                        {t("popularBadge")}
                      </span>
                    </div>
                  )}

                  <h3 className="text-lg font-semibold text-foreground">
                    {t(`plans.${planIdx}.name`)}
                  </h3>
                  <div className="mt-3">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-4xl font-bold tracking-tight text-foreground">
                        ${price.toLocaleString()}
                      </span>
                      <span className="text-muted">{suffix}</span>
                    </div>
                    {anchor && (
                      <div className="mt-2 space-y-1.5">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <s
                            className="text-base text-muted line-through"
                            aria-label={`Original price $${anchor}`}
                          >
                            ${anchor}
                          </s>
                          {savingsAmount !== null && savingsPercent !== null && (
                            <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-400">
                              {t("savingsPill", {
                                amount: savingsAmount.toLocaleString(),
                                suffix:
                                  billing === "monthly"
                                    ? t("priceSuffixMonthly")
                                    : t("priceSuffixYearly"),
                                percent: savingsPercent,
                              })}
                            </span>
                          )}
                        </div>
                        <p className="flex items-center gap-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                          <Clock className="size-3.5 shrink-0" aria-hidden="true" />
                          {t("urgencyHint")}
                        </p>
                      </div>
                    )}
                  </div>
                  <p className="mt-1 h-5 text-xs text-muted">
                    {billing === "yearly"
                      ? t("yearlyBilledNote", { monthlyEquivalent: plan.yearlyMonthly })
                      : t("monthlyNote")}
                  </p>

                  <a
                    href={APP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all ${
                      plan.popular
                        ? "btn-shine btn-glow btn-gradient text-white"
                        : "border border-border text-foreground hover:border-accent/40 hover:bg-accent/5"
                    }`}
                  >
                    {t("getStarted")}
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </a>

                  <div className="mt-6 space-y-2.5 border-t border-border/50 pt-6 text-sm">
                    <div className="flex items-center gap-2 text-muted">
                      <Bot className="h-3.5 w-3.5 shrink-0 text-accent-light" />
                      <span className="font-medium text-foreground">
                        {plan.agents}
                      </span>{" "}
                      {t("agentsLabel", { count: plan.agents })}
                    </div>
                    <div className="flex items-center gap-2 text-muted">
                      <Globe className="h-3.5 w-3.5 shrink-0 text-accent-light" />
                      <span className="font-medium text-foreground">
                        {plan.browsers}
                      </span>{" "}
                      {t("browsersLabel", { count: plan.browsers })}
                    </div>
                    <div className="flex items-center gap-2 text-muted">
                      <Coins className="h-3.5 w-3.5 shrink-0 text-accent-light" />
                      <span className="font-medium text-foreground">
                        {plan.credits.toLocaleString()}
                      </span>{" "}
                      {t("creditsLabel")}
                    </div>
                    <div className="flex items-center gap-2 text-muted">
                      <FolderOpen className="h-3.5 w-3.5 shrink-0 text-accent-light" />
                      {plan.projects > 0 ? (
                        <>
                          <span className="font-medium text-foreground">
                            {plan.projects}
                          </span>{" "}
                          {t("projectsLabel", { count: plan.projects })}
                        </>
                      ) : (
                        <span className="text-muted/50">{t("noProjects")}</span>
                      )}
                    </div>
                  </div>

                  <ul className="mt-4 flex-1 space-y-3">
                    {plan.featureKeys.map((key) => (
                      <li
                        key={key}
                        className="flex items-start gap-2.5 text-sm text-muted"
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                        <span className="break-words">{t(key)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </StaggerItem>
            );
          })}

          {/* Enterprise */}
          <StaggerItem>
            <div className="card-hover gradient-border glass-shine group relative flex h-full flex-col rounded-2xl border border-border/50 glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground">
                {t("enterprise.name")}
              </h3>
              <div className="mt-3">
                <span className="text-4xl font-bold tracking-tight text-foreground">
                  {t("enterprise.price")}
                </span>
              </div>
              <p className="mt-1 h-5 text-xs text-muted">
                {t("enterprise.subtitle")}
              </p>

              <a
                href="mailto:sales@openlegion.ai"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground transition-all hover:border-accent/40 hover:bg-accent/5"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                {t("enterprise.cta")}
              </a>

              <div className="mt-6 space-y-2.5 border-t border-border/50 pt-6 text-sm">
                <div className="flex items-center gap-2 text-muted">
                  <Bot className="h-3.5 w-3.5 shrink-0 text-accent-light" />
                  <span className="font-medium text-foreground">
                    {t("enterprise.unlimitedAgents")}
                  </span>{" "}
                  {t("enterprise.agents")}
                </div>
                <div className="flex items-center gap-2 text-muted">
                  <Globe className="h-3.5 w-3.5 shrink-0 text-accent-light" />
                  <span className="font-medium text-foreground">
                    {t("enterprise.unlimitedAgents")}
                  </span>{" "}
                  {t("enterprise.browsers")}
                </div>
                <div className="flex items-center gap-2 text-muted">
                  <FolderOpen className="h-3.5 w-3.5 shrink-0 text-accent-light" />
                  <span className="font-medium text-foreground">
                    {t("enterprise.unlimitedAgents")}
                  </span>{" "}
                  {t("enterprise.projects")}
                </div>
              </div>

              <ul className="mt-4 flex-1 space-y-3">
                {ENTERPRISE_FEATURE_KEYS.map((key) => (
                  <li
                    key={key}
                    className="flex items-start gap-2.5 text-sm text-muted"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span className="break-words">{t(key)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </StaggerItem>
        </StaggerContainer>

        {/* Trust strip */}
        <AnimateIn delay={0.08}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted">
            <Link
              href="/money-back-guarantee"
              className="flex items-center gap-2 transition-colors hover:text-foreground"
            >
              <Check className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              <span className="underline decoration-border underline-offset-4 hover:decoration-foreground">
                {t("trust.moneyBack")}
              </span>
            </Link>
            {TRUST_KEYS.map((key) => (
              <span key={key} className="flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                {t(key)}
              </span>
            ))}
          </div>
        </AnimateIn>

        {/* Pricing FAQ */}
        <AnimateIn delay={0.1}>
          <div className="mx-auto mt-20 max-w-3xl">
            <h2 className="mb-8 text-center text-2xl font-bold tracking-tight md:text-3xl">
              {t("faqHeading")}
            </h2>
            <div className="space-y-3">
              {PRICING_FAQ_INDICES.map((i) => (
                <details key={i} className="faq-details gradient-border glass-shine overflow-hidden rounded-xl border border-border/50 glass-card transition-all duration-300 group">
                  <summary className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-white/[0.02] list-none [&::-webkit-details-marker]:hidden">
                    <span className="text-sm font-medium text-foreground md:text-base">
                      {t(`faq.${i}.question`)}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <div className="faq-answer px-6 pb-5">
                    <p className="text-sm leading-relaxed text-muted">{t(`faq.${i}.answer`)}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
