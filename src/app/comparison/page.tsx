import type { Metadata } from "next";
import { getContentPage } from "@/lib/markdown";
import { buildMetadata } from "@/lib/content-page-helpers";
import { ContentPage } from "@/components/content-page";
import { JsonLd, buildItemListSchema } from "@/components/json-ld";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const SLUG = "/comparison";

const COMPARISON_ITEMS = [
  { name: "OpenLegion vs OpenClaw", url: "https://openlegion.ai/comparison/openclaw", position: 1 },
  { name: "OpenLegion vs LangGraph", url: "https://openlegion.ai/comparison/langgraph", position: 2 },
  { name: "OpenLegion vs CrewAI", url: "https://openlegion.ai/comparison/crewai", position: 3 },
  { name: "OpenLegion vs AutoGen", url: "https://openlegion.ai/comparison/autogen", position: 4 },
  { name: "OpenLegion vs Dify", url: "https://openlegion.ai/comparison/dify", position: 5 },
  { name: "OpenLegion vs Google ADK", url: "https://openlegion.ai/comparison/google-adk", position: 6 },
  { name: "OpenLegion vs AWS Strands", url: "https://openlegion.ai/comparison/aws-strands", position: 7 },
  { name: "OpenLegion vs OpenAI Agents SDK", url: "https://openlegion.ai/comparison/openai-agents-sdk", position: 8 },
  { name: "OpenLegion vs Manus AI", url: "https://openlegion.ai/comparison/manus-ai", position: 9 },
  { name: "OpenLegion vs Semantic Kernel", url: "https://openlegion.ai/comparison/semantic-kernel", position: 10 },
  { name: "OpenLegion vs ZeroClaw", url: "https://openlegion.ai/comparison/zeroclaw", position: 11 },
  { name: "OpenLegion vs NanoClaw", url: "https://openlegion.ai/comparison/nanoclaw", position: 12 },
  { name: "OpenLegion vs nanobot", url: "https://openlegion.ai/comparison/nanobot", position: 13 },
  { name: "OpenLegion vs PicoClaw", url: "https://openlegion.ai/comparison/picoclaw", position: 14 },
  { name: "OpenLegion vs OpenFang", url: "https://openlegion.ai/comparison/openfang", position: 15 },
  { name: "OpenLegion vs MemU", url: "https://openlegion.ai/comparison/memu", position: 16 },
];

export async function generateMetadata(): Promise<Metadata> {
  const { frontmatter } = await getContentPage(SLUG);
  return buildMetadata(frontmatter);
}

export default async function Page() {
  const page = await getContentPage(SLUG);
  return (
    <>
      <JsonLd data={buildItemListSchema(COMPARISON_ITEMS)} />
      <a href="#main" className="skip-nav">Skip to content</a>
      <Navbar />
      <main id="main">
        <ContentPage page={page} />
      </main>
      <Footer />
    </>
  );
}
