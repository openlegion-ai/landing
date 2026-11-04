import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { IconPlus } from "@/components/site/icons";
import { AgentField } from "@/components/site/agent-field";

/** Header for inner pages: breadcrumb, H1, lede, optional meta, actions and an aside. */
export function PageHead({
  crumbs,
  title,
  lede,
  actions,
  aside,
  meta,
  crumbLabel = "Breadcrumb",
}: {
  crumbLabel?: string;
  crumbs: Array<{ href?: string; label: string }>;
  title: ReactNode;
  lede: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <header className="stage stage-top stage-quiet">
      <AgentField quiet />
      <div className={`wrap grid gap-12 pb-16 pt-10 md:pt-16 lg:pb-24 ${aside ? "lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-16" : ""}`}>
        <div className="min-w-0" data-field-copy>
          <nav aria-label={crumbLabel} className="breadcrumb">
            {crumbs.map((c, i) => (
              <span key={i} className="contents">
                {i > 0 && <span aria-hidden="true">/</span>}
                {c.href ? <Link href={c.href}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
              </span>
            ))}
          </nav>
          <h1 className="t-h1 mt-8 max-w-[18ch]">{title}</h1>
          <p className="t-lede mt-6 max-w-[38rem]">{lede}</p>
          {meta && <p className="t-fine mt-4">{meta}</p>}
          {actions && <div className="mt-9 flex flex-wrap gap-3">{actions}</div>}
        </div>
        {aside && <div className="min-w-0" data-field-anchor>{aside}</div>}
      </div>
    </header>
  );
}

/**
 * A specification list: title, body, and an optional mono proof line, in one or two columns.
 * `level` keeps the outline valid: h2 where the list sits straight under the page h1.
 */
export function SpecList({
  items,
  columns = 1,
  level = 3,
}: {
  items: Array<{ title: string; body: ReactNode; proof?: string }>;
  columns?: 1 | 2;
  level?: 2 | 3;
}) {
  const H = level === 2 ? "h2" : "h3";
  return (
    <ul className={`grid border-t border-[var(--line-2)] ${columns === 2 ? "md:grid-cols-2 md:gap-x-12" : ""}`}>
      {items.map((it, i) => (
        <li key={i} className="border-b border-[var(--line)] py-7">
          <H className="t-h3">{it.title}</H>
          <p className="t-body mt-2 max-w-[40rem]">{it.body}</p>
          {it.proof && (
            <p className="mt-4">
              <code className="chip" dir="ltr">{it.proof}</code>
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Native-details FAQ list. */
export function FaqList({ items, name }: { items: Array<{ q: string; a: string }>; name: string }) {
  return (
    <div className="border-t border-[var(--line-2)]">
      {items.map((it, i) => (
        <details key={i} className="faq-details border-b border-[var(--line)]" name={name}>
          <summary className="flex items-start justify-between gap-6 py-5">
            <span className="faq-q t-h3 !text-[1.0625rem] transition-colors">{it.q}</span>
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-[var(--line-2)] text-[var(--fg-2)]">
              <IconPlus className="faq-plus size-3.5" />
            </span>
          </summary>
          <p className="t-body max-w-[42rem] pb-6">{it.a}</p>
        </details>
      ))}
    </div>
  );
}

/** Closing call to action band used at the foot of inner pages. */
export function CtaBand({ id, title, body, children }: { id: string; title: string; body?: string; children: ReactNode }) {
  return (
    <section className="hairline" aria-labelledby={id}>
      <div className="wrap py-16 md:py-20">
        <div className="panel glow overflow-hidden px-6 py-10 sm:px-10 md:flex md:items-center md:justify-between md:gap-10">
          <div className="max-w-[36rem]">
            <h2 id={id} className="t-h2 !text-[clamp(1.75rem,1.3rem+1.4vw,2.5rem)]">{title}</h2>
            {body && <p className="t-lede mt-4">{body}</p>}
          </div>
          <div className="mt-8 flex flex-wrap gap-3 md:mt-0 md:shrink-0">{children}</div>
        </div>
      </div>
    </section>
  );
}
