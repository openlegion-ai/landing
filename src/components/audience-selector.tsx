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

      <StaggerContainer className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <StaggerItem key={card.title}>
              <button
                onClick={() => {
                  const el = document.querySelector(card.scrollTo);
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="card-hover glass-shine gradient-border group flex h-full w-full cursor-pointer flex-col items-center rounded-xl border border-border/50 glass-card p-6 text-center transition-all hover:border-accent/30"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-accent/15 bg-accent/[0.07] transition group-hover:border-accent/30 group-hover:scale-110 group-hover:bg-accent/10">
                  <Icon className="h-5 w-5 text-accent-light" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">
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
