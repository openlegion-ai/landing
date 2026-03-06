import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Pricing } from "@/components/pricing";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing for OpenLegion managed hosting. Deploy production AI agents with container isolation, 100+ LLM providers, and real-time monitoring.",
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
