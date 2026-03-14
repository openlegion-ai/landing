import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { AudienceSelector } from "@/components/audience-selector";
import { UseCases } from "@/components/use-cases";
import { SocialProof } from "@/components/social-proof";
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

export const metadata: Metadata = {
  description:
    "OpenLegion is the AI agent framework and platform built for production. Deploy autonomous agents that automate any computer task — browsing, forms, code, outreach, data. Starts at $19/month. No surprise bills.",
};

export default async function Home() {

  const homeTitle =
    "OpenLegion — AI Agent Framework & Platform | Automate Anything, Stay in Control";
  const homeDescription =
    "OpenLegion is a production-grade AI agent framework and platform for agentic AI orchestration. Deploy autonomous agents that automate anything a human can do on a computer — in container-isolated sandboxes with built-in AI agent security. Per-agent budgets, credential vaults, deterministic workflows, 100+ LLM providers.";

  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "OpenLegion",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Linux, macOS, Windows",
    description: "OpenLegion is the AI agent framework and platform built for production. Deploy autonomous agents that automate any computer task — each in its own isolated Docker container with per-agent budgets, vault-proxied credentials, and six security layers enabled by default.",
    url: "https://www.openlegion.ai",
    downloadUrl: APP_URL,
    softwareVersion: "0.1.0",
    programmingLanguage: "Python",
    license: `${GITHUB_URL}/blob/main/LICENSE`,
    releaseNotes:
      "Enterprise-ready AI agent fleets with container isolation, six security layers, per-agent cost governance, on-premises deployment, deterministic YAML workflows, 2,100+ tests, 50+ built-in tools, 100+ LLM providers, real-time dashboard, and MCP support.",
    softwareHelp: {
      "@type": "CreativeWork",
      url: "https://docs.openlegion.ai",
    },
    softwareRequirements: "Python 3.10+, Docker",
    featureList: [
      "Autonomous agents that automate any computer task",
      "Built-in stealth browser — agents operate any website",
      "Container isolation per agent — Docker or microVM",
      "Vault proxy — agents never see API keys",
      "Per-agent budget enforcement — automatic cutoff",
      "100+ LLM providers via LiteLLM — no vendor lock-in",
      "Fleet dashboard with real-time cost monitoring",
      "Deterministic YAML orchestration — no LLM in control plane",
      "MCP-compatible tool extensibility — 50+ built-in skills",
      "On-premises and air-gapped deployment support",
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
      <a href="#main" className="skip-nav">Skip to content</a>
      <Navbar />
      <main id="main">
        <Hero />
        <CapabilityBand />
        <AudienceSelector />
        <UseCases />
        <SocialProof />
        {/* Social proof placeholder — uncomment when real quote is sourced */}
        {/* <section className="py-12 text-center max-w-[640px] mx-auto px-6">
          <blockquote className="text-lg italic text-foreground leading-relaxed mb-3">
            &ldquo;Real quote goes here.&rdquo;
          </blockquote>
          <cite className="text-[13px] text-muted not-italic">— First name, Role</cite>
        </section> */}
        <Features />
        <div className="px-5 py-8 text-center text-sm text-muted sm:px-6 md:px-8 md:py-10">
          <div className="mx-auto mb-5 h-px w-1/3 bg-gradient-to-r from-transparent via-accent/20 to-transparent" aria-hidden="true" />
          Ready to put your first agent to work?{" "}
          <a href={APP_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-accent-light hover:underline">
            Deploy free in minutes →
          </a>
          <div className="mx-auto mt-5 h-px w-1/3 bg-gradient-to-r from-transparent via-accent/20 to-transparent" aria-hidden="true" />
        </div>
        <DashboardPreview />
        <div className="px-5 py-8 text-center text-sm text-muted sm:px-6 md:px-8 md:py-10">
          <div className="mx-auto mb-5 h-px w-1/3 bg-gradient-to-r from-transparent via-accent/20 to-transparent" aria-hidden="true" />
          This is your fleet, live.{" "}
          <a href={APP_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-accent-light hover:underline">
            Start your free deployment →
          </a>
          <div className="mx-auto mt-5 h-px w-1/3 bg-gradient-to-r from-transparent via-accent/20 to-transparent" aria-hidden="true" />
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
