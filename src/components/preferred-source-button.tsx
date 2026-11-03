import Script from "next/script";

/*
 * Google "Add preferred source" button (official embed, Search Central:
 * /search/docs/appearance/preferred-sources). Readers who click get
 * openlegion.ai labeled "preferred" in Top Stories, AI Overviews, and
 * AI Mode — Google reports roughly 2x click likelihood for preferred
 * sources. Domain-level feature; the button renders nothing when Google
 * deems the site or browser ineligible, so placements degrade to empty.
 * Language is left to the visitor's browser (no data-lang) so one embed
 * serves all 13 locales.
 */
export function PreferredSourceButton({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <Script
        src="https://news.google.com/swg/js/v1/publisher.js"
        strategy="lazyOnload"
      />
      <div google-add-preferred-source-btn="" data-theme="light" />
    </div>
  );
}
