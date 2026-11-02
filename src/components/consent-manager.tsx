"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  CONSENT_STORAGE_KEY,
  OPEN_CONSENT_EVENT,
  PROD_HOST,
  inConsentRegion,
  type ConsentChoice,
} from "@/lib/consent";

const CLARITY_ID = "voko6al3fo";
const META_PIXEL_ID = "2386274771877282";

type QueuedFn = ((...args: unknown[]) => void) & { q?: unknown[][]; queue?: unknown[][]; callMethod?: (...a: unknown[]) => void; push?: unknown; loaded?: boolean; version?: string };
type MarketingWindow = Window & { clarity?: QueuedFn; fbq?: QueuedFn; _fbq?: QueuedFn; __olMarketingLoaded?: boolean };

function readChoice(): ConsentChoice | null {
  try {
    const v = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

function writeChoice(choice: ConsentChoice): void {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch {
    // Storage blocked (private mode): the choice holds for this page view only.
  }
}

function injectScript(src: string): void {
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

/** Clarity + Meta Pixel, once per page, after the browser is idle. Production host only. */
function loadMarketingTags(): void {
  const w = window as MarketingWindow;
  if (w.location.hostname !== PROD_HOST || w.__olMarketingLoaded) return;
  w.__olMarketingLoaded = true;

  const run = () => {
    // Microsoft Clarity — queue calls until the tag arrives.
    const clarity: QueuedFn = (...args: unknown[]) => {
      (clarity.q = clarity.q || []).push(args);
    };
    w.clarity = w.clarity || clarity;
    injectScript(`https://www.clarity.ms/tag/${CLARITY_ID}`);

    // Meta Pixel — the standard stub, written out.
    if (!w.fbq) {
      const fbq: QueuedFn = (...args: unknown[]) => {
        if (fbq.callMethod) fbq.callMethod(...args);
        else (fbq.queue = fbq.queue || []).push(args);
      };
      fbq.push = fbq;
      fbq.loaded = true;
      fbq.version = "2.0";
      fbq.queue = [];
      w.fbq = fbq;
      if (!w._fbq) w._fbq = fbq;
      injectScript("https://connect.facebook.net/en_US/fbevents.js");
      fbq("init", META_PIXEL_ID);
      fbq("track", "PageView");
    }
  };

  if ("requestIdleCallback" in w) w.requestIdleCallback(run, { timeout: 4000 });
  else setTimeout(run, 2000);
}

function updateGoogleConsent(choice: ConsentChoice): void {
  window.gtag?.("consent", "update", {
    ad_storage: choice,
    ad_user_data: choice,
    ad_personalization: choice,
    analytics_storage: choice,
  });
}

/**
 * Asks visitors in the consent region (EEA, UK, CH — see lib/consent.ts)
 * before anything beyond consent-mode GA runs; loads marketing tags for
 * everyone else. The footer's "Cookie settings" reopens it for any visitor.
 */
export function ConsentManager() {
  const t = useTranslations("consent");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const choice = readChoice();
    const askFirst = inConsentRegion();
    if (choice === "granted" || (choice === null && !askFirst)) loadMarketingTags();

    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    // Open after mount (not during render) so server and client HTML match.
    const timer = choice === null && askFirst ? window.setTimeout(reopen, 0) : undefined;
    return () => {
      window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  const decide = useCallback((choice: ConsentChoice) => {
    writeChoice(choice);
    updateGoogleConsent(choice);
    if (choice === "granted") loadMarketingTags();
    else (window as MarketingWindow).fbq?.("consent", "revoke");
    setOpen(false);
  }, []);

  if (!open) return null;

  const button =
    "rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent";

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={t("label")}
      className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-4"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-xl border border-border bg-background/95 p-4 shadow-2xl backdrop-blur sm:flex-row sm:items-center sm:gap-4">
        <p className="flex-1 text-sm leading-relaxed text-muted">
          {t("text")}{" "}
          <Link href="/privacy" className="text-foreground underline underline-offset-4">
            {t("privacy")}
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button type="button" className={button} onClick={() => decide("denied")}>
            {t("reject")}
          </button>
          <button type="button" className={button} onClick={() => decide("granted")}>
            {t("accept")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CookieSettingsButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}
      className="text-xs text-muted/70 underline-offset-4 transition-colors hover:text-foreground hover:underline"
    >
      {label}
    </button>
  );
}
