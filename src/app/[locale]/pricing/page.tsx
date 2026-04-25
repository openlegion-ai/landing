import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Pricing, PricingFAQ } from "@/components/pricing";
import { SocialProof } from "@/components/social-proof";
import { Footer } from "@/components/footer";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return {
    title: t("pricingTitle"),
    description: t("pricingDescription"),
    alternates: {
      canonical: "https://www.openlegion.ai/pricing",
    },
    openGraph: {
      title: t("pricingOgTitle"),
      description: t("pricingOgDescription"),
      type: "website",
      siteName: "OpenLegion",
      url: "https://www.openlegion.ai/pricing",
    },
    twitter: {
      card: "summary_large_image",
      site: "@openlegion",
      title: t("pricingTwitterTitle"),
      description: t("pricingTwitterDescription"),
    },
  };
}

export default function PricingPage() {
  return (
    <>
      <main id="main">
        <Pricing />
        <SocialProof />
        <PricingFAQ />
      </main>
      <Footer />
    </>
  );
}
