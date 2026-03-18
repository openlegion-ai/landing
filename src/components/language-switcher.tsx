"use client";

import { useLocale, useTranslations } from "next-intl";
import { Globe } from "lucide-react";
import { SUPPORTED_LOCALES, LOCALE_LABELS } from "@/lib/constants";
import { useRouter, usePathname } from "@/i18n/navigation";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(newLocale: string) {
    router.replace(pathname, { locale: newLocale });
  }

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <Globe className="pointer-events-none absolute left-2 h-3.5 w-3.5 text-foreground/70" aria-hidden="true" />
      <select
        value={locale}
        onChange={(e) => switchLocale(e.target.value)}
        aria-label={t("selectLanguage")}
        className="appearance-none rounded-md border border-border bg-background/80 py-1.5 pl-7 pr-6 text-xs text-muted backdrop-blur-sm transition-colors hover:border-accent/40 hover:text-foreground focus:border-accent focus:outline-none"
      >
        {SUPPORTED_LOCALES.map((code) => (
          <option key={code} value={code}>
            {LOCALE_LABELS[code] || code}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-1.5 h-3 w-3 text-muted"
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
