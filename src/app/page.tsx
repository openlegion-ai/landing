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
import { FAQ_ITEMS, GITHUB_URL } from "@/lib/constants";

async function getStarCount(): Promise<number> {
  try {
    const res = await fetch(
      "https://api.github.com/repos/openlegion-ai/openlegion",
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return 0;
    const data = await res.json();
    return data.stargazers_count ?? 0;
  } catch {
    return 0;
  }
}

export default async function Home() {
  const stars = await getStarCount();

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
    downloadUrl: GITHUB_URL,
    softwareVersion: "0.1.0",
    releaseNotes:
      "Enterprise-ready AI agent fleets with container isolation, six security layers, per-agent cost governance, on-premises deployment, deterministic YAML workflows, 1,607 tests, 44 built-in tools, 100+ LLM providers, real-time dashboard, and MCP support.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
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
    dateModified: new Date().toISOString().split("T")[0],
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
      <a href="#main" className="skip-nav">Skip to content</a>
      <Navbar />
      <main id="main">
        <Hero stars={stars} />
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
