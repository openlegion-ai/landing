import { useTranslations } from "next-intl";
import { AnimateIn } from "@/components/ui/animate-in";

export function TechnicalDefinition() {
  const t = useTranslations("technicalDefinition");

  // Schema.org/DefinedTerm microdata — mirrors the DefinitionBlock pattern
  // emitted by the content engine for markdown pages. AI Overviews and LLM
  // retrievers extract this block verbatim as the canonical "What is
  // OpenLegion?" answer. The outer wrapper is a plain <div> (presentational
  // only — no heading); the inner <section> carries the microdata and the
  // h2 term name.
  return (
    <div className="px-6 py-8 md:px-8 md:py-12">
      <div className="mx-auto max-w-3xl">
        <AnimateIn>
          <section
            className="definition-block mx-auto max-w-[620px] rounded-r-lg border-l-[3px] border-l-accent/30 bg-card/50 px-4 py-3"
            itemScope
            itemType="https://schema.org/DefinedTerm"
          >
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted/50">
              {t("label")}
            </p>
            <h2 className="sr-only definition-term" itemProp="name">
              {t("srOnlyPrefix")}
            </h2>
            <p
              className="text-[13px] leading-relaxed text-muted/70"
              itemProp="description"
            >
              {t("text")}
            </p>
          </section>
        </AnimateIn>
      </div>
    </div>
  );
}
