import { useTranslations } from "next-intl";
import { AnimateIn } from "@/components/ui/animate-in";

export function TechnicalDefinition() {
  const t = useTranslations("technicalDefinition");

  return (
    <section className="px-6 py-8 md:px-8 md:py-12">
      <div className="mx-auto max-w-3xl">
        <AnimateIn>
          <aside className="mx-auto max-w-[620px] rounded-r-lg border-l-[3px] border-l-accent/30 bg-card/50 px-4 py-3">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted/50">
              {t("label")}
            </p>
            <p className="definition-block text-[13px] leading-relaxed text-muted/70">
              <strong className="sr-only">{t("srOnlyPrefix")}</strong>
              {t("text")}
            </p>
          </aside>
        </AnimateIn>
      </div>
    </section>
  );
}
