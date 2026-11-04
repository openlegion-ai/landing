import type { Metadata } from "next";
import { Fragment } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Footer } from "@/components/footer";
import { JsonLd } from "@/components/json-ld";
import { Link } from "@/i18n/navigation";
import { PageHead, SpecList, CtaBand } from "@/components/site/page-parts";
import { CtaLink } from "@/components/site/cta-link";
import { IconArrow, IconCheck } from "@/components/site/icons";
import { DEMO_URL, WAITLIST_URL } from "@/lib/constants";
import { linkLocaleFor } from "@/lib/markdown";
import { navPageAlternates, OG_LOCALE_MAP, SITE_URL } from "@/lib/seo";
import { ogLocaleFor } from "@/lib/content-page-helpers";

type PageProps = { params: Promise<{ locale: string }> };

/** Where each enforced control surfaces in the partner API (identifiers, not prose). */
const SURFACES = [
  "act_ → receipt",
  "apr_ · approval.decided",
  "handle → broker → your tool",
  "trust: web_low",
  "ws_ · row-level security",
  "workspace.cap_reached",
  "POST /workspaces/{id}/suspend",
];

/** One action through the harness, as the API records it. */
const FLOW: Array<[string, string, string]> = [
  ["intent", "schedule_send", "egress"],
  ["policy", "requires_approval", "third_party"],
  ["approval.decided", "usr_412", "approved"],
  ["receipt", "act_5Hq2Lm8w", "3 credits"],
];

const READING: Array<[string, string]> = [
  ["/learn/ai-agent-security", "security"],
  ["/learn/ai-agent-prompt-injection", "injection"],
  ["/learn/credential-management-ai-agents", "credentials"],
  ["/learn/ai-agent-sandboxing", "sandboxing"],
  ["/learn/ai-agent-multi-tenancy", "multiTenancy"],
  ["/learn/human-in-the-loop-ai-agents", "approvals"],
  ["/learn/ai-agent-guardrails", "guardrails"],
  ["/learn/ai-agent-audit-log", "audit"],
];

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "platformMeta" });
  return {
    title: t("securityTitle"),
    description: t("securityDescription"),
    alternates: navPageAlternates(locale, "/security"),
    openGraph: {
      title: t("securityTitle"),
      description: t("securityDescription"),
      type: "website",
      siteName: "OpenLegion",
      url: `${SITE_URL}/${locale}/security`,
      locale: OG_LOCALE_MAP[locale] || "en_US",
      images: [{ url: `/og/${ogLocaleFor(locale)}/security.png`, width: 1200, height: 630, alt: t("securityTitle") }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@openlegion",
      images: [`/og/${ogLocaleFor(locale)}/security.png`],
      title: t("securityTitle"),
      description: t("securityDescription"),
    },
    robots: { index: true, follow: true },
  };
}

/** Split a translated string on `{email}` and interleave the mailto link. */
function withEmail(template: string, link: React.ReactNode): React.ReactNode {
  const parts = template.split("{email}");
  return parts.map((part, i) => (
    <Fragment key={i}>
      {part}
      {i < parts.length - 1 ? link : null}
    </Fragment>
  ));
}

/**
 * /security — the claims page, for partners and their security reviewers.
 * The first list is enforced by the shipped harness; the second is the v1
 * partner API contract (private beta), labelled as such. The closing section
 * lists what we deliberately do not claim.
 */
export default async function SecurityPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("trustPage");
  const tc = await getTranslations("contentPage");
  const r = await getTranslations("home.reading");
  const email = t("email");
  const now = Array.from({ length: 7 }, (_, i) => ({ title: t(`now.${i}.title`), body: t(`now.${i}.body`) }));
  const api = Array.from({ length: 5 }, (_, i) => ({ title: t(`api.${i}.title`), body: t(`api.${i}.body`) }));

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: tc("breadcrumbHome"), item: `${SITE_URL}/${locale}` },
      { "@type": "ListItem", position: 2, name: t("title"), item: `${SITE_URL}/${locale}/security` },
    ],
  };

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd]} />
      <main id="main">
        <PageHead
          crumbLabel={tc("breadcrumbAriaLabel")}
          crumbs={[{ href: "/", label: tc("breadcrumbHome") }, { label: t("title") }]}
          title={t("title")}
          lede={t("lede")}
          meta={t("updated")}
          aside={
            <figure className="panel overflow-hidden" aria-hidden="true">
              <figcaption className="panel-head">
                <span className="font-semibold text-[var(--fg)]">{t("flowTitle")}</span>
                <span className="t-mono text-[0.75rem] text-[var(--fg-3)]" dir="ltr">ws_8f2KqL3xT9</span>
              </figcaption>
              <ol className="px-5 py-3 sm:px-6" dir="ltr">
                {FLOW.map(([k, id, v], i) => (
                  <li key={k} className="relative grid grid-cols-[1.75rem_1fr_auto] items-center gap-x-4 py-3">
                    {i < FLOW.length - 1 && (
                      <span className="absolute start-[0.84rem] top-[calc(50%+14px)] h-[calc(100%-28px)] w-px bg-[var(--line-2)]" />
                    )}
                    <span className={`flex size-7 items-center justify-center rounded-full border ${i === FLOW.length - 1 ? "border-[color-mix(in_srgb,var(--ok)_40%,transparent)] bg-[color-mix(in_srgb,var(--ok)_10%,transparent)] text-[var(--ok)]" : "border-[var(--line-2)] bg-[var(--surface-2)] text-[var(--fg-2)]"}`}>
                      {i === FLOW.length - 1 ? <IconCheck className="size-3" /> : <span className="t-mono text-[0.6875rem]">{i + 1}</span>}
                    </span>
                    <span className="min-w-0">
                      <span className="t-mono block text-[0.8125rem] text-[var(--fg)]">{k}</span>
                      <span className="t-mono block truncate text-[0.6875rem] text-[var(--blue-ink)]">{id}</span>
                    </span>
                    <span className={`tag ${i === 1 ? "tag-hold" : i === 2 ? "tag-ok" : ""}`}>{v}</span>
                  </li>
                ))}
              </ol>
            </figure>
          }
        />

        <section className="section hairline !pt-16" aria-labelledby="sec-now">
          <div className="wrap grid gap-10 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:gap-16">
            <h2 id="sec-now" className="t-h2 max-w-[14ch] self-start lg:sticky lg:top-32">{t("nowTitle")}</h2>
            <ul className="panel overflow-hidden">
              {now.map((it, i) => (
                <li key={i} className="grid gap-x-4 gap-y-3 border-b border-[var(--line)] px-5 py-6 last:border-b-0 sm:grid-cols-[1.5rem_1fr] sm:px-6 md:grid-cols-[1.5rem_1fr_13rem]">
                  <span className="step-ok mt-1 hidden sm:grid" aria-hidden="true"><IconCheck className="size-2.5" /></span>
                  <div className="min-w-0">
                    <h3 className="t-h3">{it.title}</h3>
                    <p className="t-body mt-1.5">{it.body}</p>
                  </div>
                  <p className="self-start sm:col-start-2 md:col-start-auto md:text-end">
                    <code className="chip max-w-full overflow-hidden text-ellipsis" dir="ltr">{SURFACES[i]}</code>
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section section-alt" aria-labelledby="sec-api">
          <div className="wrap grid gap-10 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:gap-16">
            <h2 id="sec-api" className="t-h2 max-w-[14ch] self-start lg:sticky lg:top-32">{t("apiTitle")}</h2>
            <SpecList items={api} />
          </div>
        </section>

        <section className="section" aria-labelledby="sec-customers">
          <div className="wrap grid gap-10 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:gap-16">
            <h2 id="sec-customers" className="t-h2 max-w-[14ch]">{t("customersTitle")}</h2>
            <p className="t-lede max-w-[42rem] !text-[var(--fg)]">{t("customers")}</p>
          </div>
        </section>

        <section className="section hairline" aria-labelledby="sec-not">
          <div className="wrap grid gap-10 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:gap-16">
            <h2 id="sec-not" className="t-h2 max-w-[14ch]">{t("notClaimedTitle")}</h2>
            <div>
              <div className="panel p-6 sm:p-8">
                <p className="t-body !text-[1.0625rem] !text-[var(--fg)]">{t("notClaimed")}</p>
              </div>
              <h3 className="t-h3 mt-12">{t("contactTitle")}</h3>
              <p className="t-body mt-2">
                {withEmail(
                  t("contact", { email: "{email}" }),
                  <a href={`mailto:${email}`} className="link">
                    {email}
                  </a>,
                )}
              </p>
            </div>
          </div>
        </section>

        <section className="hairline py-16 md:py-20" aria-labelledby="sec-reading">
          <div className="wrap grid gap-8 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:gap-16">
            <h2 id="sec-reading" className="t-h3 !text-[1.25rem]">{r("title")}</h2>
            <ul className="grid border-t border-[var(--line-2)] sm:grid-cols-2 sm:gap-x-8">
              {READING.map(([href, key]) => (
                <li key={href} className="border-b border-[var(--line)]">
                  <Link
                    href={href}
                    locale={linkLocaleFor(href, locale)}
                    className="group flex min-h-12 items-center justify-between gap-4 py-2.5 text-[0.9375rem] text-[var(--fg-2)] transition-colors hover:text-[var(--fg)]"
                  >
                    {r(key)}
                    <IconArrow className="size-4 shrink-0 text-[var(--fg-3)] transition-transform duration-300 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 group-hover:text-[var(--blue-2)] rtl:-scale-x-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <CtaBand id="sec-cta" title={t("ctaTitle")} body={t("ctaBody")}>
          <CtaLink href={WAITLIST_URL} location="security_access" className="btn">
            {t("cta")} <IconArrow />
          </CtaLink>
          <CtaLink href={DEMO_URL} location="security_call" className="btn btn-secondary">
            {t("ctaCall")}
          </CtaLink>
        </CtaBand>
      </main>
      <Footer />
    </>
  );
}
