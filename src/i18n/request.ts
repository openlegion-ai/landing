import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

// Pre-load all message files synchronously at module level to avoid
// React 19 "Expected a suspended thenable" streaming errors with
// dynamic imports inside server components.
/* eslint-disable @typescript-eslint/no-require-imports */
const allMessages: Record<string, Record<string, unknown>> = {
  en: require("../../messages/en.json"),
  zh: require("../../messages/zh.json"),
  "zh-TW": require("../../messages/zh-TW.json"),
  ja: require("../../messages/ja.json"),
  ko: require("../../messages/ko.json"),
  es: require("../../messages/es.json"),
  fr: require("../../messages/fr.json"),
  de: require("../../messages/de.json"),
  pt: require("../../messages/pt.json"),
  ar: require("../../messages/ar.json"),
  hi: require("../../messages/hi.json"),
  ru: require("../../messages/ru.json"),
  th: require("../../messages/th.json"),
};

/**
 * Deep-merge a locale's messages over the English base so that any key a
 * translation hasn't covered yet falls back to English text instead of
 * rendering a raw key path (next-intl's MISSING_MESSAGE fallback). This makes
 * partial / in-progress translations safe to ship — newly added English keys
 * appear in English everywhere until each locale is translated, rather than
 * breaking those pages.
 */
function deepMerge(
  base: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const key of Object.keys(override)) {
    const o = override[key];
    const b = out[key];
    if (
      o && typeof o === "object" && !Array.isArray(o) &&
      b && typeof b === "object" && !Array.isArray(b)
    ) {
      out[key] = deepMerge(b as Record<string, unknown>, o as Record<string, unknown>);
    } else if (o !== undefined) {
      out[key] = o;
    }
  }
  return out;
}

// Precompute per-locale merged messages once at module load — inputs are the
// static JSON required above, so there's no reason to re-merge on every
// request. Each non-default locale is layered over the English base so any
// untranslated key falls back to English text. Computing this once keeps
// getRequestConfig allocation-free and hands next-intl a stable reference per
// locale (matching the pre-fallback behavior of returning allMessages[locale]).
const MERGED_MESSAGES: Record<string, Record<string, unknown>> = Object.fromEntries(
  Object.keys(allMessages).map((loc) => [
    loc,
    loc === routing.defaultLocale
      ? allMessages[loc]
      : deepMerge(allMessages[routing.defaultLocale], allMessages[loc]),
  ]),
);

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: MERGED_MESSAGES[locale] ?? MERGED_MESSAGES[routing.defaultLocale],
  };
});
