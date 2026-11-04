import type { ReactNode } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { HeroDemo } from "@/components/site/hero-demo";
import { AgentField } from "@/components/site/agent-field";
import { CodeTabs } from "@/components/site/code-tabs";
import { CtaLink } from "@/components/site/cta-link";
import { IconArrow, IconCheck } from "@/components/site/icons";
import { FaqList } from "@/components/site/page-parts";
import { DEMO_URL, WAITLIST_URL } from "@/lib/constants";
import { linkLocaleFor } from "@/lib/markdown";

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

/** A footnote marker: the hedge lives once, in the notes at the foot of the page. */
function NoteRef({ n }: { n: number }) {
  const t = useTranslations("home.notes");
  return (
    <a href={`#note-${n}`} className="note-ref" aria-label={t("ref", { n })}>
      {n}
    </a>
  );
}

/* ── Hero ──────────────────────────────────────────────────────────────── */

export function Hero() {
  const t = useTranslations("home.hero");
  return (
    <section id="hero" className="stage stage-top" aria-labelledby="hero-title">
      <AgentField />
      <div className="wrap pb-16 pt-12 sm:pt-16 lg:pb-24 lg:pt-24">
        {/* Stacked at every width: the headline gets the full measure, and the product sits under it, on the field. */}
        <div className="hero-stack">
          <div className="hero-copy min-w-0" data-field-copy>
            <h1 id="hero-title" className="t-display hero-title">{t("title")}</h1>
            <p className="t-lede hero-lede mt-6">{t("lede")}</p>
            <div className="hero-ctas mt-9 flex flex-wrap gap-3 max-sm:[&>a]:flex-1 max-sm:[&>a]:px-3">
              <CtaLink href={WAITLIST_URL} location="hero_primary" className="btn">
                {t("primary")} <IconArrow />
              </CtaLink>
              <CtaLink href={DEMO_URL} location="hero_call" className="btn btn-secondary">
                {t("secondary")}
              </CtaLink>
            </div>
          </div>
          <div className="hero-product min-w-0">
            <HeroDemo />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Platform: the system at a glance, then each piece defined ────────── */

/** [stack item, the API name it goes by]. */
const CAPS: Array<[number, string]> = [
  [0, "defineTool"],
  [1, "ws_"],
  [2, "apr_"],
  [3, "periodCredits"],
  [4, "vlt_"],
  [5, "evt_"],
  [6, 'model: "smart"'],
  [7, "trust: web_low"],
  [8, "livemode: false"],
];

/** The system at a glance: your product, the harness, and what it reaches. */
function HarnessMap() {
  const t = useTranslations("home.stack");
  const d = useTranslations("home.demo");
  const mods: Array<[number, string]> = [
    [2, "apr_"],
    [3, "credits"],
    [4, "vlt_"],
    [5, "evt_"],
  ];
  return (
    <div className="hm-stage mt-16 md:mt-20" aria-hidden="true">
      <div className="hm">
        <div className="hm-card">
          <p className="hm-head">
            <span className="app-mark !size-5 !rounded-[6px]" />
            {d("app")}
          </p>
          <ul className="hm-rows" dir="ltr">
            <li><span className="text-[var(--blue-ink)]">&lt;AgentChat /&gt;</span></li>
            <li><span>tools.ts</span><span className="text-[var(--fg-3)]">defineTool</span></li>
          </ul>
        </div>

        <div className="hm-link"><span>{t("items.0.title")}</span></div>

        <div className="hm-card hm-core edge">
          <p className="hm-head">
            <Image src="/logo.png" alt="" width={20} height={20} sizes="20px" className="rounded-full" />
            OpenLegion
          </p>
          <ul className="hm-mods">
            {mods.map(([i, id]) => (
              <li key={i} className="hm-mod">
                <span className="min-w-0 leading-snug">{t(`items.${i}.title`)}</span>
                <code dir="ltr">{id}</code>
              </li>
            ))}
          </ul>
          <div className="hm-band">
            <span>{t("items.1.title")}</span>
            <span className="flex flex-wrap gap-1.5" dir="ltr">
              {["ws_8f2K…", "ws_1Zd9…", "ws_6Hn2…"].map((w) => (
                <code key={w} className="hm-ws">{w}</code>
              ))}
            </span>
          </div>
        </div>

        <div className="hm-link hm-link-end" />

        <div className="hm-side">
          <div className="hm-card hm-leaf">
            <p className="text-[0.875rem] font-semibold text-[var(--fg)]">{t("items.6.title")}</p>
            <p className="t-mono mt-1 !text-[0.75rem] text-[var(--fg-3)]" dir="ltr">model: &quot;smart&quot;</p>
          </div>
          <div className="hm-card hm-leaf">
            <p className="text-[0.875rem] font-semibold text-[var(--fg)]">{t("items.7.title")}</p>
            <p className="t-mono mt-1 !text-[0.75rem] text-[var(--hold)]" dir="ltr">trust: web_low</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Platform() {
  const t = useTranslations("home.stack");
  const r = useTranslations("home.reading");
  const locale = useLocale();
  return (
    <section id="platform" className="section" aria-labelledby="stack-title">
      <div className="wrap">
        <div className="mx-auto max-w-[52rem] text-center">
          <h2 id="stack-title" className="t-h2 mx-auto max-w-[20ch]">{t("title")}</h2>
          <p className="t-lede mx-auto mt-6 max-w-[40rem]">{t("lede")}</p>
          <p className="mt-6">
            <Link href="/learn/agent-harness" locale={linkLocaleFor("/learn/agent-harness", locale)} className="link-arrow">
              {r("harness")} <IconArrow className="arrow size-4 rtl:-scale-x-100" />
            </Link>
          </p>
        </div>
        <HarnessMap />
        <ul className="caps mt-16 md:mt-20">
          {CAPS.map(([i, api]) => (
            <li key={i}>
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="t-h3">{t(`items.${i}.title`)}</h3>
                <code className="caps-api" dir="ltr">{api}</code>
              </div>
              <p className="t-small mt-2">{t(`items.${i}.body`)}</p>
            </li>
          ))}
        </ul>
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
    <section id="how-it-works" className="section section-alt overflow-hidden" aria-labelledby="parties-title">
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

/* ── Use cases: what partners put inside their product ────────────────── */

const TEMPLATE_TOOLS: Record<string, Array<[string, string]>> = {
  "email-marketer": [["get_audience", "read"], ["draft_campaign", "draft"], ["schedule_send", "egress"]],
  "ads-manager": [["get_spend", "read"], ["draft_change", "draft"], ["apply_change", "write"]],
  "support-desk": [["list_tickets", "read"], ["draft_reply", "draft"], ["send_reply", "egress"]],
  "social-manager": [["get_brand", "read"], ["list_videos", "read"], ["draft_posts", "draft"]],
};

/** Partner #1 first; the other three are illustrative (note 1). */
const TEMPLATE_ORDER = [3, 0, 1, 2];

export function UseCases() {
  const t = useTranslations("home.useCases");
  return (
    <section id="use-cases" className="section" aria-labelledby="uc-title">
      <div className="wrap">
        <SplitHead id="uc-title" title={t("title")} lede={t("lede")} />
        <ul className="tpl-grid mt-14 md:mt-16">
          {TEMPLATE_ORDER.map((i) => {
            const tpl = t(`rows.${i}.template`);
            return (
              <li key={i}>
                <h3 className="t-h3">
                  {t(`rows.${i}.product`)}
                  {i === 3 && <NoteRef n={1} />}
                </h3>
                <p className="t-small mt-2">{t(`rows.${i}.agent`)}</p>
                <div className="tpl-tools" dir="ltr">
                  <p className="tpl-tools-head">
                    template: <span className="text-[var(--fg)]">{tpl}</span>
                  </p>
                  <ul>
                    {TEMPLATE_TOOLS[tpl]?.map(([tool, effect]) => (
                      <li key={tool}>
                        <span className="min-w-0 truncate text-[var(--fg)]">{tool}</span>
                        <span className={effectClass(effect)}>{effect}</span>
                      </li>
                    ))}
                  </ul>
                  {i === 3 && <p className="tpl-more">{t("moreTools", { count: 5 })}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ── Quickstart: the ten minutes ──────────────────────────────────────── */

const TOOLS_TS = `import { defineTool } from "@openlegion/platform";
import { z } from "zod";
import { db } from "@/lib/db";

// One of your functions, now one of the agent's tools.
export const draftCampaign = defineTool({
  description: "Draft an email campaign for one audience",
  input: z.object({ audienceId: z.string(), brief: z.string() }),
  effect: "draft", // read · draft · write · egress
  run: async ({ audienceId, brief }, ctx) =>
    db.campaigns.createDraft(ctx.externalRef, audienceId, brief),
});`;

const AGENT_TS = `import { defineAgent } from "@openlegion/platform";
import * as tools from "./tools";

export default defineAgent({
  slug: "email-marketer",
  instructions: "Plan and draft campaigns. Never send without approval.",
  tools,
  model: "smart",
  limits: { periodCredits: 10_000 },
});`;

const PAGE_TSX = `import { AgentChat } from "@openlegion/platform/react";

// The agent, inside your product, signed in as your user.
export default function CampaignAssistant() {
  return <AgentChat agent="email-marketer" />;
}`;

/** What `ol dev` prints for the first message: the preview kit's own words. */
function DevTerminal() {
  const d = useTranslations("home.demo");
  const setup: Array<[string, string, string]> = [
    ["tunnel", "localhost:3000", "open"],
    ["agent", "email-marketer", "pushed · test"],
    ["signature", "mis-signed call", "refused"],
  ];
  const run: Array<[string, string, string, string]> = [
    ["model", "smart", "", "3 cr"],
    ["tool", "get_audience", "read", "2 cr"],
    ["tool", "draft_campaign", "draft", "6 cr"],
  ];
  return (
    <div className="term" aria-hidden="true">
      <p className="term-head" dir="ltr">
        <span>Terminal</span>
        <span className="text-[var(--fg-3)]">ol dev</span>
      </p>
      <div className="term-body" dir="ltr">
        <p><span className="text-[var(--fg-3)]">$</span> ol dev</p>
        {setup.map(([k, v, s]) => (
          <p key={k} className="term-row">
            <span className="text-[var(--fg-3)]">{k}</span>
            <span className="truncate">{v}</span>
            <span className="text-[var(--ok)]">{s}</span>
          </p>
        ))}
        <p className="term-rule" />
        <p className="term-row">
          <span className="text-[var(--fg-3)]">message</span>
          <span className="col-span-2 truncate tok-s">&quot;{d("ask")}&quot;</span>
        </p>
        {run.map(([k, v, e, c], i) => (
          <p key={i} className="term-row">
            <span className="text-[var(--fg-3)]">{k}</span>
            <span className="truncate">
              {v} {e && <span className={effectClass(e)}>{e}</span>}
            </span>
            <span className="t-num">{c}</span>
          </p>
        ))}
        <p className="term-row">
          <span className="text-[var(--fg-3)]">reply</span>
          <span>streamed</span>
          <span className="t-num text-[var(--fg)]">11 cr</span>
        </p>
        <p className="mt-1"><span className="text-[var(--fg-3)]">$</span> <span className="term-caret" /></p>
      </div>
    </div>
  );
}

export function Quickstart() {
  const t = useTranslations("home.quickstart");
  const r = useTranslations("home.reading");
  const locale = useLocale();
  return (
    <section id="quickstart" className="section section-alt !border-b-0" aria-labelledby="qs-title">
      <div className="wrap">
        <SplitHead
          id="qs-title"
          title={
            <>
              {t("title")}
              <NoteRef n={2} />
            </>
          }
          lede={t("lede")}
        />
        <ol className="qs-rail mt-14 md:mt-16">
          {[0, 1, 2, 3].map((i) => (
            <li key={i}>
              <span className="qs-time" dir="ltr">
                {t(`steps.${i}.time`)} {t("minutes")}
              </span>
              <h3 className="t-mono mt-4 !text-[0.9375rem] font-medium text-[var(--fg)]" dir="ltr">
                {t(`steps.${i}.title`)}
              </h3>
              <p className="t-small mt-2">{t(`steps.${i}.body`)}</p>
            </li>
          ))}
        </ol>
        <div className="qs-ide mt-12">
          <div className="qs-code min-w-0">
            <CodeTabs
              label={t("codeLabel")}
              files={[
                { name: "openlegion/tools.ts", code: TOOLS_TS },
                { name: "openlegion/agent.ts", code: AGENT_TS },
                { name: "app/assistant/page.tsx", code: PAGE_TSX },
              ]}
            />
          </div>
          <DevTerminal />
        </div>
        <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">
          <CtaLink href={WAITLIST_URL} location="quickstart_cta" className="btn">
            {t("cta")} <IconArrow />
          </CtaLink>
          <Link
            href="/learn/add-ai-agents-to-your-app"
            locale={linkLocaleFor("/learn/add-ai-agents-to-your-app", locale)}
            className="link-arrow"
          >
            {r("addAgents")} <IconArrow className="arrow size-4 rtl:-scale-x-100" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── API: the conventions, as a spec sheet ────────────────────────────── */

export function Api() {
  const t = useTranslations("home.api");
  return (
    <section id="api" className="section section-alt !border-t-0 !pt-0" aria-labelledby="api-title">
      <div className="wrap">
        <SplitHead
          id="api-title"
          title={t("title")}
          lede={
            <>
              {t("lede")}
              <NoteRef n={3} />
            </>
          }
        />
        <div className="panel spec mt-12 overflow-hidden">
          <div className="spec-head" aria-hidden="true">
            <span>{t("colConvention")}</span>
            <span>{t("colMeaning")}</span>
            <span>{t("colSample")}</span>
          </div>
          <ul>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <li key={i} className="spec-row">
                <h3 className="t-h3 !text-[1rem]">{t(`items.${i}.title`)}</h3>
                <p className="t-small">{t(`items.${i}.body`)}</p>
                <code className="chip max-w-full justify-self-start overflow-hidden text-ellipsis" dir="ltr">
                  {t(`items.${i}.sample`)}
                </code>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ── Controls: one run, annotated with what enforced each step ────────── */

/** [time, event, actor or effect, cost, note index]. */
const RUN: Array<[string, string, string, string, number | null]> = [
  ["09:00:02", "message.created", "usr_412", "—", 0],
  ["09:00:03", "model · smart", "", "3", 1],
  ["09:00:04", "get_audience", "read", "2", 2],
  ["09:00:06", "draft_campaign", "draft", "6", null],
  ["09:00:07", "schedule_send", "egress", "held", 3],
  ["09:04:41", "approval.decided", "usr_412", "ok", 4],
  ["09:04:42", "schedule_send", "egress", "3", null],
];
const NOTE_TONE: Record<number, string> = { 3: "hold", 4: "ok" };

function RunNote({ i }: { i: number }) {
  const t = useTranslations("home.features.notes");
  return (
    <div className="run-note" data-tone={NOTE_TONE[i] ?? "info"}>
      <p className="run-note-title">{t(`${i}.title`)}</p>
      <p className="run-note-body">{t(`${i}.body`)}</p>
    </div>
  );
}

export function Controls() {
  const t = useTranslations("home.features");
  const r = useTranslations("home.receipts");
  return (
    <section id="controls" className="section" aria-labelledby="controls-title">
      <div className="wrap">
        <SplitHead id="controls-title" title={t("title")} lede={t("lede")} />

        <figure className="run mt-14 md:mt-16">
          <figcaption className="run-row">
            <div className="run-head">
              <span className="font-semibold text-[var(--fg)]">{r("receiptTitle")}</span>
              <span className="t-mono !text-[0.75rem] text-[var(--fg-3)]" dir="ltr">run_7Qm2Kd9a · cust_bluebird-bakery</span>
            </div>
          </figcaption>
          {RUN.map(([time, what, who, cost, note], i) => (
            <div key={i} className="run-row">
              <div className="run-cell" dir="ltr">
                <span className="run-time">{time}</span>
                <span className="run-what">
                  <span className="truncate">{what}</span>
                  {who && <span className={`run-who ${effectClass(who)}`}>{who}</span>}
                </span>
                <span className="run-cost">
                  {cost === "held" ? (
                    <span className="tag tag-hold">held</span>
                  ) : cost === "ok" ? (
                    <span className="tag tag-ok">approved</span>
                  ) : (
                    cost
                  )}
                </span>
              </div>
              {note !== null ? <RunNote i={note} /> : <div className="run-gap" />}
            </div>
          ))}
          <div className="run-row run-row-total">
            <div className="run-cell run-total">
              <span>{r("total")}</span>
              <b className="t-num" dir="ltr">14 credits</b>
            </div>
            <RunNote i={5} />
          </div>
        </figure>

        <div className="facts mt-14 md:mt-16">
          <div>
            <h3 className="t-h3">{r("title")}</h3>
            <ul className="mt-4 grid gap-3">
              {[0, 1, 2].map((i) => (
                <li key={i} className="t-small flex gap-3">
                  <span className="step-ok mt-0.5"><IconCheck className="size-2.5" /></span>
                  <span>{r(`points.${i}`)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="t-h3">{t("items.6.title")}</h3>
            <p className="t-small mt-3">{t("items.6.body")}</p>
            <p className="t-mono mt-4 !text-[0.75rem] text-[var(--fg-3)]" dir="ltr">{t("items.6.proof")}</p>
          </div>
        </div>
        <div className="mt-12 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3 border-t border-[var(--line)] pt-6">
          <Link href="/security" className="link-arrow">
            {t("securityLink")} <IconArrow className="arrow size-4 rtl:-scale-x-100" />
          </Link>
          <p className="t-fine">{r("illustrative")}</p>
        </div>
      </div>
    </section>
  );
}

/* ── Money: the pool and the caps ─────────────────────────────────────── */

export function Money() {
  const t = useTranslations("home.money");
  const locale = useLocale();
  const nf = new Intl.NumberFormat(locale);
  const ws: Array<{ id: string; ref: string; cap: number; used: number; state?: "capped" | "archived"; grant?: number }> = [
    { id: "ws_8f2KqL3xT9", ref: "cust_bluebird-bakery", cap: 10000, used: 6679 },
    { id: "ws_1Zd9Hw4pQe", ref: "cust_northwind", cap: 2500, used: 2500, state: "capped" },
    { id: "ws_6Hn2Vb8sLm", ref: "cust_lumen-labs", cap: 25000, used: 3180, grant: 5000 },
    { id: "ws_4Tp7Rc1xKa", ref: "cust_old-co", cap: 5000, used: 0, state: "archived" },
  ];
  return (
    <section id="money" className="section section-alt" aria-labelledby="money-title">
      <div className="wrap grid items-center gap-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20">
        <div>
          <h2 id="money-title" className="t-h2 max-w-[12ch]">{t("title")}</h2>
          <p className="t-lede mt-6 max-w-[32rem]">{t("lede")}</p>
          <p className="t-body mt-5">{t("idle")}</p>
          <p className="mt-8">
            <Link href="/pricing" className="link-arrow">
              {t("link")} <IconArrow className="arrow size-4 rtl:-scale-x-100" />
            </Link>
          </p>
        </div>
        <figure className="panel overflow-hidden !shadow-[var(--shadow-3)]">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--line)] px-5 py-6 sm:px-7">
            <div>
              <p className="text-[0.875rem] text-[var(--fg-2)]">
                {t("pool")} · {t("prepaid")}
              </p>
              <p className="t-num mt-2 text-[2.5rem] font-medium leading-none tracking-[-0.035em] text-[var(--fg)]" dir="ltr">
                {nf.format(250000)} <span className="text-[1rem] font-medium tracking-normal text-[var(--fg-3)]">credits</span>
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
            <Link href="/faq" className="link-arrow">
              {t("more")} <IconArrow className="arrow size-4 rtl:-scale-x-100" />
            </Link>
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
        <p className="t-lede mx-auto mt-6 max-w-[34rem]">{t("body")}</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3 max-sm:[&>a]:flex-1 max-sm:[&>a]:px-3">
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

/* ── Notes: every qualification on the page, said once ────────────────── */

const NOTE_KEYS = ["templates", "kit", "api"] as const;

export function Notes() {
  const t = useTranslations("home.notes");
  return (
    <section className="hairline py-10 md:py-12" aria-labelledby="notes-title">
      <div className="wrap">
        <h2 id="notes-title" className="sr-only">{t("title")}</h2>
        <ol className="notes">
          {NOTE_KEYS.map((k, i) => (
            <li key={k} id={`note-${i + 1}`}>
              <span className="notes-n t-num" aria-hidden="true">{i + 1}</span>
              <p>{t(k)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
