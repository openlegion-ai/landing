import { Check, ArrowRight } from "lucide-react";
import { SectionWrapper } from "@/components/ui/section-wrapper";
import { AnimateIn } from "@/components/ui/animate-in";

const SIGNALS = [
  "On-premises & air-gap",
  "SOC 2-aligned",
  "Deterministic audit trails",
  "Deterministic workflows",
  "Per-agent cost governance",
  "Role-based access",
];

export function Enterprise() {
  return (
    <SectionWrapper id="enterprise" glow>
      <AnimateIn>
        <div className="gradient-border glass-shine mx-auto max-w-[620px] rounded-xl border border-border/50 glass-card p-8 text-center md:p-10">
          <h2 className="mb-3 text-2xl font-bold tracking-tight md:text-3xl">
            Built for enterprise.
          </h2>
          <p className="mx-auto mb-6 max-w-[500px] text-sm leading-relaxed text-muted">
            On-premises deployment, air-gapped environments, SOC 2-aligned credential isolation, deterministic audit trails, per-agent cost governance, and role-based access — all enforced by default. The engine is ~30,000 lines of Python with 2,100+ tests and a minimal dependency surface.
          </p>
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {SIGNALS.map((signal) => (
              <span
                key={signal}
                className="flex items-center gap-1.5 rounded-full border border-success/15 bg-success/[0.05] px-3 py-1 text-xs font-medium text-muted"
              >
                <Check className="h-3 w-3 text-success/70" aria-hidden="true" />
                {signal}
              </span>
            ))}
          </div>
          <a
            href="mailto:sales@openlegion.ai"
            className="group inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground transition-all hover:border-accent/40 hover:bg-accent/5"
          >
            Talk to us about enterprise deployment
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </a>
        </div>
      </AnimateIn>
    </SectionWrapper>
  );
}
