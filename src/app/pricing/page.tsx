import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Pricing } from "@/components/pricing";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "AI Agent Platform Pricing & Plans",
  description:
    "Simple, transparent pricing for OpenLegion managed hosting. Deploy AI agents with container isolation, per-agent budgets, and 100+ LLM providers. Plans from $19/month.",
  alternates: {
    canonical: "https://openlegion.ai/pricing",
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
