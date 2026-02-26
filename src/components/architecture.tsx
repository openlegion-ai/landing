"use client";

import { SectionWrapper } from "@/components/ui/section-wrapper";
import { AnimateIn, StaggerContainer, StaggerItem } from "@/components/ui/animate-in";
import { ARCHITECTURE } from "@/lib/constants";

const ZONE_STYLES = {
  accent: {
    border: "border-accent/25",
    bg: "bg-accent/[0.03]",
    text: "text-accent-light",
    dot: "bg-accent",
    ring: "ring-accent/20",
  },
  success: {
    border: "border-success/25",
    bg: "bg-success/[0.03]",
    text: "text-success",
    dot: "bg-success",
    ring: "ring-success/20",
  },
  danger: {
    border: "border-danger/25",
    bg: "bg-danger/[0.03]",
    text: "text-danger",
    dot: "bg-danger",
    ring: "ring-danger/20",
  },
} as const;

export function Architecture() {
  return (
    <SectionWrapper id="architecture" fade={false}>
      <AnimateIn>
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">
            Architecture
          </p>
          <h2 className="mb-5 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            {ARCHITECTURE.title}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted">
            {ARCHITECTURE.subtitle}
          </p>
        </div>
      </AnimateIn>

      <StaggerContainer className="flex flex-col gap-5 lg:flex-row">
        {ARCHITECTURE.zones.map((zone) => {
          const s = ZONE_STYLES[zone.color];
          return (
            <StaggerItem key={zone.name} className="relative flex-1">
              <div className={`h-full rounded-xl border ${s.border} ${s.bg} p-6 md:p-8`}>
                <div className="mb-6 flex items-center gap-3">
                  <div className={`h-3.5 w-3.5 rounded-full ${s.dot} ring-4 ${s.ring}`} />
                  <div>
                    <h3 className={`text-lg font-semibold ${s.text}`}>{zone.name}</h3>
                    <p className="text-xs text-muted">{zone.trust}</p>
                  </div>
                </div>
                <ul className="space-y-2.5">
                  {zone.items.map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-muted">
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.dot} opacity-40`} />
                      <code className="font-mono text-[13px]">{item}</code>
                    </li>
                  ))}
                </ul>
              </div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </SectionWrapper>
  );
}
