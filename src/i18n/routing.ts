import { defineRouting } from "next-intl/routing";
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from "@/lib/constants";

export const routing = defineRouting({
  locales: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  // Detect the user's browser language on bare `/` requests and 308-redirect
  // them to the matching `/<locale>` path. Without this, a German visitor
  // lands on the English homepage by default.
  localeDetection: true,
});
