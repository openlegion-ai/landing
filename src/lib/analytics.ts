declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

type CtaParams = {
  location: string;
  plan?: string;
  billing?: string;
};

export function trackCtaClick(params: CtaParams): void {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", "cta_click", params);
}

// GA4 standard ecommerce events fired from the landing /pricing page so
// it joins the same prebuilt funnel as the app side:
//   view_item_list → select_item → begin_checkout → purchase
// `cta_click` keeps its own helper because it's a custom event used in
// many non-pricing locations (hero, nav, inline, final).
type EcommerceEventName = "view_item_list" | "select_item";

export function trackEvent(
  name: EcommerceEventName,
  params: Record<string, unknown>,
): void {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", name, params);
}
