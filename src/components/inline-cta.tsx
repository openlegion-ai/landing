import { ChevronRight, BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { AnimateIn } from "@/components/ui/animate-in";
import { APP_URL, DOCS_URL } from "@/lib/constants";

interface InlineCTAProps {
  heading: string;
}

export function InlineCTA({ heading }: InlineCTAProps) {
  const t = useTranslations("inlineCta");

  return (
    <div className="px-5 py-12 sm:px-6 md:px-8 md:py-16">
      <AnimateIn>
        <div className="mx-auto max-w-2xl text-center">
          <div
            className="mx-auto mb-6 h-px w-2/3 bg-gradient-to-r from-transparent via-accent/30 to-transparent"
            aria-hidden="true"
          />
          <p className="mb-6 text-balance text-xl font-semibold gradient-text">{heading}</p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group/btn btn-shine btn-glow btn-gradient flex w-full items-center justify-center gap-2.5 rounded-xl px-7 py-3.5 text-sm font-semibold text-white sm:w-auto"
            >
              {t("startFreeTrial")}
              <ChevronRight
                className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5"
                aria-hidden="true"
              />
            </a>
            <a
              href={DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group/secondary flex w-full items-center justify-center gap-2 rounded-xl border border-border px-7 py-3.5 text-sm font-semibold text-foreground transition-all hover:border-accent/40 hover:bg-accent/5 sm:w-auto"
            >
              <BookOpen
                className="h-4 w-4 transition-transform group-hover/secondary:scale-110"
                aria-hidden="true"
              />
              {t("readTheDocs")}
            </a>
          </div>
          <div
            className="mx-auto mt-6 h-px w-2/3 bg-gradient-to-r from-transparent via-accent/30 to-transparent"
            aria-hidden="true"
          />
        </div>
      </AnimateIn>
    </div>
  );
}
