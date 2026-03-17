"use client";

import { useLocale, useTranslations } from "next-intl";
import { Globe } from "lucide-react";
import { SUPPORTED_LOCALES, LOCALE_LABELS } from "@/lib/constants";

export function LanguageSwitcher({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  const locale = useLocale();
  const t = useTranslations("common");

  function switchLocale(newLocale: string) {
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000; SameSite=lax`;
    window.location.reload();
  }

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <Globe className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-muted" aria-hidden="true" />
      <select
        value={locale}
        onChange={(e) => switchLocale(e.target.value)}
        aria-label={t("selectLanguage")}
        className={`appearance-none rounded-md border border-border bg-background/80 py-1.5 pl-8 pr-7 text-xs text-muted backdrop-blur-sm transition-colors hover:border-accent/40 hover:text-foreground focus:border-accent focus:outline-none ${compact ? "max-w-[5.5rem]" : ""}`}
      >
        {SUPPORTED_LOCALES.map((code) => (
          <option key={code} value={code}>
            {LOCALE_LABELS[code] || code}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-2 h-3 w-3 text-muted"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}
