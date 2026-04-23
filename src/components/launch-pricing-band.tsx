"use client";

import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

const APP_URL = "https://app.openlegion.ai";

export function LaunchPricingBand() {
  const t = useTranslations("launchPricing");
  return (
    <div className="w-full border-b border-border/60 bg-primary/[0.04]">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2 text-center text-sm">
        <Sparkles className="size-4 shrink-0 text-primary" aria-hidden />
        <span className="text-foreground/90">{t("message")}</span>
        <a
          href={APP_URL}
          className="ml-1 font-semibold text-primary hover:underline"
        >
          {t("cta")}
        </a>
      </div>
    </div>
  );
}
