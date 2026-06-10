declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    fbq?: (...args: unknown[]) => void;
  }
}

type CtaParams = {
  location: string;
  plan?: string;
  billing?: string;
};

export function trackCtaClick(params: CtaParams): void {
  if (typeof window === "undefined") return;
  window.gtag?.("event", "cta_click", params);

  // Every landing CTA — including a pricing-card click — just routes the
  // visitor to app.openlegion.ai to log in; none of them start a real
  // checkout here. So they all map to a single top-funnel `Lead`. The
  // standard funnel events (AddToCart → InitiateCheckout → Purchase) fire in
  // the app, where the actual checkout happens, so they aren't double-counted
  // across the two domains that share this Pixel ID.
  window.fbq?.("track", "Lead", {
    content_name: params.location,
    ...(params.plan ? { content_category: params.plan } : {}),
  });
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
  if (typeof window === "undefined") return;
  window.gtag?.("event", name, params);

  // Only the pricing-list view maps to a Meta event (ViewContent) — it's a
  // genuine "saw the prices" moment, useful for retargeting. `select_item` is
  // intentionally not mirrored: on the landing page a tier click just routes
  // to app login, and trackCtaClick already fires a `Lead` for that same
  // click. The real AddToCart fires in the app paywall.
  if (name === "view_item_list") {
    window.fbq?.("track", "ViewContent", {
      content_name: typeof params.plan === "string" ? params.plan : "pricing_tiers",
      ...(typeof params.billing === "string" ? { content_category: params.billing } : {}),
    });
  }
}
