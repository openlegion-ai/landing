import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Pricing } from "@/components/pricing";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "AI Agent Platform Pricing — 7-Day Free Trial",
  description:
    "Try your AI workforce free for 7 days. No credit card required. Plans from $19/month with container isolation, vault security, and 100+ LLM providers.",
  alternates: {
    canonical: "https://www.openlegion.ai/pricing",
  },
  openGraph: {
    title: "AI Agent Platform Pricing — 7-Day Free Trial | OpenLegion",
    description:
      "Try your AI workforce free for 7 days. No credit card required. Container isolation, vault security, and 100+ LLM providers.",
    type: "website",
    siteName: "OpenLegion",
    url: "https://www.openlegion.ai/pricing",
  },
  twitter: {
    card: "summary_large_image",
    site: "@openlegion",
    title: "AI Agent Platform Pricing — 7-Day Free Trial | OpenLegion",
    description:
      "Try your AI workforce free for 7 days. No credit card required.",
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
