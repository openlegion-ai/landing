"use client";

import { SectionWrapper } from "@/components/ui/section-wrapper";
import { AnimateIn, StaggerContainer, StaggerItem } from "@/components/ui/animate-in";
import { USE_CASES } from "@/lib/constants";

export function UseCases() {
  return (
    <SectionWrapper id="use-cases">
      <AnimateIn>
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">
            Use Cases
          </p>
          <h2 className="mb-5 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            One command to a{" "}
            <span className="gradient-text">working team</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted">
            Pick a built-in template or define your own fleet. Each agent gets
            its own container, budget, and tool permissions.
          </p>
        </div>
      </AnimateIn>

      <StaggerContainer className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {USE_CASES.map((uc) => {
          const Icon = uc.icon;
          return (
            <StaggerItem key={uc.name}>
              <div className="card-hover group flex h-full flex-col rounded-xl border border-border/50 bg-card/40 p-6">
                {/* Icon */}
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border border-accent/15 bg-accent/[0.07] transition-colors group-hover:border-accent/30 group-hover:bg-accent/10">
                  <Icon className="h-5 w-5 text-accent-light" />
                </div>

                {/* Name */}
                <h3 className="mb-3 text-base font-semibold text-foreground">
                  {uc.name}
                </h3>

                {/* Agent role badges */}
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {uc.agents.map((agent) => (
                    <span
                      key={agent}
                      className="rounded-md border border-border/40 bg-background/50 px-2 py-0.5 font-mono text-[11px] text-muted"
                    >
                      {agent}
                    </span>
                  ))}
                </div>

                {/* Description */}
                <p className="mt-auto text-sm leading-relaxed text-muted">
                  {uc.description}
                </p>
              </div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      {/* Bottom CTA hint */}
      <AnimateIn delay={0.2}>
        <p className="mt-8 text-center text-sm text-muted">
          Run{" "}
          <code className="rounded-md bg-card px-2 py-0.5 font-mono text-xs text-accent-light">
            openlegion start
          </code>{" "}
          to pick a template or create your own fleet.
        </p>
      </AnimateIn>
    </SectionWrapper>
  );
}
