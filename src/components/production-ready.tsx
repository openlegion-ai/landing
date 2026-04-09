import Image from "next/image";
import { useTranslations } from "next-intl";
import { SectionWrapper } from "@/components/ui/section-wrapper";
import { AnimateIn } from "@/components/ui/animate-in";

export function ProductionReady() {
  const t = useTranslations("productionReady");

  return (
    <SectionWrapper id="production-ready">
      <AnimateIn>
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 flex justify-center">
            <div className="icon-glow-ring rounded-full">
              <Image
                src="/logo.png"
                alt="OpenLegion"
                width={64}
                height={64}
                className="h-16 w-16 rounded-full"
              />
            </div>
          </div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">
            {t("sectionLabel")}
          </p>
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            {t("heading")}
          </h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted">
            {t("subtitle")}
          </p>
        </div>
      </AnimateIn>
    </SectionWrapper>
  );
}
