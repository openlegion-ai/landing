import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

const SLUG_TO_TITLE: Record<string, string> = {
  "ai-agent-platform": "AI Agent Platform — Deploy Secure Agents",
  "ai-agent-orchestration": "AI Agent Orchestration — Coordinate Agents",
  "ai-agent-frameworks": "Best AI Agent Frameworks (2026 Comparison)",
  "ai-agent-security": "AI Agent Security — Threats, Isolation, Vaults",
  "comparison": "AI Agent Framework Comparison 2026",
  "comparison-openclaw": "OpenLegion vs OpenClaw — Detailed Comparison",
  "comparison-dify": "OpenLegion vs Dify — Detailed Comparison",
  "comparison-openai-agents-sdk": "OpenLegion vs OpenAI Agents SDK — Comparison",
  "comparison-semantic-kernel": "OpenLegion vs Semantic Kernel — Comparison",
  "comparison-autogen": "OpenLegion vs AutoGen — Detailed Comparison",
  "comparison-crewai": "OpenLegion vs CrewAI — Detailed Comparison",
  "comparison-langgraph": "OpenLegion vs LangGraph — Detailed Comparison",
  "comparison-manus-ai": "OpenLegion vs Manus AI — Detailed Comparison",
  "comparison-aws-strands": "OpenLegion vs AWS Strands — Detailed Comparison",
  "comparison-google-adk": "OpenLegion vs Google ADK — Detailed Comparison",
  "comparison-zeroclaw": "OpenLegion vs ZeroClaw — Detailed Comparison",
  "comparison-nanoclaw": "OpenLegion vs NanoClaw — Detailed Comparison",
  "comparison-nanobot": "OpenLegion vs nanobot — Detailed Comparison",
  "comparison-picoclaw": "OpenLegion vs PicoClaw — Detailed Comparison",
  "comparison-openfang": "OpenLegion vs OpenFang — Detailed Comparison",
  "comparison-memu": "OpenLegion vs MemU — Detailed Comparison",
  "openclaw-alternative": "OpenClaw Alternative — OpenLegion",
};

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
        {/* Top accent line */}
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

        {/* Logo + Brand */}
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

        {/* Title */}
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

        {/* Tagline */}
        <p
          style={{
            fontSize: "22px",
            color: "#8b8fa3",
            marginTop: "24px",
            maxWidth: "700px",
          }}
        >
          Managed AI agent platform with container isolation and blind
          credential injection.
        </p>

        {/* URL */}
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
    }
  );
}

export function generateStaticParams() {
  return Object.keys(SLUG_TO_TITLE).map((slug) => ({ slug }));
}
