/**
 * Consent + measurement settings shared by the inline GA bootstrap (layout)
 * and the client-side consent banner. One source of truth, so the two can
 * never disagree about who is asked and what loads.
 *
 * Rules:
 *  - Nothing measures anywhere except the production host. Local dev, ngrok
 *    tunnels and sites that copy our HTML (we have seen one serving our Thai
 *    pages) send nothing to our GA property.
 *  - Visitors in the EEA, the UK and Switzerland are asked first. Google's own
 *    IP-based region check sets GA's default to denied for them; our banner uses
 *    the device time zone as the stand-in. The time-zone check is deliberately
 *    over-inclusive: a few visitors outside those regions see the banner, and
 *    no visitor in them is tracked by a marketing tag without saying yes.
 *  - Microsoft Clarity and the Meta Pixel load only after consent (or by
 *    default outside the consent region), and only once the page is idle.
 */

export const PROD_HOST = "www.openlegion.ai";
export const GA_ID = "G-758JT3002Y";
export const CONSENT_STORAGE_KEY = "ol_consent";
export const OPEN_CONSENT_EVENT = "ol:open-consent";

// EEA (EU + IS, LI, NO) + UK + CH, as ISO 3166-1 alpha-2 codes for Consent Mode.
export const CONSENT_REGIONS = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
  "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES",
  "SE", "IS", "LI", "NO", "GB", "CH",
];

// Time zones outside "Europe/*" that belong to the consent region.
export const CONSENT_EXTRA_TIMEZONES = [
  "Atlantic/Reykjavik", "Atlantic/Canary", "Atlantic/Madeira", "Atlantic/Azores", "Atlantic/Faroe",
];

export type ConsentChoice = "granted" | "denied";

export function inConsentRegion(): boolean {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    return tz.startsWith("Europe/") || CONSENT_EXTRA_TIMEZONES.includes(tz);
  } catch {
    return true; // can't tell: ask
  }
}

/**
 * The GA bootstrap, inlined in <body> by the layout. It must run before any
 * gtag('config') so the consent defaults apply to the first hit.
 */
export function gaBootstrapScript(): string {
  return `(function () {
  if (location.hostname !== ${JSON.stringify(PROD_HOST)}) return;
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;
  function all(v) { return { ad_storage: v, ad_user_data: v, ad_personalization: v, analytics_storage: v }; }
  var tz = "";
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}
  var askFirst = tz.indexOf("Europe/") === 0 || ${JSON.stringify(CONSENT_EXTRA_TIMEZONES)}.indexOf(tz) !== -1;
  var regional = all("denied");
  regional.region = ${JSON.stringify(CONSENT_REGIONS)};
  regional.wait_for_update = 500;
  gtag("consent", "default", regional);
  gtag("consent", "default", all(askFirst ? "denied" : "granted"));
  var choice = null;
  try { choice = localStorage.getItem(${JSON.stringify(CONSENT_STORAGE_KEY)}); } catch (e) {}
  if (choice === "granted" || choice === "denied") gtag("consent", "update", all(choice));
  gtag("js", new Date());
  gtag("config", ${JSON.stringify(GA_ID)}, {
    linker: { domains: ["openlegion.ai", "www.openlegion.ai", "app.openlegion.ai"] }
  });
  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + ${JSON.stringify(GA_ID)};
  document.head.appendChild(s);
})();`;
}
