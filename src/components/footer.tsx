import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { DEMO_URL, DISCORD_URL, DOCS_URL, FOOTER_COLUMNS, GITHUB_URL, TWITTER_URL } from "@/lib/constants";
import { linkLocaleFor } from "@/lib/markdown";
import { PreferredSourceButton } from "@/components/preferred-source-button";
import { CookieSettingsButton } from "@/components/consent-manager";
import { LanguageSwitcher } from "@/components/language-switcher";

type Col = { title: string; links: Array<{ href: string; label: string; external?: boolean }> };

export function Footer() {
  const t = useTranslations("footer");
  const s = useTranslations("site.footer");
  const tc = useTranslations("consent");
  const locale = useLocale();

  // Learn, Comparisons and Legal keep their translated labels: they are the
  // site's internal links to its ranking pages.
  const legacy = (idx: 1 | 2 | 5): Col => ({
    title: t(`columns.${idx}.title`),
    links: FOOTER_COLUMNS[idx].links.map((l, i) => ({
      href: l.href,
      label: t(`columns.${idx}.links.${i}`),
      external: l.href.startsWith("http"),
    })),
  });

  const columns: Col[] = [
    {
      title: s("product"),
      links: [
        { href: "/#platform", label: s("productLinks.platform") },
        { href: "/#quickstart", label: s("productLinks.quickstart") },
        { href: "/#controls", label: s("productLinks.controls") },
        { href: "/pricing", label: s("productLinks.pricing") },
        { href: "/security", label: s("productLinks.security") },
        { href: "/faq", label: s("productLinks.faq") },
      ],
    },
    legacy(1),
    legacy(2),
    {
      title: s("developers"),
      links: [
        { href: GITHUB_URL, label: s("developerLinks.v1"), external: true },
        { href: DOCS_URL, label: s("developerLinks.v1docs"), external: true },
        { href: DISCORD_URL, label: s("developerLinks.discord"), external: true },
        { href: TWITTER_URL, label: s("developerLinks.x"), external: true },
        { href: DEMO_URL, label: s("contactLinks.call"), external: true },
      ],
    },
    legacy(5),
  ];

  const linkCls = "inline-block py-1 text-[0.875rem] text-[var(--fg-2)] transition-colors hover:text-[var(--fg)]";

  return (
    <footer className="border-t border-[var(--line)] bg-[var(--bg-2)]">
      <div className="wrap pb-10 pt-16 md:pt-20">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_2fr] lg:gap-16">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center gap-2.5" aria-label="OpenLegion">
              <Image src="/logo.png" alt="" width={28} height={28} sizes="28px" className="rounded-full" />
              <span className="text-[1.0625rem] font-semibold tracking-[-0.02em] text-[var(--fg)]">OpenLegion</span>
            </Link>
            <p className="t-small mt-5">{s("brandDescription")}</p>
            <p className="t-fine mt-5">{s("aiDisclosure")}</p>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 xl:grid-cols-5">
            {columns.map((col) => (
              <div key={col.title}>
                <p className="text-[0.8125rem] font-semibold text-[var(--fg)]">{col.title}</p>
                <ul className="mt-3 grid gap-0.5">
                  {col.links.map((l) => (
                    <li key={l.href + l.label}>
                      {l.external ? (
                        <a href={l.href} target="_blank" rel="noopener noreferrer" className={linkCls}>
                          {l.label}
                        </a>
                      ) : (
                        <Link href={l.href} locale={linkLocaleFor(l.href, locale)} className={linkCls}>
                          {l.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-[var(--line)] pt-6 text-[0.75rem] text-[var(--fg-3)] md:flex-row md:items-center md:justify-between">
          <p>{s("license", { year: new Date().getFullYear() })}</p>
          <div className="flex flex-wrap items-center gap-5">
            <LanguageSwitcher />
            <CookieSettingsButton label={tc("settings")} />
            <PreferredSourceButton />
          </div>
        </div>
      </div>
    </footer>
  );
}
