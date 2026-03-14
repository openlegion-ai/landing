import Link from "next/link";
import { Shield, DollarSign, Monitor } from "lucide-react";
import { SectionWrapper } from "@/components/ui/section-wrapper";
import { AnimateIn, StaggerContainer, StaggerItem } from "@/components/ui/animate-in";

const OUTCOMES = [
  {
    icon: Shield,
    title: "AI agent security: your keys stay in a vault agents never touch.",
    description:
      "Every agent calls through a credential proxy. Keys never exist inside a container. Six independent security layers on by default.",
    link: { href: "/ai-agent-security", label: "How security works →" },
  },
  {
    icon: DollarSign,
    title: "Set a budget per agent. They stop the moment they hit it.",
    description:
      "Per-agent daily and monthly caps with automatic hard cutoff. No surprise bills. No runaway API loops at 3am.",
    link: { href: "/ai-agent-platform", label: "How cost control works →" },
  },
  {
    icon: Monitor,
    title: "Deterministic AI agent orchestration — you decide who does what.",
    description:
      "Agents browse any website, operate any tool, run any task. MCP-compatible with 50+ built-in skills. YAML-defined workflows — every execution path predictable, auditable, and under your control.",
    link: { href: "/ai-agent-orchestration", label: "How orchestration works →" },
  },
];

export function Features() {
  return (
    <SectionWrapper id="features" glow>
      <AnimateIn>
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">
            Features
          </p>
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Built for teams that can&apos;t afford things to{" "}
            <span className="gradient-text">go wrong</span>.
          </h2>
          <p className="mx-auto max-w-xl text-sm text-muted">
            The AI agent platform with security, cost control, and agentic automation baked in from day one.
          </p>
        </div>
      </AnimateIn>

      <StaggerContainer className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
        {OUTCOMES.map((outcome) => {
          const Icon = outcome.icon;
          return (
            <StaggerItem key={outcome.title}>
              <div className="card-hover gradient-border glass-shine group flex h-full flex-col rounded-xl border border-border/50 glass-card p-6">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-accent/15 bg-accent/[0.07] transition group-hover:border-accent/30 group-hover:scale-110">
                    <Icon className="h-[18px] w-[18px] text-accent-light" />
                  </div>
                  <h3 className="text-[15px] font-medium leading-snug text-foreground">
                    {outcome.title}
                  </h3>
                </div>
                <p className="mb-4 flex-1 text-[13px] leading-relaxed text-muted">
                  {outcome.description}
                </p>
                <Link
                  href={outcome.link.href}
                  className="text-xs font-medium text-accent-light transition-colors hover:text-accent hover:underline"
                >
                  {outcome.link.label}
                </Link>
              </div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      <AnimateIn delay={0.15}>
        <p className="mt-8 text-center text-sm text-muted">
          <Link
            href="/ai-agent-platform"
            className="text-accent-light underline underline-offset-2 transition-colors hover:text-accent"
          >
            See all AI agent platform features including browser automation, persistent memory, MCP extensibility, and multi-agent orchestration →
          </Link>
        </p>
      </AnimateIn>
    </SectionWrapper>
  );
}
