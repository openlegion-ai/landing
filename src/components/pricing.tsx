"use client";

import { useState } from "react";
import { Bot, Check, FolderOpen, Globe, ChevronRight, Mail, Shield, DollarSign, LayoutDashboard, Plug } from "lucide-react";
import { ChevronDown } from "lucide-react";
import { AnimateIn, StaggerContainer, StaggerItem } from "@/components/ui/animate-in";
import { APP_URL } from "@/lib/constants";

type Billing = "monthly" | "yearly";

interface Plan {
  name: string;
  label: string;
  popular?: boolean;
  monthlyPrice: number;
  yearlyPrice: number;
  yearlyMonthly: number;
  agents: number;
  projects: number;
  browsers: number;
  features: string[];
}

const PLANS: Plan[] = [
  {
    name: "basic",
    label: "Basic",
    monthlyPrice: 19,
    yearlyPrice: 170,
    yearlyMonthly: 14,
    agents: 1,
    projects: 0,
    browsers: 1,
    features: [
      "Each agent runs in its own secure container",
      "Works with Claude, GPT, Gemini + 100 more",
      "Watch every agent, cost, and event live",
      "Your own deployment URL",
    ],
  },
  {
    name: "growth",
    label: "Growth",
    popular: true,
    monthlyPrice: 59,
    yearlyPrice: 530,
    yearlyMonthly: 44,
    agents: 5,
    projects: 2,
    browsers: 5,
    features: [
      "Each agent runs in its own secure container",
      "Works with Claude, GPT, Gemini + 100 more",
      "Watch every agent, cost, and event live",
      "Your own deployment URL",
    ],
  },
  {
    name: "pro",
    label: "Pro",
    monthlyPrice: 149,
    yearlyPrice: 1340,
    yearlyMonthly: 112,
    agents: 15,
    projects: 5,
    browsers: 10,
    features: [
      "Dedicated compute — no shared resources",
      "Each agent runs in its own secure container",
      "Works with Claude, GPT, Gemini + 100 more",
      "Watch every agent, cost, and event live",
      "Your own deployment URL",
    ],
  },
];

const ENTERPRISE_FEATURES = [
  "Dedicated infrastructure",
  "Custom SLAs",
  "Priority support",
  "On-premises deployment",
];

const INCLUDED = [
  { icon: Shield, title: "Vault security", sub: "Keys never exposed" },
  { icon: DollarSign, title: "Budget controls", sub: "Agents auto-stop" },
  { icon: Plug, title: "100+ LLM providers", sub: "No vendor lock-in" },
  { icon: LayoutDashboard, title: "Fleet dashboard", sub: "Live cost tracking" },
];

const PRICING_FAQ = [
  {
    q: "Do I need to pay for LLM usage on top of the plan price?",
    a: "Yes — you bring your own API keys (Anthropic, OpenAI, Google, or any of 100+ providers). You pay providers directly at their published rates. OpenLegion charges for the platform only. There is zero markup on model usage.",
  },
  {
    q: "Can I switch plans?",
    a: "Yes — upgrade or downgrade any time. Changes take effect at the start of your next billing period.",
  },
  {
    q: "What happens to my agents if I cancel?",
    a: "Your agent configurations and data remain accessible for 30 days after cancellation. You can export everything before your account closes.",
  },
  {
    q: "Can I self-host OpenLegion?",
    a: "Yes. Clone the repo, run three commands, and you have a full agent fleet on your own infrastructure. The engine is source-available under BSL 1.1. Managed hosting starts at $19/month for teams that don't want to manage infrastructure.",
  },
  {
    q: 'What counts as an "agent"?',
    a: "Each deployed agent container counts as one agent toward your plan limit. Templates like Dev Team (PM + Engineer + Reviewer) count as 3 agents.",
  },
];

export function Pricing() {
  const [billing, setBilling] = useState<Billing>("monthly");

  return (
    <section className="relative px-5 pt-28 pb-16 sm:px-6 md:px-8 md:pt-36 md:pb-28 lg:pt-40 lg:pb-36">
      <div className="mx-auto max-w-6xl">
        <AnimateIn>
          <div className="mb-10 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">
              Pricing
            </p>
            <h1 className="mb-4 text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              Your AI workforce, from{" "}
              <span className="gradient-text">$19/month</span>.
            </h1>
            <p className="mx-auto max-w-lg text-muted">
              No surprise bills — ever. You bring your API keys, we run the infrastructure.
            </p>
          </div>
        </AnimateIn>

        {/* What's included strip */}
        <AnimateIn delay={0.04}>
          <div className="mx-auto mb-12 grid max-w-3xl grid-cols-2 gap-6 md:grid-cols-4">
            {INCLUDED.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="text-center">
                  <Icon className="mx-auto mb-2 h-5 w-5 text-accent-light" />
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted">{item.sub}</p>
                </div>
              );
            })}
          </div>
        </AnimateIn>

        {/* Billing toggle */}
        <AnimateIn delay={0.06}>
          <div className="mb-12 flex items-center justify-center">
            <div
              className="inline-flex items-center rounded-full border border-border bg-card/50 p-1"
              role="group"
              aria-label="Billing period"
            >
              <button
                onClick={() => setBilling("monthly")}
                aria-pressed={billing === "monthly"}
                className={`cursor-pointer rounded-full px-5 py-2 text-sm font-medium transition-all ${
                  billing === "monthly"
                    ? "bg-accent text-white shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling("yearly")}
                aria-pressed={billing === "yearly"}
                className={`cursor-pointer rounded-full px-5 py-2 text-sm font-medium transition-all ${
                  billing === "yearly"
                    ? "bg-accent text-white shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Yearly
                <span className="ml-1.5 text-xs font-semibold text-emerald-400">
                  Save ~25%
                </span>
              </button>
            </div>
          </div>
        </AnimateIn>

        {/* Cards */}
        <StaggerContainer className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((plan) => {
            const price =
              billing === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
            const suffix = billing === "monthly" ? "/mo" : "/yr";

            return (
              <StaggerItem key={plan.name}>
                <div
                  className={`card-hover gradient-border glass-shine group relative flex h-full flex-col rounded-xl border glass-card p-6 ${
                    plan.popular
                      ? "border-accent/30 bg-gradient-to-br from-accent/[0.06] to-transparent"
                      : "border-border/50"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
                      <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
                        Popular
                      </span>
                    </div>
                  )}

                  <h3 className="text-lg font-semibold text-foreground">
                    {plan.label}
                  </h3>
                  <div className="mt-3">
                    <span className="text-4xl font-bold tracking-tight text-foreground">
                      ${price.toLocaleString()}
                    </span>
                    <span className="text-muted">{suffix}</span>
                  </div>
                  <p className="mt-1 h-5 text-xs text-muted">
                    {billing === "yearly"
                      ? `~$${plan.yearlyMonthly}/mo billed annually`
                      : "\u00A0"}
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
                    Get Started
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </a>

                  <div className="mt-6 space-y-2.5 border-t border-border/50 pt-6 text-sm">
                    <div className="flex items-center gap-2 text-muted">
                      <Bot className="h-3.5 w-3.5 shrink-0 text-accent-light" />
                      <span className="font-medium text-foreground">
                        {plan.agents}
                      </span>{" "}
                      agent{plan.agents !== 1 ? "s" : ""}
                    </div>
                    <div className="flex items-center gap-2 text-muted">
                      <Globe className="h-3.5 w-3.5 shrink-0 text-accent-light" />
                      <span className="font-medium text-foreground">
                        {plan.browsers}
                      </span>{" "}
                      concurrent browser{plan.browsers !== 1 ? "s" : ""}
                    </div>
                    <div className="flex items-center gap-2 text-muted">
                      <FolderOpen className="h-3.5 w-3.5 shrink-0 text-accent-light" />
                      {plan.projects > 0 ? (
                        <>
                          <span className="font-medium text-foreground">
                            {plan.projects}
                          </span>{" "}
                          project{plan.projects !== 1 ? "s" : ""}
                        </>
                      ) : (
                        <span className="text-muted/50">No projects</span>
                      )}
                    </div>
                  </div>

                  <ul className="mt-4 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2.5 text-sm text-muted"
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                        <span className="break-words">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </StaggerItem>
            );
          })}

          {/* Enterprise */}
          <StaggerItem>
            <div className="card-hover gradient-border glass-shine group relative flex h-full flex-col rounded-xl border border-border/50 glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground">
                Enterprise
              </h3>
              <div className="mt-3">
                <span className="text-4xl font-bold tracking-tight text-foreground">
                  Custom
                </span>
              </div>
              <p className="mt-1 h-5 text-xs text-muted">
                Tailored to your needs
              </p>

              <a
                href="mailto:sales@openlegion.ai"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground transition-all hover:border-accent/40 hover:bg-accent/5"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                Contact Us
              </a>

              <div className="mt-6 space-y-2.5 border-t border-border/50 pt-6 text-sm">
                <div className="flex items-center gap-2 text-muted">
                  <Bot className="h-3.5 w-3.5 shrink-0 text-accent-light" />
                  <span className="font-medium text-foreground">
                    Unlimited
                  </span>{" "}
                  agents
                </div>
                <div className="flex items-center gap-2 text-muted">
                  <Globe className="h-3.5 w-3.5 shrink-0 text-accent-light" />
                  <span className="font-medium text-foreground">
                    Unlimited
                  </span>{" "}
                  concurrent browsers
                </div>
                <div className="flex items-center gap-2 text-muted">
                  <FolderOpen className="h-3.5 w-3.5 shrink-0 text-accent-light" />
                  <span className="font-medium text-foreground">
                    Unlimited
                  </span>{" "}
                  projects
                </div>
              </div>

              <ul className="mt-4 flex-1 space-y-3">
                {ENTERPRISE_FEATURES.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 text-sm text-muted"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span className="break-words">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </StaggerItem>
        </StaggerContainer>

        {/* Pricing FAQ */}
        <AnimateIn delay={0.1}>
          <div className="mx-auto mt-20 max-w-3xl">
            <h2 className="mb-8 text-center text-2xl font-bold tracking-tight md:text-3xl">
              Common questions
            </h2>
            <div className="space-y-3">
              {PRICING_FAQ.map((item, i) => (
                <details key={i} className="faq-details gradient-border glass-shine overflow-hidden rounded-xl border border-border/50 glass-card transition-all duration-300 group">
                  <summary className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-white/[0.02] list-none [&::-webkit-details-marker]:hidden">
                    <span className="text-sm font-medium text-foreground md:text-base">
                      {item.q}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <div className="faq-answer px-6 pb-5">
                    <p className="text-sm leading-relaxed text-muted">{item.a}</p>
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
