import { defineRouting } from "next-intl/routing";
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from "@/lib/constants";

export const routing = defineRouting({
  locales: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  // Detect the user's browser language on bare `/` requests and 308-redirect
  // them to the matching `/<locale>` path. Without this, a German visitor
  // lands on the English homepage by default.
  localeDetection: true,
  // No hreflang `Link` response header. next-intl's header lists every locale
  // for every path, including content pages that have no translation (those
  // serve a noindex English fallback canonicalised to /en). That contradicted
  // the page's own hreflang and pointed Google at noindex URLs. hreflang comes
  // from page metadata (`alternates.languages`) and the sitemap, which only
  // list versions that exist.
  alternateLinks: false,
});
