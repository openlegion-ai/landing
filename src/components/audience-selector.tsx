"use client";

import { Code, Wrench, Rocket, Building2 } from "lucide-react";
import { SectionWrapper } from "@/components/ui/section-wrapper";
import { AnimateIn, StaggerContainer, StaggerItem } from "@/components/ui/animate-in";

const CARDS = [
  { icon: Code, title: "I need to automate my team's workflows", scrollTo: "#use-cases" },
  { icon: Rocket, title: "I need to build AI-powered products", scrollTo: "#quickstart" },
  { icon: Wrench, title: "I need a custom AI workforce", scrollTo: "#use-cases" },
  { icon: Building2, title: "Deploy for my enterprise", scrollTo: "#enterprise" },
];

export function AudienceSelector() {
  return (
    <SectionWrapper id="audience-selector" fade={false}>
      <AnimateIn>
        <div className="mb-12 text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            What do you need to{" "}
            <span className="gradient-text">automate</span>?
          </h2>
        </div>
      </AnimateIn>

      <StaggerContainer className="mx-auto grid max-w-4xl grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <StaggerItem key={card.title}>
              <button
                onClick={() => {
                  const el = document.querySelector(card.scrollTo);
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="card-hover glass-shine gradient-border group flex h-full w-full cursor-pointer items-center gap-3 rounded-xl border border-border/50 glass-card p-4 text-left transition-all hover:border-accent/30 sm:flex-col sm:items-center sm:p-6 sm:text-center"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-accent/15 bg-accent/[0.07] transition group-hover:border-accent/30 group-hover:scale-110 group-hover:bg-accent/10 sm:mb-4 sm:h-10 sm:w-10">
                  <Icon className="h-4 w-4 text-accent-light sm:h-5 sm:w-5" />
                </div>
                <h3 className="text-[13px] font-semibold leading-snug text-foreground sm:text-sm">
                  {card.title}
                </h3>
              </button>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </SectionWrapper>
  );
}
