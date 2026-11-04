import type { ReactNode } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AgentField } from "@/components/site/agent-field";
import { CtaLink } from "@/components/site/cta-link";
import { highlight } from "@/components/site/highlight";
import { IconArrow, IconCheck } from "@/components/site/icons";
import { FaqList } from "@/components/site/page-parts";
import { RunBothSides } from "@/components/home/run-both-sides";
import { WorkspaceBoard } from "@/components/home/workspace-board";
import { DEMO_URL, WAITLIST_URL } from "@/lib/constants";
import { linkLocaleFor } from "@/lib/markdown";
import "./home.css";

/** Section heading: title left, lede right on wide screens. */
function SplitHead({ id, title, lede }: { id: string; title: ReactNode; lede: ReactNode }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2 lg:items-end lg:gap-16">
      <h2 id={id} className="t-h2 max-w-[17ch]">{title}</h2>
      <p className="t-lede max-w-[36rem]">{lede}</p>
    </div>
  );
}

/** A tool's effect, coloured the same way everywhere it appears. */
const effectClass = (effect: string) => (["read", "draft", "write", "egress"].includes(effect) ? `chip-${effect}` : "text-[var(--fg-3)]");

/** "Label: the rest" → the label carries the weight. Handles the full-width colon too. */
function Lead({ text }: { text: string }) {
  const m = text.match(/^([^:：]{2,48})([:：])\s*([\s\S]*)$/);
  if (!m) return <>{text}</>;
  return (
    <>
      <b className="font-semibold text-[var(--fg)]">{m[1]}</b>
      {m[2] === ":" ? ": " : m[2]}
      {m[3]}
    </>
  );
}

function ArrowLink({ href, children, localized = false }: { href: string; children: ReactNode; localized?: boolean }) {
  const locale = useLocale();
  return (
    <Link href={href} locale={localized ? linkLocaleFor(href, locale) : undefined} className="link-arrow">
      {children} <IconArrow className="arrow size-4 rtl:-scale-x-100" />
    </Link>
  );
}

/* ── Hero: one run, both sides ────────────────────────────────────────── */

export function Hero() {
  const t = useTranslations("home.hero");
  const d = useTranslations("home.demo");
  return (
    <section id="hero" className="stage stage-top duo-hero" aria-labelledby="hero-title">
      <AgentField />
      <div className="wrap">
        <div className="duo-head" data-field-copy>
          <h1 id="hero-title" className="t-hero duo-h1">{t("title")}</h1>
          <div className="duo-aside">
            <p className="t-lede">{t("lede")}</p>
            <div className="ctas">
              <CtaLink href={WAITLIST_URL} location="hero_primary" className="btn">
                {t("primary")} <IconArrow />
              </CtaLink>
              <CtaLink href={DEMO_URL} location="hero_call" className="btn btn-secondary">
                {t("secondary")}
              </CtaLink>
            </div>
            <p className="duo-next">{t("next")}</p>
          </div>
        </div>
        <RunBothSides />
        <p className="t-fine hero-illus" data-field-clear>{d("captionA")}</p>
      </div>
    </section>
  );
}

/* ── Statement: who owns what ──────────────────────────────────────────── */

function PartyNode({ party }: { party: "you" | "ol" | "cust" }) {
  const d = useTranslations("home.demo");
  if (party === "you") {
    return (
      <span className="node-chip t-mono !gap-0 !font-medium" dir="ltr">
        <span className="text-[var(--blue-ink)]">defineAgent</span>
        <span className="text-[var(--fg-3)]">()</span>
      </span>
    );
  }
  if (party === "ol") {
    return (
      <span className="node-chip node-chip-ol">
        <Image src="/logo.png" alt="" width={20} height={20} sizes="20px" className="rounded-full" />
        OpenLegion
      </span>
    );
  }
  return (
    <span className="node-chip">
      <span className="app-mark !size-5 !rounded-[6px]" />
      {d("app")}
    </span>
  );
}

export function Statement() {
  const t = useTranslations("home.parties");
  const parties = ["you", "ol", "cust"] as const;
  return (
    <section id="platform" className="section section-alt overflow-hidden" aria-labelledby="parties-title">
      <div className="wrap">
        <h2 id="parties-title" className="t-statement max-w-[20ch]">{t("title")}</h2>
        <p className="t-lede mt-8 max-w-[38rem]">{t("lede")}</p>
        <ol className="rail mt-16 md:mt-24">
          {parties.map((p) => (
            <li key={p} className="min-w-0">
              <div className="rail-node" aria-hidden="true">
                <PartyNode party={p} />
              </div>
              <h3 className="t-h3 mt-7 !text-[1.25rem]">{t(`${p}.title`)}</h3>
              <p className="t-body mt-3">{t(`${p}.body`)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ── How it plugs in: three steps, and the code for each ───────────────── */

const TOOL_TS = `// Your function, now one of the agent's tools.
export const scheduleSend = defineTool({
  description: "Schedule a campaign to send",
  input: z.object({ campaignId: z.string(), at: z.string() }),
  effect: "egress", // reaches a third party, so it waits for approval
  run: async ({ campaignId, at }, ctx) =>
    campaigns.schedule(ctx.externalRef, campaignId, at),
});`;

const CALL_HTTP = `POST /workspaces
{ "external_ref": "cust_bluebird-bakery" }`;

const EVENTS: Array<[string, string]> = [
  ["action.requires_approval", "schedule_send · egress"],
  ["approval.decided", "approved · usr_412"],
];

export function Plug() {
  const t = useTranslations("home.plug");
  const q = useTranslations("home.quickstart");
  return (
    <section id="quickstart" className="section" aria-labelledby="plug-title">
      <div className="wrap">
        <SplitHead id="plug-title" title={t("title")} lede={t("lede")} />
        <div className="plug mt-14 md:mt-16">
          <ol className="plug-steps">
            {[0, 1, 2].map((i) => (
              <li key={i}>
                <span className="plug-n t-num" aria-hidden="true">{i + 1}</span>
                <div>
                  <h3 className="t-h3">{t(`steps.${i}.title`)}</h3>
                  <p className="t-small mt-2">{t(`steps.${i}.body`)}</p>
                </div>
              </li>
            ))}
          </ol>
          <figure className="plug-code code-panel" aria-label={q("codeLabel")}>
            <div className="plug-block">
              <p className="plug-label">
                <span>{t("toolLabel")}</span>
                <span className="plug-file" dir="ltr">tools.ts</span>
              </p>
              <pre dir="ltr"><code>{highlight(TOOL_TS)}</code></pre>
            </div>
            <div className="plug-block">
              <p className="plug-label"><span>{t("callLabel")}</span></p>
              <pre dir="ltr"><code>{highlight(CALL_HTTP)}</code></pre>
            </div>
            <div className="plug-block">
              <p className="plug-label"><span>{t("receiveLabel")}</span></p>
              <ul className="plug-events" dir="ltr">
                {EVENTS.map(([ev, detail]) => (
                  <li key={ev}>
                    <span className="text-[var(--blue-ink)]">{ev}</span>
                    <span className="text-[var(--fg-3)]">{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
            <figcaption className="plug-note">{q("previewNote")}</figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

/* ── The walls: three scenes, one sentence each ────────────────────────── */

function Held({ tool, effect }: { tool: string; effect: string }) {
  const t = useTranslations("home.demo");
  return (
    <p className="wall-held">
      <span className="t-mono" dir="ltr">
        {tool} <span className={effectClass(effect)}>{effect}</span>
      </span>
      <span className="tag tag-hold"><span className="dot" />{t("held")}</span>
    </p>
  );
}

export function Walls() {
  const t = useTranslations("home.walls");
  const v = useTranslations("home.features.vis.walls");
  const f = useTranslations("home.features");
  const d = useTranslations("home.demo");
  return (
    <section id="controls" className="section section-alt" aria-labelledby="walls-title">
      <div className="wrap">
        <SplitHead id="walls-title" title={t("title")} lede={t("lede")} />
        <ol className="walls mt-14 md:mt-16">
          <li className="wall">
            <h3 className="t-h3">{v("thirdParty")}</h3>
            <div className="wall-scene">
              <p className="wall-ask"><span>{d("ask")}</span></p>
              <Held tool="schedule_send" effect="egress" />
            </div>
            <p className="t-small">{t("scenes.0.line")}</p>
          </li>
          <li className="wall">
            <h3 className="t-h3">{v("untrusted")}</h3>
            <div className="wall-scene">
              <div className="wall-mail">
                <p className="wall-mail-from">{t("scenes.1.from")}</p>
                <p className="wall-mail-body">“{t("scenes.1.ask")}”</p>
                <p className="wall-mail-tag" dir="ltr">trust: web_low</p>
              </div>
              <Held tool="issue_refund" effect="write" />
            </div>
            <p className="t-small">{t("scenes.1.line")}</p>
          </li>
          <li className="wall">
            <h3 className="t-h3">{v("delete")}</h3>
            <div className="wall-scene">
              <p className="wall-ask"><span>{t("scenes.2.ask")}</span></p>
              <Held tool="delete_products ×40" effect="write" />
            </div>
            <p className="t-small">{t("scenes.2.line")}</p>
          </li>
        </ol>
        <div className="wall-rest">
          <h3 className="t-h3 !text-[1rem]">{v("rest")}</h3>
          <p className="wall-rest-tools t-mono" dir="ltr">
            <span>get_audience <span className="chip-read">read</span></span>
            <span>draft_campaign <span className="chip-draft">draft</span></span>
          </p>
          <span className="tag tag-ok"><span className="dot" />{t("runs")}</span>
          <p className="t-small wall-rest-line">{t("restLine")}</p>
        </div>
        <div className="mt-10 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3 border-t border-[var(--line)] pt-6">
          <p className="t-body max-w-[44rem] !text-[var(--fg)]">{t("rule")}</p>
          <ArrowLink href="/security">{f("securityLink")}</ArrowLink>
        </div>
      </div>
    </section>
  );
}

/* ── Every customer, one board ─────────────────────────────────────────── */

const STATES: Array<[string, string]> = [
  ["working", "tag-blue"],
  ["held", "tag-hold"],
  ["capped", "tag-danger"],
  ["idle", ""],
  ["done", "tag-ok"],
];

export function Board() {
  const t = useTranslations("home.board");
  return (
    <section id="workspaces" className="section" aria-labelledby="board-title">
      <div className="wrap board-grid">
        <div className="board-copy">
          <h2 id="board-title" className="t-h2 max-w-[12ch]">{t("title")}</h2>
          <p className="t-lede mt-6 max-w-[30rem]">{t("lede")}</p>
          <ul className="board-states mt-9">
            {STATES.map(([k, cls]) => (
              <li key={k}>
                <span className={`board-state-dot ${cls}`} aria-hidden="true" />
                <span className="t-small"><Lead text={t(`states.${k}`)} /></span>
              </li>
            ))}
          </ul>
          <p className="t-small mt-7 border-t border-[var(--line)] pt-5">{t("suspend")}</p>
        </div>
        <div className="board-stage">
          <WorkspaceBoard />
          <p className="t-fine mt-4">{t("caption")}</p>
        </div>
      </div>
    </section>
  );
}

/* ── Money: the pool and the caps ─────────────────────────────────────── */

export function Money() {
  const t = useTranslations("home.money");
  const locale = useLocale();
  const nf = new Intl.NumberFormat(`${locale}-u-nu-latn`);
  const ws: Array<{ id: string; ref: string; cap: number; used: number; state?: "capped" | "archived"; grant?: number }> = [
    { id: "ws_8f2KqL3xT9", ref: "cust_bluebird-bakery", cap: 10000, used: 6678 },
    { id: "ws_1Zd9Hw4pQe", ref: "cust_northwind", cap: 2500, used: 2500, state: "capped" },
    { id: "ws_6Hn2Vb8sLm", ref: "cust_lumen-labs", cap: 25000, used: 3186, grant: 5000 },
    { id: "ws_4Tp7Rc1xKa", ref: "cust_old-co", cap: 5000, used: 0, state: "archived" },
  ];
  return (
    <section id="money" className="section section-alt" aria-labelledby="money-title">
      <div className="wrap grid items-center gap-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20">
        <div>
          <h2 id="money-title" className="t-h2 max-w-[12ch]">{t("title")}</h2>
          <p className="t-lede mt-6 max-w-[32rem]">{t("lede")}</p>
          <ul className="mt-8 grid gap-3.5">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="t-small flex gap-3">
                <span className="step-ok mt-0.5"><IconCheck className="size-2.5" /></span>
                <span>{t(`rows.${i}`)}</span>
              </li>
            ))}
          </ul>
          <p className="t-fine mt-6">{t("prices")}</p>
          <p className="mt-6">
            <ArrowLink href="/pricing">{t("link")}</ArrowLink>
          </p>
        </div>
        <figure className="panel overflow-hidden !shadow-[var(--shadow-3)]">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--line)] px-5 py-6 sm:px-7">
            <div>
              <p className="text-[0.875rem] text-[var(--fg-2)]">
                {t("pool")} · {t("prepaid")}
              </p>
              <p className="t-num mt-2 text-[2.5rem] font-medium leading-none tracking-[-0.035em] text-[var(--fg)]">
                {nf.format(250000)} <span className="text-[1rem] font-medium tracking-normal text-[var(--fg-3)]">{t("unit")}</span>
              </p>
            </div>
            <span className="tag tag-ok"><span className="dot" />{t("healthy")}</span>
          </div>
          <ul>
            {ws.map((w) => (
              <li key={w.id} className="border-b border-[var(--line)] px-5 py-5 last:border-b-0 sm:px-7">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
                  <span className="t-mono !text-[0.8125rem]" dir="ltr">
                    <span className="text-[var(--blue-ink)]">{w.id}</span> <span className="text-[var(--fg-3)]">{w.ref}</span>
                  </span>
                  <span className="t-num text-[0.875rem] text-[var(--fg-2)]" dir="ltr">
                    {w.state === "archived" ? (
                      <span className="tag">{t("archived")}</span>
                    ) : w.state === "capped" ? (
                      <span className="tag tag-danger">{t("capped")}</span>
                    ) : (
                      <>
                        <b className="font-semibold text-[var(--fg)]">{nf.format(w.used)}</b> / {nf.format(w.cap)}
                      </>
                    )}
                  </span>
                </div>
                {w.state !== "archived" && (
                  <div className={`meter mt-3 ${w.state === "capped" ? "meter-full" : ""}`} aria-hidden="true">
                    <span style={{ ["--v" as string]: Math.min(1, w.used / w.cap) }} />
                  </div>
                )}
                {w.grant && (
                  <p className="t-small mt-3">
                    <span className="t-mono font-medium text-[var(--ok)]" dir="ltr">+{nf.format(w.grant)}</span> {t("grant")}: {t("grantNote")}
                  </p>
                )}
                {w.state === "archived" && <p className="t-small mt-1.5">{t("archivedNote")}</p>}
              </li>
            ))}
          </ul>
          <figcaption className="t-fine border-t border-[var(--line)] bg-[var(--bg-2)] px-5 py-3 sm:px-7">{t("illustrative")}</figcaption>
        </figure>
      </div>
    </section>
  );
}

/* ── Build it yourself vs OpenLegion ───────────────────────────────────── */

export function Build() {
  const t = useTranslations("home.build");
  const rows = Array.from({ length: 9 }, (_, i) => i);
  return (
    <section id="build-vs-buy" className="section" aria-labelledby="build-title">
      <div className="wrap">
        <SplitHead id="build-title" title={t("title")} lede={t("lede")} />
        <div className="table-wrap mt-12 md:mt-14">
          <table className="cmp">
            <thead>
              <tr>
                <th scope="col">{t("colPart")}</th>
                <th scope="col">{t("colYou")}</th>
                <th scope="col" className="cmp-us">{t("colUs")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((i) => (
                <tr key={i}>
                  <th scope="row">{t(`rows.${i}.part`)}</th>
                  <td data-label={t("colYou")}>{t(`rows.${i}.you`)}</td>
                  <td data-label={t("colUs")} className="cmp-us">
                    <span className="step-ok"><IconCheck className="size-2.5" /></span>
                    <span>{t(`rows.${i}.us`)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="grid gap-2">
            <p className="t-small">{t("note")}</p>
            <p className="t-small !text-[var(--fg)]">{t("concede")}</p>
          </div>
          <ArrowLink href="/learn/build-vs-buy-ai-agents" localized>{t("link")}</ArrowLink>
        </div>
      </div>
    </section>
  );
}

/* ── Agents you can put in your product ────────────────────────────────── */

export function Verticals() {
  const t = useTranslations("home.verticals");
  const u = useTranslations("home.useCases");
  const items = Array.from({ length: 12 }, (_, i) => i);
  return (
    <section id="use-cases" className="section section-alt" aria-labelledby="verticals-title">
      <div className="wrap">
        <SplitHead id="verticals-title" title={t("title")} lede={t("lede")} />
        <ul className="verts mt-12 md:mt-14">
          {items.map((i) => (
            <li key={i}>
              <Lead text={t(`items.${i}`)} />
            </li>
          ))}
        </ul>
        <div className="verts-foot">
          <p className="verts-partner">
            <Image src="/logo.png" alt="" width={18} height={18} sizes="18px" className="rounded-full" />
            <span>{u("partner1")}</span>
          </p>
          <p className="t-small">{t("regulated")}</p>
          <p className="t-fine">{t("caption")}</p>
        </div>
      </div>
    </section>
  );
}

/* ── FAQ ──────────────────────────────────────────────────────────────── */

export const HOME_FAQ_COUNT = 14;
/** Display (and FAQPage JSON-LD) order. `production` is an object key, not an
 *  array index, so untranslated locales fall back to English for it alone. */
export const HOME_FAQ_KEYS = [
  "items.0",
  "items.1",
  "production",
  ...Array.from({ length: HOME_FAQ_COUNT - 2 }, (_, i) => `items.${i + 2}`),
];

export function HomeFaq() {
  const t = useTranslations("home.faq");
  const tf = useTranslations("homeFaq");
  const items = HOME_FAQ_KEYS.map((k) => ({ q: tf(`${k}.q`), a: tf(`${k}.a`) }));
  return (
    <section id="faq" className="section" aria-labelledby="faq-title">
      <div className="wrap grid gap-12 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:gap-20">
        <div className="self-start lg:sticky lg:top-32">
          <h2 id="faq-title" className="t-h2 max-w-[11ch]">{t("title")}</h2>
          <p className="mt-6">
            <ArrowLink href="/faq">{t("more")}</ArrowLink>
          </p>
        </div>
        <FaqList items={items} name="home-faq" />
      </div>
    </section>
  );
}

/* ── Definition + reading (GEO block) ─────────────────────────────────── */

const READING: Array<[string, string]> = [
  ["/learn/add-ai-agents-to-your-app", "addAgents"],
  ["/learn/agent-harness", "harness"],
  ["/learn/build-vs-buy-ai-agents", "buildVsBuy"],
  ["/learn/managed-agents", "managedAgents"],
  ["/learn/ai-agent-platform", "platform"],
  ["/learn/ai-agent-multi-tenancy", "multiTenancy"],
  ["/learn/human-in-the-loop-ai-agents", "approvals"],
  ["/learn/ai-agent-security", "security"],
  ["/learn/credential-management-ai-agents", "credentials"],
  ["/learn/ai-agent-cost", "cost"],
  ["/learn/ai-agent-audit-log", "audit"],
  ["/comparison", "comparisons"],
];

export function Definition() {
  const t = useTranslations("home.definition");
  const r = useTranslations("home.reading");
  const locale = useLocale();
  return (
    <section className="hairline py-20 md:py-24" aria-labelledby="definition-title">
      <div className="wrap grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        <div className="definition-block self-start">
          <h2 id="definition-title" className="t-h3">{t("term")}</h2>
          <p className="t-body mt-4 !text-[1.0625rem] !leading-[1.7] !text-[var(--fg)]">{t("body")}</p>
        </div>
        <nav aria-labelledby="reading-title">
          <h2 id="reading-title" className="t-h3">{r("title")}</h2>
          <ul className="mt-4 grid border-t border-[var(--line-2)] sm:grid-cols-2 sm:gap-x-8">
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
        </nav>
      </div>
    </section>
  );
}

/* ── Close ────────────────────────────────────────────────────────────── */

export function Close() {
  const t = useTranslations("home.close");
  return (
    <section className="hairline stage stage-close" aria-labelledby="close-title">
      <AgentField quiet />
      <div className="wrap pb-44 pt-28 text-center md:pb-56 md:pt-36">
        <div data-field-copy>
          <h2 id="close-title" className="t-h1 mx-auto max-w-[16ch]">{t("title")}</h2>
          <p className="t-lede mx-auto mt-6 max-w-[34rem]">{t("line")}</p>
          <div className="ctas mt-10 justify-center">
            <CtaLink href={WAITLIST_URL} location="close_primary" className="btn">
              {t("primary")} <IconArrow />
            </CtaLink>
            <CtaLink href={DEMO_URL} location="close_call" className="btn btn-secondary">
              {t("secondary")}
            </CtaLink>
          </div>
        </div>
      </div>
    </section>
  );
}
