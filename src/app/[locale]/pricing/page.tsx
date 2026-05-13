import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Pricing, PricingFAQ } from "@/components/pricing";
import { SocialProof } from "@/components/social-proof";
import { Footer } from "@/components/footer";
import { navPageAlternates, OG_LOCALE_MAP, SITE_URL } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("metadata");
  const alternates = navPageAlternates(locale, "/pricing");
  return {
    title: t("pricingTitle"),
    description: t("pricingDescription"),
    alternates,
    openGraph: {
      title: t("pricingOgTitle"),
      description: t("pricingOgDescription"),
      type: "website",
      siteName: "OpenLegion",
      url: `${SITE_URL}/${locale}/pricing`,
      locale: OG_LOCALE_MAP[locale] || "en_US",
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
        <SocialProof showCommunityLinks={false} />
        <PricingFAQ />
      </main>
      <Footer />
    </>
  );
}
