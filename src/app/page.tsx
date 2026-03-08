import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { Comparison } from "@/components/comparison";
import { Features } from "@/components/features";
import { DashboardPreview } from "@/components/dashboard-preview";
import { UseCases } from "@/components/use-cases";
import { Architecture } from "@/components/architecture";
import { Security } from "@/components/security";
import { Enterprise } from "@/components/enterprise";
import { Quickstart } from "@/components/quickstart";
import { FAQ } from "@/components/faq";
import { SeoLinks } from "@/components/seo-links";
import { CTA } from "@/components/cta";
import { InlineCTA } from "@/components/inline-cta";
import { Footer } from "@/components/footer";
import { FAQ_ITEMS, GITHUB_URL, APP_URL } from "@/lib/constants";

export const metadata: Metadata = {
  description:
    "Deploy autonomous AI agent fleets with container isolation, blind credential injection, per-agent budgets, and deterministic orchestration. 100+ LLM providers.",
};

export default async function Home() {

  const homeTitle =
    "OpenLegion — AI Agent Framework & Platform";
  const homeDescription =
    "OpenLegion is a production-grade AI agent framework and platform for agentic AI orchestration. Deploy autonomous agent fleets in container-isolated sandboxes with built-in AI agent security — six layers enabled by default. Per-agent budgets, credential vaults, deterministic workflows, 100+ LLM providers.";

  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "OpenLegion",
    description: homeDescription,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Linux, macOS, Windows",
    programmingLanguage: "Python",
    license: `${GITHUB_URL}/blob/main/LICENSE`,
    url: "https://openlegion.ai",
    downloadUrl: APP_URL,
    softwareVersion: "0.1.0",
    releaseNotes:
      "Enterprise-ready AI agent fleets with container isolation, six security layers, per-agent cost governance, on-premises deployment, deterministic YAML workflows, 1,826 tests, 41 built-in tools, 100+ LLM providers, real-time dashboard, and MCP support.",
    softwareHelp: {
      "@type": "CreativeWork",
      url: "https://docs.openlegion.ai",
    },
    softwareRequirements: "Python 3.10+, Docker",
    featureList:
      "Container isolation, Blind credential injection, Per-agent budget controls, Deterministic YAML orchestration, 100+ LLM providers, MCP-compatible extensibility, Multi-channel deployment, Browser automation, Fleet dashboard, Six security layers",
    screenshot: {
      "@type": "ImageObject",
      url: "https://openlegion.ai/og.png",
      width: 1200,
      height: 630,
    },
    offers: [
      {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Self-hosted (free)",
        availability: "https://schema.org/InStock",
      },
      {
        "@type": "Offer",
        price: "19",
        priceCurrency: "USD",
        description: "Basic — 1 agent, 1 project (hosted, monthly)",
        availability: "https://schema.org/InStock",
      },
      {
        "@type": "Offer",
        price: "59",
        priceCurrency: "USD",
        description: "Growth — 5 agents, 2 projects (hosted, monthly)",
        availability: "https://schema.org/InStock",
      },
      {
        "@type": "Offer",
        price: "149",
        priceCurrency: "USD",
        description: "Pro — 15 agents, 5 projects, dedicated CPU (hosted, monthly)",
        availability: "https://schema.org/InStock",
      },
    ],
    author: {
      "@type": "Organization",
      name: "OpenLegion",
      url: "https://openlegion.ai",
    },
  };

  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: homeTitle,
    description: homeDescription,
    url: "https://openlegion.ai",
    datePublished: "2025-12-01",
    dateModified: new Date().toISOString().slice(0, 10),
    inLanguage: "en",
    isPartOf: {
      "@type": "WebSite",
      name: "OpenLegion",
      url: "https://openlegion.ai",
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
    totalTime: "PT1M",
    tool: [
      { "@type": "HowToTool", name: "Python 3.10+" },
      { "@type": "HowToTool", name: "Docker" },
      { "@type": "HowToTool", name: "An LLM API key (Anthropic, OpenAI, or Moonshot)" },
    ],
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Clone the repository",
        text: "Clone the OpenLegion repository from GitHub and navigate into the project directory.",
        url: "https://openlegion.ai/#quickstart",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Run the installer",
        text: "Run install.sh to check dependencies, create a virtual environment, and make the CLI globally available.",
        url: "https://openlegion.ai/#quickstart",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Start the agent fleet",
        text: "Run 'openlegion start' to launch the inline setup wizard on first run, then deploy agents in isolated containers.",
        url: "https://openlegion.ai/#quickstart",
      },
    ],
  };

  const videoJsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: "OpenLegion Demo — AI Agent Fleet Deployment",
    description: "Watch OpenLegion deploy an autonomous AI agent fleet with container isolation, credential vaulting, and real-time cost tracking.",
    thumbnailUrl: "https://openlegion.ai/og.png",
    uploadDate: "2025-12-01",
    duration: "PT2M",
    contentUrl: "https://openlegion.ai/demo.mp4",
    embedUrl: "https://openlegion.ai/demo.mp4",
    publisher: {
      "@type": "Organization",
      name: "OpenLegion",
      url: "https://openlegion.ai",
      logo: {
        "@type": "ImageObject",
        url: "https://openlegion.ai/logo.png",
      },
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
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
      <a href="#main" className="skip-nav">Skip to content</a>
      <Navbar />
      <main id="main">
        <Hero />
        <Features />
        <DashboardPreview />
        <Quickstart />
        <InlineCTA heading="Ready to deploy your first agent fleet?" />
        <UseCases />
        <Comparison />
        <Architecture />
        <Security />
        <InlineCTA heading="See how fast secure agents can ship." />
        <Enterprise />
        <FAQ />
        <SeoLinks />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
