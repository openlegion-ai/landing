import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Footer } from "@/components/footer";
import { DEFAULT_LOCALE } from "@/lib/constants";
import { SITE_URL } from "@/lib/seo";

const TITLE = "OpenLegionAgent: our browsing agent";
const DESCRIPTION =
  "How OpenLegion's browsing agent identifies itself, what it does and never does, and how to opt out or reach us.";
const UA_TOKEN = "OpenLegionAgent/1 (+https://openlegion.ai/bot)";
const EMAIL = "bot@openlegion.ai";

/**
 * /bot — the operator page the agent's User-Agent links to.
 *
 * English only, by design: it is read by site operators following the UA link, and
 * SourceHut's and Wikipedia's terms require it to name a contact. Other locales render
 * the same English copy, noindex, canonicalised to /en/bot (the content-page fallback
 * convention). It is not in the sitemap.
 *
 * Every sentence must stay true of the agent as it runs today
 * (platform `docs/plans/briefs/S-COMPUTER-1.md`): no claim of request signing until
 * the key directory is published.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const canonical = `${SITE_URL}/${DEFAULT_LOCALE}/bot`;
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical, languages: { en: canonical, "x-default": canonical } },
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      type: "website",
      siteName: "OpenLegion",
      url: canonical,
      locale: "en_US",
    },
    robots: locale === DEFAULT_LOCALE ? { index: true, follow: true } : { index: false, follow: true },
  };
}

export default async function BotPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const mailLink = (
    <a href={`mailto:${EMAIL}`} className="text-accent underline underline-offset-2 hover:text-accent/80">
      {EMAIL}
    </a>
  );

  return (
    <>
      <main id="main" lang="en" className="mx-auto max-w-3xl px-6 pb-24 pt-8 md:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">{TITLE}</h1>
        <p className="mt-2 text-sm text-muted">Last updated: November 2026</p>

        <div className="prose-legal mt-10 space-y-8 text-sm leading-relaxed text-muted">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">What it is</h2>
            <p>
              OpenLegion runs AI agents for businesses. Some of those agents use a real web browser (Chromium) on
              behalf of a person, signed in to an account that person holds.
            </p>
            <p className="mt-2">Every request it sends ends Chromium&apos;s own User-Agent string with this token:</p>
            <pre className="mt-3 overflow-x-auto rounded-md border border-border/50 bg-card px-4 py-3 font-mono text-xs text-foreground">
              {UA_TOKEN}
            </pre>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">What it does today</h2>
            <p>
              The agent is in a limited research test. It visits a small set of sites, only with test accounts we
              created and hold ourselves, and it only reads pages: a few signed-in page loads per site over 30 days. It
              does not post, send messages or change anything on those sites.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">What it never does</h2>
            <ul className="ml-5 mt-2 list-disc space-y-1">
              <li>It does not disguise itself as a person&apos;s browser or drop the token above.</li>
              <li>
                It does not solve CAPTCHAs or bot challenges. If a site shows one, the agent stops, and a person can
                take over the session.
              </li>
              <li>It does not route through residential or rotating proxy networks to get around blocks.</li>
              <li>It signs in only with accounts its own user holds.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">Signed requests</h2>
            <p>
              We are adopting Web Bot Auth, the IETF draft for cryptographically signed bot requests. Requests are not
              signed yet. When they are, this page will link our key directory so you can verify them.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">Opting out and contact</h2>
            <p>
              To block the agent, block requests whose User-Agent contains <code className="font-mono">OpenLegionAgent</code>.
            </p>
            <p className="mt-2">
              To ask us to stop visiting your site, or about anything else to do with the agent, email {mailLink}. We
              will stop visiting your site.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
