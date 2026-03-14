"use client";

import Link from "next/link";
import { SectionWrapper } from "@/components/ui/section-wrapper";
import { AnimateIn, StaggerContainer, StaggerItem } from "@/components/ui/animate-in";
import { ARCHITECTURE } from "@/lib/constants";

const ZONE_CONFIG = [
  {
    borderColor: "border-accent/20",
    bgClass: "zone-outer",
    textColor: "text-accent-light",
    dotColor: "bg-accent",
    ringColor: "ring-accent/20",
    labelColor: "text-accent-light/60",
  },
  {
    borderColor: "border-success/20",
    bgClass: "zone-middle",
    textColor: "text-success",
    dotColor: "bg-success",
    ringColor: "ring-success/20",
    labelColor: "text-success/60",
  },
  {
    borderColor: "border-danger/20",
    bgClass: "zone-inner",
    textColor: "text-danger",
    dotColor: "bg-danger",
    ringColor: "ring-danger/20",
    labelColor: "text-danger/60",
  },
] as const;

export function Architecture() {
  const zones = ARCHITECTURE.zones;

  return (
    <SectionWrapper id="architecture" fade={false}>
      <AnimateIn>
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">
            Under the hood
          </p>
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            {ARCHITECTURE.title}
          </h2>
          <p className="mx-auto max-w-[520px] text-[15px] leading-relaxed text-muted">
            {ARCHITECTURE.summary}
          </p>
        </div>
      </AnimateIn>

      <StaggerContainer>
        <StaggerItem>
          <div className={`glass-shine relative overflow-hidden rounded-2xl border ${ZONE_CONFIG[0].borderColor} ${ZONE_CONFIG[0].bgClass} p-5 backdrop-blur-sm md:p-8`}>
            <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-accent/[0.04] blur-3xl" aria-hidden="true" />
            <div className="relative mb-4 flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${ZONE_CONFIG[0].dotColor} ring-4 ${ZONE_CONFIG[0].ringColor}`} />
              <div>
                <span className={`text-sm font-semibold ${ZONE_CONFIG[0].textColor}`}>{zones[0].name}</span>
                <span className={`ml-2 text-xs ${ZONE_CONFIG[0].labelColor}`}>— {zones[0].trust}</span>
              </div>
            </div>
            <div className="relative mb-5 flex flex-wrap gap-2">
              {zones[0].items.map((item) => (
                <code key={item} className="rounded-md border border-accent/10 bg-accent/[0.05] px-2.5 py-1 font-mono text-xs text-accent-light/80 transition-colors hover:border-accent/25 hover:bg-accent/[0.1]">
                  {item}
                </code>
              ))}
            </div>

            <StaggerItem>
              <div className={`glass-shine relative rounded-xl border ${ZONE_CONFIG[1].borderColor} ${ZONE_CONFIG[1].bgClass} p-5 backdrop-blur-sm md:p-6`}>
                <div className="mb-4 flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${ZONE_CONFIG[1].dotColor} ring-4 ${ZONE_CONFIG[1].ringColor}`} />
                  <div>
                    <span className={`text-sm font-semibold ${ZONE_CONFIG[1].textColor}`}>{zones[1].name}</span>
                    <span className={`ml-2 text-xs ${ZONE_CONFIG[1].labelColor}`}>— {zones[1].trust}</span>
                  </div>
                </div>
                <div className="mb-5 flex flex-wrap gap-2">
                  {zones[1].items.map((item) => (
                    <code key={item} className="rounded-md border border-success/10 bg-success/[0.05] px-2.5 py-1 font-mono text-xs text-success/80 transition-colors hover:border-success/25 hover:bg-success/[0.1]">
                      {item}
                    </code>
                  ))}
                </div>

                <StaggerItem>
                  <div className={`glass-shine rounded-lg border ${ZONE_CONFIG[2].borderColor} ${ZONE_CONFIG[2].bgClass} p-5 backdrop-blur-sm md:p-6`}>
                    <div className="mb-4 flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${ZONE_CONFIG[2].dotColor} ring-4 ${ZONE_CONFIG[2].ringColor}`} />
                      <div>
                        <span className={`text-sm font-semibold ${ZONE_CONFIG[2].textColor}`}>{zones[2].name}</span>
                        <span className={`ml-2 text-xs ${ZONE_CONFIG[2].labelColor}`}>— {zones[2].trust}</span>
                      </div>
                    </div>
                    <StaggerContainer className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {[1, 2, 3].map((n) => (
                        <StaggerItem key={n}>
                          <div className="rounded-lg border border-danger/15 bg-danger/[0.03] p-3 backdrop-blur-sm transition-colors hover:border-danger/25 hover:bg-danger/[0.05]">
                            <p className="mb-2 font-mono text-xs font-medium text-danger/80">Agent {n}</p>
                            <div className="space-y-1">
                              {zones[2].items.map((item) => (
                                <p key={item} className="flex items-center gap-1.5 font-mono text-[11px] text-muted/70">
                                  <span className="h-1 w-1 rounded-full bg-danger/30" />
                                  {item}
                                </p>
                              ))}
                            </div>
                          </div>
                        </StaggerItem>
                      ))}
                    </StaggerContainer>
                  </div>
                </StaggerItem>
              </div>
            </StaggerItem>
          </div>
        </StaggerItem>
      </StaggerContainer>

      <AnimateIn delay={0.2}>
        <p className="mt-8 text-center text-sm text-muted">
          <Link href="/ai-agent-orchestration" className="text-accent-light underline underline-offset-2 hover:text-accent transition-colors">
            Learn more about AI agent orchestration →
          </Link>
        </p>
      </AnimateIn>
    </SectionWrapper>
  );
}
