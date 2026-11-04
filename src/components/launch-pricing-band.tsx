"use client";

import { useTranslations } from "next-intl";
import { WAITLIST_URL } from "@/lib/constants";
import { trackCtaClick } from "@/lib/analytics";
import { IconArrow } from "@/components/site/icons";

/** Fixed-height (h-9 = 36px) — sits in flow inside the sticky header above Navbar. */
export const LAUNCH_BANNER_HEIGHT_PX = 36;

/** The private-beta band across the top of every page. */
export function LaunchPricingBand() {
  const t = useTranslations("site.band");
  return (
    <div className="w-full border-b border-[var(--line)] bg-black">
      <div className="wrap flex h-9 items-center justify-center gap-3 text-center text-[0.8125rem]">
        <span className="size-1.5 shrink-0 rounded-full bg-[var(--blue-2)]" aria-hidden="true" />
        <span className="min-w-0 truncate text-[var(--fg-2)]">
          <span className="sm:hidden">{t("short")}</span>
          <span className="hidden sm:inline">{t("message")}</span>
        </span>
        <a
          href={WAITLIST_URL}
          onClick={() => trackCtaClick({ location: "band" })}
          className="group inline-flex shrink-0 items-center gap-1 font-semibold text-[var(--fg)] hover:text-[var(--blue-ink)]"
        >
          {t("cta")}
          <IconArrow className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 rtl:-scale-x-100" />
        </a>
      </div>
    </div>
  );
}
