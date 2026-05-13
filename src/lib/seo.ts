import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from "@/lib/constants";

export const SITE_URL = "https://www.openlegion.ai";

/**
 * Build the canonical URL + hreflang `languages` map for a nav-driven page
 * (home, pricing, faq, terms, privacy, money-back, learn).
 *
 * Every supported locale gets an entry, since the next-intl message files
 * provide a translation for each locale. Canonical points to the current
 * locale's URL — the self-canonical pattern that lets Google index every
 * variant and surface the right one per audience.
 */
export function navPageAlternates(locale: string, path: string) {
  const normalized = path === "/" ? "" : path;
  const languages: Record<string, string> = {};
  for (const loc of SUPPORTED_LOCALES) {
    languages[loc] = `${SITE_URL}/${loc}${normalized}`;
  }
  languages["x-default"] = `${SITE_URL}/${DEFAULT_LOCALE}${normalized}`;
  return {
    canonical: `${SITE_URL}/${locale}${normalized}`,
    languages,
  };
}

/**
 * Map locale codes to OG `locale` format. Reused across page-level
 * generateMetadata so OpenGraph stays accurate per route.
 */
export const OG_LOCALE_MAP: Record<string, string> = {
  en: "en_US",
  zh: "zh_CN",
  "zh-TW": "zh_TW",
  ja: "ja_JP",
  ko: "ko_KR",
  es: "es_ES",
  fr: "fr_FR",
  de: "de_DE",
  pt: "pt_BR",
  ar: "ar_SA",
  hi: "hi_IN",
  ru: "ru_RU",
  th: "th_TH",
};
