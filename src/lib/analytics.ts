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
