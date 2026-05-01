import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getAllContentEntries } from "@/lib/markdown";

const BRAND_TAGLINE =
  "Managed AI agent platform with container isolation and blind credential injection.";

const STATIC_TITLES: Record<string, string> = {
  learn: "Learn — AI Agent Platform, Orchestration & Security",
};

/** Build a slug → title map at module init from the discovery map. */
function buildSlugToTitle(): Record<string, string> {
  const map: Record<string, string> = { ...STATIC_TITLES };
  for (const entry of getAllContentEntries()) {
    const ogKey = entry.slug.replace(/^\//, "").replace(/\//g, "-");
    map[ogKey] = entry.frontmatter.title;
  }
  return map;
}

const SLUG_TO_TITLE = buildSlugToTitle();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const title = SLUG_TO_TITLE[slug] || "OpenLegion";

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
          background: "linear-gradient(135deg, #08090c 0%, #12131d 50%, #0a0b10 100%)",
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
          {BRAND_TAGLINE}
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
        // Edge-cache for a day, allow stale-while-revalidate for a week so OG
        // images pick up frontmatter title edits without rebuilds.
        "Cache-Control":
          "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    }
  );
}

export function generateStaticParams() {
  return Object.keys(SLUG_TO_TITLE).map((slug) => ({ slug }));
}
