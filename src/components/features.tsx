"use client";

import { SectionWrapper } from "@/components/ui/section-wrapper";
import { AnimateIn, StaggerContainer, StaggerItem } from "@/components/ui/animate-in";
import { FEATURES } from "@/lib/constants";

export function Features() {
  const large = FEATURES.filter((f) => f.large);
  const standard = FEATURES.filter((f) => !f.large);

  return (
    <SectionWrapper id="features">
      <AnimateIn>
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">
            Features
          </p>
          <h2 className="mb-5 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Production-grade from{" "}
            <span className="gradient-text">every layer</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted">
            Security, cost control, and observability as first-class
            concerns — not afterthoughts bolted on later.
          </p>
        </div>
      </AnimateIn>

      {/* Two hero feature cards */}
      <StaggerContainer className="mb-5 grid gap-5 md:grid-cols-2">
        {large.map((f) => {
          const Icon = f.icon;
          return (
            <StaggerItem key={f.title}>
              <div className="card-hover group relative overflow-hidden rounded-xl border border-accent/15 bg-gradient-to-br from-accent/[0.06] to-transparent p-8 md:p-10">
                {/* Subtle glow */}
                <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-accent/[0.06] blur-3xl transition-opacity group-hover:opacity-100 opacity-50" />
                <div className="relative">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 transition-colors group-hover:border-accent/30">
                    <Icon className="h-6 w-6 text-accent-light" />
                  </div>
                  <h3 className="mb-3 text-xl font-semibold tracking-tight text-foreground">
                    {f.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted md:text-base md:leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      {/* Standard cards */}
      <StaggerContainer className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {standard.map((f) => {
          const Icon = f.icon;
          return (
            <StaggerItem key={f.title}>
              <div className="card-hover group rounded-xl border border-border/50 bg-card/40 p-6 md:p-8">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border border-accent/15 bg-accent/[0.07] transition-colors group-hover:border-accent/30 group-hover:bg-accent/10">
                  <Icon className="h-5 w-5 text-accent-light" />
                </div>
                <h3 className="mb-2 text-base font-semibold tracking-tight text-foreground md:text-lg">
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  {f.description}
                </p>
              </div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </SectionWrapper>
  );
}
