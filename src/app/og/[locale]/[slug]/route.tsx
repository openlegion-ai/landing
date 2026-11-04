import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getTranslations } from "next-intl/server";
import {
  getAllContentEntries,
  getContentTitle,
} from "@/lib/markdown";
import { OG_RENDERABLE_LOCALES } from "@/lib/content-page-helpers";

/**
 * Locale-aware OG image generator.
 *
 * Route shape: /og/<locale>/<slug>.png
 *
 * The metadata builders point at this URL per-locale; each variant gets its
 * own edge-cached PNG with the title and tagline in the visitor's language.
 * Social shares (LinkedIn, X, Slack) and Google's image-based SERP previews
 * therefore match the page language instead of falling back to English.
 *
 * Static page titles (the /learn hub etc.) use translation keys; markdown
 * content pages use `getContentTitle(slug, locale)` which reads from the
 * pre-built locale title map.
 */

// Static-page slug keys that aren't backed by a markdown file map to a
// translation key in the `metadata` namespace.
const STATIC_TITLE_KEYS: Record<string, string> = {
  home: "homeTitle",
  learn: "learnTitle",
  pricing: "pricingTitle",
  faq: "faqTitle",
  terms: "termsTitle",
  privacy: "privacyTitle",
  "money-back-guarantee": "moneyBackTitle",
  security: "securityTitle",
};

// Pages rebuilt for the SaaS pivot take their share titles from `platformMeta`;
// the rest still read the older `metadata` keys until their pages are rebuilt.
const PLATFORM_TITLE_KEYS: Record<string, string> = {
  home: "homeOgTitle",
  pricing: "pricingTitle",
  security: "securityTitle",
  faq: "faqTitle",
};

/** The brand mark as a data URI, read once; a plain disc stands in if the file is missing. */
let logoData: Promise<string | null> | null = null;
function loadLogo(): Promise<string | null> {
  logoData ??= readFile(join(process.cwd(), "public", "logo.png"))
    .then((b) => `data:image/png;base64,${b.toString("base64")}`)
    .catch(() => null);
  return logoData;
}

function staticTitleKey(slug: string): string | null {
  return STATIC_TITLE_KEYS[slug] ?? null;
}

/** Strip the `.png` decoration social-share URLs include in the segment. */
function normalizeSlug(slug: string): string {
  return slug.endsWith(".png") ? slug.slice(0, -4) : slug;
}

/** Reverse `slug.replace(/\//g, "-")` — `comparison-openclaw` → `/comparison/openclaw`. */
function ogKeyToContentSlug(ogKey: string, knownSlugs: Set<string>): string | null {
  // Direct mapping if the key has no dashes (root content like `openclaw-alternative`
  // or `deepseek-v4-agents` is a single segment).
  const tryDirect = `/${ogKey}`;
  if (knownSlugs.has(tryDirect)) return tryDirect;
  // Otherwise reconstruct by replacing dashes back to slashes, longest prefix first.
  // ogKey could be `learn-ai-agent-platform` → `/learn/ai-agent-platform`
  //               or `comparison-openclaw`   → `/comparison/openclaw`
  for (const prefix of ["learn-", "comparison-"]) {
    if (ogKey.startsWith(prefix)) {
      const rest = ogKey.slice(prefix.length);
      const candidate = `/${prefix.slice(0, -1)}/${rest}`;
      if (knownSlugs.has(candidate)) return candidate;
    }
  }
  // Last resort: direct lookup
  return knownSlugs.has(tryDirect) ? tryDirect : null;
}

// Pre-build the set of known content slugs at module init.
const KNOWN_CONTENT_SLUGS: Set<string> = new Set(
  getAllContentEntries().map((e) => e.slug),
);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ locale: string; slug: string }> },
) {
  const { locale, slug: rawSlug } = await params;
  const slug = normalizeSlug(rawSlug);

  const tMeta = await getTranslations({ locale, namespace: "metadata" });
  const tPlatform = await getTranslations({ locale, namespace: "platformMeta" });
  const tSchema = await getTranslations({ locale, namespace: "platformSchema" });
  const tBand = await getTranslations({ locale, namespace: "site.band" });

  let title: string;
  const staticKey = staticTitleKey(slug);
  if (PLATFORM_TITLE_KEYS[slug]) {
    title = tPlatform(PLATFORM_TITLE_KEYS[slug]);
  } else if (staticKey) {
    title = tMeta(staticKey);
  } else {
    const contentSlug = ogKeyToContentSlug(slug, KNOWN_CONTENT_SLUGS);
    title = contentSlug
      ? getContentTitle(contentSlug, locale) ?? "OpenLegion"
      : "OpenLegion";
  }

  // The entity sentence: what OpenLegion is, in the page's language.
  const tagline = tSchema("orgDescription");
  const logo = await loadLogo();
  const long = title.length > 64;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px 64px",
          backgroundColor: "#0a0b0f",
          backgroundImage:
            "radial-gradient(ellipse 70% 80% at 92% -10%, rgba(59,130,246,0.34), rgba(59,130,246,0) 70%), radial-gradient(ellipse 120% 40% at 50% 118%, rgba(59,130,246,0.22), rgba(59,130,246,0) 70%)",
          color: "#f4f5f7",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element -- Satori renders plain img only
            <img src={logo} width={44} height={44} style={{ borderRadius: "999px" }} alt="" />
          ) : (
            <div style={{ width: 44, height: 44, borderRadius: 999, backgroundColor: "#3b82f6" }} />
          )}
          <span style={{ fontSize: "30px", fontWeight: 600, letterSpacing: "-0.02em" }}>OpenLegion</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <h1
            style={{
              margin: 0,
              maxWidth: "1000px",
              fontSize: long ? "52px" : "64px",
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: "-0.035em",
              color: "#f6f7f9",
            }}
          >
            {title}
          </h1>
          <p
            style={{
              margin: "28px 0 0",
              maxWidth: "900px",
              fontSize: "24px",
              lineHeight: 1.42,
              color: "#9ba1ae",
            }}
          >
            {tagline}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "20px" }}>
          <span style={{ color: "#6b7280" }}>{tBand("short")}</span>
          <span style={{ color: "#93c5fd" }}>openlegion.ai</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        // Edge-cache for a day, stale-while-revalidate for a week so OG
        // images pick up frontmatter title edits without rebuilds.
        "Cache-Control":
          "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}

export function generateStaticParams() {
  // Static routes (homepage, pricing, legal pages, hubs) plus every
  // markdown content entry — one OG variant per slug.
  const slugs: string[] = Object.keys(STATIC_TITLE_KEYS);
  for (const entry of getAllContentEntries()) {
    slugs.push(entry.slug.replace(/^\//, "").replace(/\//g, "-"));
  }
  // Emit `.png` in the static-cache slug so the URL pattern (which the
  // metadata builders generate as `/og/<locale>/<slug>.png`) hits the
  // prerendered cache instead of dropping to dynamic re-render. The handler
  // strips the suffix via `normalizeSlug` before doing the title lookup.
  //
  // Only prerender for locales whose script Satori can render without
  // bundled font assets — see OG_RENDERABLE_LOCALES doc in
  // content-page-helpers.ts. ogImagePath clamps non-renderable locales to
  // "en", so /ja/foo's metadata correctly points at /og/en/foo.png and
  // never hits this generator with a CJK/RTL locale.
  return Array.from(OG_RENDERABLE_LOCALES).flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug: `${slug}.png` })),
  );
}
