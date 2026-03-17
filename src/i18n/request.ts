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
};

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: allMessages[locale] || allMessages[routing.defaultLocale],
  };
});
