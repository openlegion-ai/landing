import { AnimateIn } from "@/components/ui/animate-in";

export function TechnicalDefinition() {
  return (
    <section className="px-6 py-8 md:px-8 md:py-12">
      <div className="mx-auto max-w-3xl">
        <AnimateIn>
          <aside className="mx-auto max-w-[620px] rounded-r-lg border-l-[3px] border-l-accent/30 bg-card/50 px-4 py-3">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted/50">
              Technical definition
            </p>
            <p className="definition-block text-[13px] leading-relaxed text-muted/70">
              <strong className="sr-only">What is OpenLegion? </strong>
              OpenLegion is a production-grade AI agent platform with container isolation, blind credential injection, per-agent budgets, and deterministic YAML orchestration — designed for teams that need secure, cost-controlled agent fleets in production.
            </p>
          </aside>
        </AnimateIn>
      </div>
    </section>
  );
}
