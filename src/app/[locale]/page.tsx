import { getTranslations } from "next-intl/server";
import { Hero } from "@/components/hero";
import { UseCases } from "@/components/use-cases";
import { PromptToTeam } from "@/components/prompt-to-team";
import { ProductionReady } from "@/components/production-ready";
import { ReadyMadeTeams } from "@/components/ready-made-teams";
import { SocialProof } from "@/components/social-proof";
import { Testimonials } from "@/components/testimonials";
import { Features } from "@/components/features";
import { DashboardPreview } from "@/components/dashboard-preview";
import { Quickstart } from "@/components/quickstart";
import { Security } from "@/components/security";
import { Architecture } from "@/components/architecture";
import { Enterprise } from "@/components/enterprise";
import { Comparison } from "@/components/comparison";
import { FAQ } from "@/components/faq";
import { CTA } from "@/components/cta";
import { CapabilityBand } from "@/components/capability-band";
import { TechnicalDefinition } from "@/components/technical-definition";
import { Footer } from "@/components/footer";
import { ALL_FAQ_ITEMS, GITHUB_URL, APP_URL } from "@/lib/constants";

// Homepage inherits title + description from root layout metadata.
// Page-level JSON-LD schemas are defined inline below.

async function getGitHubStars(): Promise<string | null> {
  try {
    const res = await fetch(
      "https://api.github.com/repos/openlegion-ai/openlegion",
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const count = data.stargazers_count;
    if (typeof count !== "number") return null;
    return count >= 1000 ? (count / 1000).toFixed(1) + "k" : String(count);
  } catch {
    return null;
  }
}

export default async function Home() {
  const stars = await getGitHubStars();
  const t = await getTranslations("common");

  const homeTitle =
    "OpenLegion — Container-Isolated Multi-Agent Runtime | Automate, Stay in Control";
  const homeDescription =
    "OpenLegion is a container-isolated multi-agent runtime with managed hosting. Deploy autonomous agents in Docker-isolated sandboxes with vault-proxied credentials, per-agent budgets, fleet-model coordination (blackboard + pub/sub + handoff, no CEO agent), and 100+ LLM providers via LiteLLM.";

  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "OpenLegion",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Linux, macOS, Windows",
    description: "OpenLegion is a container-isolated multi-agent runtime built for production. Deploy autonomous agents in isolated Docker containers with per-agent budgets, vault-proxied credentials, and defense-in-depth security enabled by default.",
    url: "https://www.openlegion.ai",
    downloadUrl: GITHUB_URL,
    softwareVersion: "0.1.0",
    programmingLanguage: "Python",
    license: `${GITHUB_URL}/blob/main/LICENSE`,
    releaseNotes:
      "Production-ready AI agent fleets with container isolation, defense-in-depth security, per-agent cost governance, self-hosted deployment, fleet-model coordination (blackboard + pub/sub + handoff, no CEO agent), 5,800+ tests across 155 files, 20+ built-in skill modules + 24+ browser actions, 100+ LLM providers via LiteLLM, real-time dashboard, and MCP (stdio) support.",
    softwareHelp: {
      "@type": "CreativeWork",
      url: "https://docs.openlegion.ai",
    },
    softwareRequirements: "Python 3.10+, Docker",
    featureList: [
      "Autonomous agents that automate browser, file, code, and API tasks",
      "Built-in stealth browser — per-agent Camoufox in a shared browser service container",
      "Container isolation per agent — Docker or Docker Desktop Sandbox microVM",
      "Vault proxy — agents never see API keys",
      "Per-agent budget enforcement — automatic cutoff",
      "100+ LLM providers via LiteLLM — no vendor lock-in",
      "Fleet dashboard with real-time cost monitoring",
      "Fleet model coordination — blackboard + pub/sub + handoff (no CEO agent)",
      "MCP (stdio) tool extensibility — 20+ built-in skill modules",
      "Self-hosted (BSL 1.1) or managed hosting on a dedicated VPS",
    ],
    screenshot: {
      "@type": "ImageObject",
      url: "https://www.openlegion.ai/og.png",
      width: 1200,
      height: 630,
    },
    offers: [
      {
        "@type": "Offer",
        name: "Basic",
        price: "19",
        priceCurrency: "USD",
        billingPeriod: "P1M",
        availability: "https://schema.org/InStock",
      },
      {
        "@type": "Offer",
        name: "Growth",
        price: "59",
        priceCurrency: "USD",
        billingPeriod: "P1M",
        availability: "https://schema.org/InStock",
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "149",
        priceCurrency: "USD",
        billingPeriod: "P1M",
        availability: "https://schema.org/InStock",
      },
      {
        "@type": "Offer",
        name: "Pro Max",
        price: "279",
        priceCurrency: "USD",
        billingPeriod: "P1M",
        availability: "https://schema.org/InStock",
      },
    ],
    author: {
      "@type": "Organization",
      name: "OpenLegion",
      url: "https://www.openlegion.ai",
    },
  };

  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: homeTitle,
    description: homeDescription,
    url: "https://www.openlegion.ai",
    datePublished: "2026-02-18",
    dateModified: new Date().toISOString().slice(0, 10),
    inLanguage: "en",
    isPartOf: {
      "@type": "WebSite",
      name: "OpenLegion",
      url: "https://www.openlegion.ai",
    },
    about: {
      "@type": "SoftwareApplication",
      name: "OpenLegion",
    },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["#hero", "#faq", ".definition-block"],
    },
    mentions: [
      { "@type": "SoftwareApplication", name: "Docker", sameAs: "https://www.wikidata.org/wiki/Q15206305" },
      { "@type": "ProgrammingLanguage", name: "Python", sameAs: "https://www.wikidata.org/wiki/Q28865" },
      { "@type": "SoftwareApplication", name: "LangGraph", sameAs: "https://github.com/langchain-ai/langgraph" },
      { "@type": "SoftwareApplication", name: "CrewAI", sameAs: "https://github.com/crewAIInc/crewAI" },
      { "@type": "SoftwareApplication", name: "AutoGen", sameAs: "https://github.com/microsoft/autogen" },
    ],
  };

  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to install and run OpenLegion AI agent fleet",
    description: "Deploy a production-ready AI agent fleet with container isolation using three commands.",
    totalTime: "PT5M",
    tool: [
      { "@type": "HowToTool", name: "Python 3.10+" },
      { "@type": "HowToTool", name: "Docker" },
      { "@type": "HowToTool", name: "An LLM API key (any of 15+ supported providers — Anthropic / OpenAI / Gemini / Mistral / Groq / DeepSeek / OpenRouter / etc.)" },
    ],
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Clone the repository",
        text: "Clone the OpenLegion repository from GitHub and navigate into the project directory.",
        url: "https://www.openlegion.ai/#quickstart",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Run the installer",
        text: "Run install.sh to check dependencies, create a virtual environment, and make the CLI globally available.",
        url: "https://www.openlegion.ai/#quickstart",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Start the agent fleet",
        text: "Run 'openlegion start' to launch the inline setup wizard on first run, then deploy agents in isolated containers.",
        url: "https://www.openlegion.ai/#quickstart",
      },
    ],
  };

  const videoJsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: "OpenLegion Demo — AI Agent Fleet Deployment",
    description: "Watch OpenLegion deploy an autonomous AI agent fleet with container isolation, credential vaulting, and real-time cost tracking.",
    thumbnailUrl: "https://www.openlegion.ai/og.png",
    uploadDate: "2026-02-18",
    duration: "PT2M",
    contentUrl: "https://www.openlegion.ai/demo.mp4",
    embedUrl: "https://www.openlegion.ai/demo.mp4",
    publisher: {
      "@type": "Organization",
      name: "OpenLegion",
      url: "https://www.openlegion.ai",
      logo: {
        "@type": "ImageObject",
        url: "https://www.openlegion.ai/logo.png",
      },
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: ALL_FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd).replace(/</g, "\\u003c") }}
      />
      <main id="main">
        <Hero />
        <CapabilityBand />
        <PromptToTeam />
        <ReadyMadeTeams />
        <UseCases />
        <SocialProof stars={stars} />
        <Testimonials />
        <ProductionReady />
        <Features />
        <div className="px-5 py-10 text-center sm:px-6 md:px-8 md:py-14">
          <div className="mx-auto mb-6 h-px w-1/4 bg-gradient-to-r from-transparent via-accent/20 to-transparent sm:w-1/3" aria-hidden="true" />
          <p className="mb-3 text-sm text-muted">{t("readyToStart")}</p>
          <a href={APP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-accent/25 bg-accent/[0.06] px-5 py-2.5 text-sm font-medium text-accent-light transition-all hover:border-accent/40 hover:bg-accent/10">
            {t("getStartedInline")}
          </a>
          <div className="mx-auto mt-6 h-px w-1/4 bg-gradient-to-r from-transparent via-accent/20 to-transparent sm:w-1/3" aria-hidden="true" />
        </div>
        <DashboardPreview />
        <div className="px-5 py-10 text-center sm:px-6 md:px-8 md:py-14">
          <div className="mx-auto mb-6 h-px w-1/4 bg-gradient-to-r from-transparent via-accent/20 to-transparent sm:w-1/3" aria-hidden="true" />
          <p className="mb-3 text-sm text-muted">{t("fleetLivePrompt")}</p>
          <a href={APP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-accent/25 bg-accent/[0.06] px-5 py-2.5 text-sm font-medium text-accent-light transition-all hover:border-accent/40 hover:bg-accent/10">
            {t("getStartedInMinutes")}
          </a>
          <div className="mx-auto mt-6 h-px w-1/4 bg-gradient-to-r from-transparent via-accent/20 to-transparent sm:w-1/3" aria-hidden="true" />
        </div>
        <Quickstart />
        <Security />
        <Architecture />
        <Enterprise />
        <Comparison />
        <FAQ />
        <TechnicalDefinition />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
