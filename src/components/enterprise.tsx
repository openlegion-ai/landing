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
          <div className="mb-6 flex flex-wrap justify-center gap-2">
            {SIGNALS.map((signal) => (
              <span
                key={signal}
                className="rounded-full border border-border/30 bg-card/40 px-3 py-1 text-xs font-medium text-muted"
              >
                ✓ {signal}
              </span>
            ))}
          </div>
          <a
            href="mailto:admin@openlegion.ai"
            className="text-sm font-medium text-accent-light transition-colors hover:text-accent hover:underline"
          >
            Talk to us about enterprise deployment →
          </a>
        </div>
      </AnimateIn>
    </SectionWrapper>
  );
}
