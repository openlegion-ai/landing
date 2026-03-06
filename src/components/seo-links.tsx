import Link from "next/link";
import { Layers, GitCompareArrows, BookOpen } from "lucide-react";
import { SectionWrapper } from "@/components/ui/section-wrapper";
import { AnimateIn, StaggerContainer, StaggerItem } from "@/components/ui/animate-in";

const CARDS = [
  {
    icon: Layers,
    title: "Platform & Infrastructure",
    description:
      "How OpenLegion handles container isolation, credential vaulting, cost controls, and deterministic orchestration for production agent fleets.",
    links: [
      { label: "AI Agent Platform", href: "/ai-agent-platform" },
      { label: "AI Agent Orchestration", href: "/ai-agent-orchestration" },
      { label: "AI Agent Security", href: "/ai-agent-security" },
    ],
  },
  {
    icon: GitCompareArrows,
    title: "Framework Comparisons",
    description:
      "See how OpenLegion stacks up across the AI agent framework landscape — security, isolation, cost controls, and orchestration compared.",
    links: [
      { label: "All Comparisons", href: "/comparison" },
      { label: "OpenClaw Alternative", href: "/openclaw-alternative" },
      { label: "AI Agent Frameworks", href: "/ai-agent-frameworks" },
    ],
  },
  {
    icon: BookOpen,
    title: "Head-to-Head",
    description:
      "Detailed architecture deep dives and migration paths for the most popular frameworks teams evaluate against OpenLegion.",
    links: [
      { label: "vs OpenClaw", href: "/comparison/openclaw" },
      { label: "vs LangGraph", href: "/comparison/langgraph" },
      { label: "vs CrewAI", href: "/comparison/crewai" },
    ],
  },
];

export function SeoLinks() {
  return (
    <SectionWrapper id="learn" glow>
      <AnimateIn>
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">
            Learn
          </p>
          <h2 className="mb-5 text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Deep dives &{" "}
            <span className="gradient-text">comparisons</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted">
            Detailed guides on AI agent platforms, orchestration, security, and
            how OpenLegion compares to every major framework.
          </p>
        </div>
      </AnimateIn>

      <StaggerContainer className="grid gap-4 md:grid-cols-3">
        {CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <StaggerItem key={card.title}>
              <div className="card-hover gradient-border glass-shine group relative flex h-full flex-col overflow-hidden rounded-xl border border-border/50 glass-card p-6 md:p-8">
                <div className="relative flex h-full flex-col">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent/15 bg-accent/[0.07] transition group-hover:border-accent/30 group-hover:scale-110">
                      <Icon className="h-4 w-4 text-accent-light" />
                    </div>
                    <h3 className="text-base font-semibold tracking-tight text-foreground md:text-lg">
                      {card.title}
                    </h3>
                  </div>
                  <p className="mb-6 text-sm leading-relaxed text-muted">
                    {card.description}
                  </p>
                  <div className="mt-auto flex flex-col gap-2.5">
                    {card.links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="group/link flex items-center gap-2.5 text-sm font-medium text-accent-light transition-colors hover:text-accent"
                      >
                        <span className="h-px w-3 bg-accent/30 transition-all group-hover/link:w-5 group-hover/link:bg-accent" />
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </SectionWrapper>
  );
}
