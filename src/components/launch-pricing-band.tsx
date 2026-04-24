"use client";

import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

const APP_URL = "https://app.openlegion.ai";

/** Fixed-height (h-9 = 36px) — sits in flow inside the sticky header above Navbar. */
export const LAUNCH_BANNER_HEIGHT_PX = 36;

export function LaunchPricingBand() {
  const t = useTranslations("launchPricing");
  return (
    <div className="w-full border-b border-border/60 bg-background/95 backdrop-blur-2xl">
      <div className="mx-auto flex h-9 max-w-7xl items-center justify-center gap-2 px-4 text-center text-xs sm:text-sm">
        <Sparkles className="size-3.5 shrink-0 text-primary" aria-hidden />
        <span className="min-w-0 truncate text-foreground/90">{t("message")}</span>
        <a
          href={APP_URL}
          className="shrink-0 font-semibold text-primary hover:underline"
        >
          {t("cta")}
        </a>
      </div>
    </div>
  );
}
