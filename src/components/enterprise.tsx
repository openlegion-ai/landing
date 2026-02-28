"use client";

import { SectionWrapper } from "@/components/ui/section-wrapper";
import { AnimateIn, StaggerContainer, StaggerItem } from "@/components/ui/animate-in";
import { ENTERPRISE_FEATURES } from "@/lib/constants";

export function Enterprise() {
  return (
    <SectionWrapper id="enterprise">
      <AnimateIn>
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">
            Enterprise
          </p>
          <h2 className="mb-5 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Built for{" "}
            <span className="gradient-text">enterprise</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted">
            Production security, governance, and compliance built in from day
            one — not bolted on as an afterthought.
          </p>
        </div>
      </AnimateIn>

      <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ENTERPRISE_FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <StaggerItem key={f.title}>
              <div className="card-hover group relative flex h-full flex-col rounded-xl border border-border/50 bg-card/40 p-6 md:p-8">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border border-accent/15 bg-accent/[0.07] transition-colors group-hover:border-accent/30">
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
