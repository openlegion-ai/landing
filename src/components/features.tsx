"use client";

import { SectionWrapper } from "@/components/ui/section-wrapper";
import { AnimateIn, StaggerContainer, StaggerItem } from "@/components/ui/animate-in";
import { FEATURES } from "@/lib/constants";

const SIZE_CLASSES = {
  large: "md:col-span-2 md:row-span-2",
  medium: "md:col-span-1 md:row-span-2",
  standard: "md:col-span-1 md:row-span-1",
  wide: "md:col-span-3",
} as const;

export function Features() {
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

      <StaggerContainer className="grid gap-4 md:grid-cols-3 md:auto-rows-[minmax(140px,auto)]">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          const isLarge = f.size === "large";
          const isWide = f.size === "wide";
          return (
            <StaggerItem key={f.title} className={SIZE_CLASSES[f.size]}>
              <div
                className={`card-hover group relative flex h-full flex-col overflow-hidden rounded-xl border bg-card/40 p-6 md:p-8 ${
                  isLarge
                    ? "border-accent/15 bg-gradient-to-br from-accent/[0.06] to-transparent"
                    : isWide
                      ? "border-accent/10 bg-gradient-to-r from-accent/[0.04] via-transparent to-accent/[0.04]"
                      : "border-border/50"
                }`}
              >
                {isLarge && (
                  <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-accent/[0.06] blur-3xl transition-opacity group-hover:opacity-100 opacity-50" />
                )}
                <div className="relative flex h-full flex-col">
                  <div
                    className={`mb-5 flex items-center justify-center rounded-xl border border-accent/20 bg-accent/10 transition-colors group-hover:border-accent/30 ${
                      isLarge ? "h-14 w-14" : "h-11 w-11 rounded-lg border-accent/15 bg-accent/[0.07]"
                    }`}
                  >
                    <Icon className={`text-accent-light ${isLarge ? "h-7 w-7" : "h-5 w-5"}`} />
                  </div>
                  <h3
                    className={`mb-2 font-semibold tracking-tight text-foreground ${
                      isLarge ? "text-xl mb-3" : "text-base md:text-lg"
                    }`}
                  >
                    {f.title}
                  </h3>
                  <p
                    className={`leading-relaxed text-muted ${
                      isLarge ? "text-sm md:text-base md:leading-relaxed" : "text-sm"
                    }`}
                  >
                    {f.description}
                  </p>
                </div>
              </div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </SectionWrapper>
  );
}
