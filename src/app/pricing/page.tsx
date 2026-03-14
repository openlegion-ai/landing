import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Pricing } from "@/components/pricing";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "AI Agent Platform Pricing — From $19/month",
  description:
    "Your AI workforce from $19/month. No surprise bills, no usage markup. Solo, Team, and Scale plans with container isolation, vault security, and 100+ LLM providers.",
  alternates: {
    canonical: "https://www.openlegion.ai/pricing",
  },
  openGraph: {
    title: "AI Agent Platform Pricing — From $19/month | OpenLegion",
    description:
      "Your AI workforce from $19/month. No surprise bills, no usage markup. Container isolation, vault security, and 100+ LLM providers.",
    type: "website",
    siteName: "OpenLegion",
    url: "https://www.openlegion.ai/pricing",
  },
  twitter: {
    card: "summary_large_image",
    site: "@openlegion",
    title: "AI Agent Platform Pricing — From $19/month | OpenLegion",
    description:
      "Your AI workforce from $19/month. No surprise bills, no usage markup.",
  },
};

export default function PricingPage() {
  return (
    <>
      <a href="#main" className="skip-nav">
        Skip to content
      </a>
      <Navbar />
      <main id="main">
        <Pricing />
      </main>
      <Footer />
    </>
  );
}
