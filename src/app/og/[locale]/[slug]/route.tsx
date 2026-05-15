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
function staticTitleKey(slug: string): string | null {
  if (slug === "learn") return "learnTitle";
  return null;
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
  const tSchema = await getTranslations({ locale, namespace: "schema" });

  let title: string;
  const staticKey = staticTitleKey(slug);
  if (staticKey) {
    title = tMeta(staticKey);
  } else {
    const contentSlug = ogKeyToContentSlug(slug, KNOWN_CONTENT_SLUGS);
    title = contentSlug
      ? getContentTitle(contentSlug, locale) ?? "OpenLegion"
      : "OpenLegion";
  }

  const tagline = tSchema("orgDescription");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "80px",
          background:
            "linear-gradient(135deg, #08090c 0%, #12131d 50%, #0a0b10 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, #3b82f6, #60a5fa, #3b82f6)",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "#3b82f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              fontWeight: 800,
              color: "white",
            }}
          >
            O
          </div>
          <span
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: "#f0f0f3",
              letterSpacing: "-0.01em",
            }}
          >
            Open
            <span style={{ color: "#3b82f6" }}>Legion</span>
          </span>
        </div>

        <h1
          style={{
            fontSize: "52px",
            fontWeight: 800,
            color: "#f0f0f3",
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
            maxWidth: "900px",
            margin: 0,
          }}
        >
          {title}
        </h1>

        <p
          style={{
            fontSize: "22px",
            color: "#8b8fa3",
            marginTop: "24px",
            maxWidth: "700px",
          }}
        >
          {tagline}
        </p>

        <div
          style={{
            position: "absolute",
            bottom: "40px",
            right: "80px",
            fontSize: "18px",
            color: "#3b82f6",
          }}
        >
          openlegion.ai
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
  const slugs: string[] = ["learn"];
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
