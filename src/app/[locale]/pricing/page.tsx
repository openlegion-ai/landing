import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Pricing, PricingFAQ } from "@/components/pricing";
import { SocialProof } from "@/components/social-proof";
import { Footer } from "@/components/footer";
import { navPageAlternates, OG_LOCALE_MAP, SITE_URL } from "@/lib/seo";
import { ogLocaleFor } from "@/lib/content-page-helpers";

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
      images: [{ url: `/og/${ogLocaleFor(locale)}/pricing.png`, width: 1200, height: 630, alt: t("pricingOgTitle") }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@openlegion",
      images: [`/og/${ogLocaleFor(locale)}/pricing.png`],
      title: t("pricingTwitterTitle"),
      description: t("pricingTwitterDescription"),
    },
  };
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
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
