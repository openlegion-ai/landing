"use client";

import { useLocale, useTranslations } from "next-intl";
import { SUPPORTED_LOCALES, LOCALE_LABELS } from "@/lib/constants";
import { useRouter, usePathname } from "@/i18n/navigation";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <select
        value={locale}
        onChange={(e) => router.replace(pathname, { locale: e.target.value })}
        aria-label={t("selectLanguage")}
        className="min-h-9 appearance-none rounded-[8px] border border-[var(--line-2)] bg-transparent py-1.5 ps-3 pe-8 text-[0.8125rem] text-[var(--fg-2)] transition-colors hover:border-[var(--line-3)] hover:text-[var(--fg)] focus:border-[var(--blue-2)] focus:outline-none"
      >
        {SUPPORTED_LOCALES.map((code) => (
          <option key={code} value={code} className="bg-[var(--surface)] text-[var(--fg)]">
            {LOCALE_LABELS[code] || code}
          </option>
        ))}
      </select>
      <svg className="pointer-events-none absolute end-2.5 size-3 text-[var(--fg-3)]" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path d="M3 4.5 6 7.5l3-3" />
      </svg>
    </div>
  );
}
