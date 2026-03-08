import Link from "next/link";
import { Check } from "lucide-react";
import { SectionWrapper } from "@/components/ui/section-wrapper";
import { AnimateIn, StaggerContainer, StaggerItem } from "@/components/ui/animate-in";
import { SECURITY_LAYERS } from "@/lib/constants";

export function Security() {
  return (
    <SectionWrapper id="security" fade={false}>
      <AnimateIn>
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">
            Security
          </p>
          <h2 className="mb-5 text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            AI agent security:{" "}
            <span className="gradient-text">six layers</span> of defense
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted">
            Designed from day one assuming agents will be compromised. Every layer
            operates independently.
          </p>
        </div>
      </AnimateIn>

      <StaggerContainer className="mx-auto max-w-2xl space-y-0">
        {SECURITY_LAYERS.map((layer, i) => (
            <StaggerItem key={layer.number}>
              {/* Connector line between cards */}
              {i > 0 && (
                <div className="flex justify-center" aria-hidden="true">
                  <div className="connector-line h-4 w-px bg-gradient-to-b from-accent/20 to-accent/5" />
                </div>
              )}
              <div className="card-hover gradient-border glass-shine group rounded-xl border border-accent/15 glass-card p-5 md:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-accent/20 bg-accent/[0.07] transition group-hover:scale-110 group-hover:border-accent/30">
                    <span className="font-mono text-xs font-medium text-accent-light">
                      {String(layer.number).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="mb-1 text-base font-semibold text-foreground">
                      {layer.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted">
                      {layer.description}
                    </p>
                  </div>
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-success transition-transform group-hover:scale-110" aria-hidden="true" />
                </div>
              </div>
            </StaggerItem>
        ))}
      </StaggerContainer>

      <AnimateIn delay={0.2}>
        <p className="mt-8 text-center text-sm text-muted">
          <Link href="/ai-agent-security" className="text-accent-light underline underline-offset-2 hover:text-accent transition-colors">
            Learn more about AI agent security
          </Link>
        </p>
      </AnimateIn>
    </SectionWrapper>
  );
}
