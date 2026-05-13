import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { setRequestLocale } from "next-intl/server";
import { getLearnEntries } from "@/lib/markdown";
import { JsonLd, buildBreadcrumbSchema, buildItemListSchema } from "@/components/json-ld";
import { Footer } from "@/components/footer";
import { SUPPORTED_LOCALES } from "@/lib/constants";
import { navPageAlternates, OG_LOCALE_MAP, SITE_URL } from "@/lib/seo";

const SLUG = "/learn";
const BASE_URL = SITE_URL;

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

const TITLE = "Learn — AI Agent Framework, Coordination & Security";
const DESCRIPTION =
  "Practical guides to running production AI agents: runtime architecture, coordination patterns, framework selection, and the agent threat model.";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: navPageAlternates(locale, SLUG),
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      type: "website",
      siteName: "OpenLegion",
      url: `${BASE_URL}/${locale}${SLUG}`,
      locale: OG_LOCALE_MAP[locale] || "en_US",
      images: [
        {
          url: "/og/learn.png",
          width: 1200,
          height: 630,
          alt: TITLE,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@openlegion",
      title: TITLE,
      description: DESCRIPTION,
      images: ["/og/learn.png"],
    },
    robots: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large" as const,
      "max-video-preview": -1,
    },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const entries = getLearnEntries();

  const itemListItems = entries.map((entry, i) => ({
    name: entry.frontmatter.title,
    url: `${BASE_URL}/en${entry.slug}`,
    position: i + 1,
  }));

  return (
    <>
      <JsonLd
        data={[
          buildBreadcrumbSchema(TITLE, SLUG),
          buildItemListSchema(itemListItems),
        ]}
      />
      <main id="main" className="mx-auto max-w-4xl px-6 pb-24 pt-12 md:px-8">
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Learn</span>
        </nav>

        <header className="mt-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Learn
          </h1>
          <p className="mt-3 max-w-2xl text-muted">{DESCRIPTION}</p>
        </header>

        <ul className="mt-10 grid gap-4 md:grid-cols-2">
          {entries.map((entry) => (
            <li key={entry.slug}>
              <Link
                href={entry.slug}
                className="block rounded-lg border border-border/60 bg-card/50 p-5 transition-colors hover:border-accent/60 hover:bg-card"
              >
                <h2 className="text-lg font-semibold text-foreground">
                  {entry.frontmatter.title}
                </h2>
                <p className="mt-2 text-sm text-muted">
                  {entry.frontmatter.description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </>
  );
}
