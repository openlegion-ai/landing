"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { IconCheck, IconSend, IconSpark } from "@/components/site/icons";
import { useActive, useStill, useTimeline } from "@/components/site/use-loop";

/**
 * The hero: one run, seen from both sides at once.
 * Your app as your customer sees it (your brand, our agent inside), and your
 * console, where the same run writes itself as a receipt: each step checked
 * and costed, the third-party wall, the approval, the cap moving. One
 * timeline drives both windows. Reduced motion holds the frame at the wall.
 */

// Phase holds (ms). 0 idle · 1 typing · 2 asked · 3 thinking · 4 tool 1 · 5 tool 2 · 6 reply · 7 wall · 8 press · 9 approved · 10 sent
const HOLD = [700, 1900, 700, 800, 900, 1000, 900, 2800, 420, 900, 4600];
const WALL_OPEN = 7;
const STILL = WALL_OPEN;
const BASE_USED = 6664;
const CAP = 10000;

type Row = { at: number; time: string; ev: string; tag?: string; tagClass?: string; cost?: string; state: "ok" | "hold" | "info" };
const ROWS: Row[] = [
  { at: 2, time: "09:00:02", ev: "message.created", tag: "usr_412", tagClass: "text-[var(--fg-3)]", state: "info" },
  { at: 3, time: "09:00:03", ev: "model.call", tag: "smart", tagClass: "text-[var(--fg-3)]", cost: "3", state: "ok" },
  { at: 4, time: "09:00:04", ev: "get_audience", tag: "read", tagClass: "chip-read", cost: "2", state: "ok" },
  { at: 5, time: "09:00:06", ev: "draft_campaign", tag: "draft", tagClass: "chip-draft", cost: "6", state: "ok" },
  { at: 7, time: "09:00:07", ev: "schedule_send", tag: "egress", tagClass: "chip-egress", cost: "held", state: "hold" },
  { at: 9, time: "09:04:41", ev: "approval.decided", tag: "usr_412", tagClass: "text-[var(--fg-3)]", cost: "approved", state: "ok" },
  { at: 10, time: "09:04:42", ev: "schedule_send", tag: "egress", tagClass: "chip-egress", cost: "3", state: "ok" },
];
const spentBy = (phase: number) =>
  ROWS.filter((r) => r.at <= phase && /^\d+$/.test(r.cost ?? "")).reduce((s, r) => s + Number(r.cost), 0);

export function RunBothSides() {
  const t = useTranslations("home.demo");
  const locale = useLocale();
  const nf = new Intl.NumberFormat(`${locale}-u-nu-latn`);
  const ref = useRef<HTMLDivElement>(null);
  const active = useActive(ref);
  const still = useStill();
  const { phase, fading } = useTimeline(HOLD, { active, still, stillPhase: STILL });
  const ask = t("ask");
  const on = (n: number) => phase >= n;
  const typing = phase === 1;
  const spent = spentBy(phase);
  const used = BASE_USED + spent;
  /** The receipt's rows as they stand at phase `p`; `live` marks the newest row. */
  const receipt = (p: number, live: boolean) =>
    ROWS.map((r, i) => (
      <li key={i} className="reveal" data-on={p >= r.at}>
        <div>
          <div className={`duo-row ${live && p === r.at && !still ? "duo-row-new" : ""}`} data-state={r.state}>
            <span className="duo-disc" data-state={r.state}>
              {r.state === "ok" ? <IconCheck className="size-2.5" /> : r.state === "hold" ? <i /> : null}
            </span>
            <span className="duo-time" dir="ltr">{r.time}</span>
            <span className="duo-ev" dir="ltr">
              <span className="truncate">{r.ev}</span>
              {r.tag && <span className={`duo-tag ${r.tagClass}`}>{r.tag}</span>}
            </span>
            <span className="duo-cost">
              {r.cost === "held" ? (
                <span className="tag tag-hold">{t("held")}</span>
              ) : r.cost === "approved" ? (
                <span className="tag tag-ok">{t("approvedTag")}</span>
              ) : (
                r.cost ?? ""
              )}
            </span>
          </div>
          {r.state === "hold" && (
            <div className="duo-wall" data-open={p >= WALL_OPEN && p < WALL_OPEN + 2}>
              <div>
                <p><b>{t("wallLabel")}</b> {t("wall")}</p>
                <p className="duo-hook"><span dir="ltr">→ action.requires_approval</span> <span>{t("hook")}</span></p>
              </div>
            </div>
          )}
        </div>
      </li>
    ));

  return (
    <div ref={ref} className="duo-pair" aria-hidden="true">
      {/* What your customer sees */}
      <figure className="duo-side duo-side-app">
        <figcaption className="duo-cap" data-field-clear>
          <span className="app-mark !size-4 !rounded-[5px]" /> {t("capApp")}
        </figcaption>
        <div className="app-window duo-app" data-field-anchor>
          <div className="app-bar">
            <span className="app-mark" />
            <span className="font-semibold tracking-[-0.01em] text-[var(--fg)]">{t("app")}</span>
            <span className="app-user">
              <span className="app-avatar" />
              {t("customer")}
            </span>
          </div>
          <div className="app-body demo-fade" data-fading={fading}>
            <div className="app-main">
              <div className="app-list-head">
                <b>{t("listTitle")}</b>
                <span className="app-btn">{t("newCampaign")}</span>
              </div>
              <div className="reveal" data-on={on(5)}>
                <div>
                  <div className="camp camp-new">
                    <b>{t("newRow.title")}</b>
                    <small>
                      <span>{t("newRow.meta")}</span>
                      <span className={`tag ${on(9) ? "tag-ok" : "tag-blue"}`}>{on(9) ? t("scheduled") : t("draft")}</span>
                    </small>
                  </div>
                  <div className="h-2" />
                </div>
              </div>
              {[0, 1, 2].map((i) => (
                <div key={i} className="camp camp-past">
                  <b>{t(`past.${i}.title`)}</b>
                  <small>
                    <span className="t-num">{t(`past.${i}.meta`)}</span>
                    <span className="tag">{t("sent")}</span>
                  </small>
                </div>
              ))}
            </div>
            <div className="chat">
              <div className="chat-head">
                <span>
                  <span className="chat-spark"><IconSpark className="size-2.5" /></span>
                  {t("assistant")}
                </span>
              </div>
              <div className="chat-log">
                <div className="reveal" data-on={on(2)}><div className="msg-user"><p>{ask}</p></div></div>
                <div className="reveal" data-on={phase === 3}><div><span className="typing"><i /><i /><i /></span></div></div>
                <div className="reveal" data-on={on(4)}>
                  <div className="step-line"><div>
                    <span className="step-ok"><IconCheck className="size-2.5" /></span>
                    <span className="min-w-0 truncate">{t("step1")}</span>
                    <code dir="ltr">get_audience</code>
                  </div></div>
                </div>
                <div className="reveal" data-on={on(5)}>
                  <div className="step-line"><div>
                    <span className="step-ok"><IconCheck className="size-2.5" /></span>
                    <span className="min-w-0 truncate">{t("step2")}</span>
                    <code dir="ltr">draft_campaign</code>
                  </div></div>
                </div>
                <div className="reveal" data-on={on(6)}><div><p className="msg-agent">{t("reply")}</p></div></div>
                <div className="reveal" data-on={on(7)} data-gone={on(9)}>
                  <div className="approval"><div>
                    <div className="approval-top">
                      <span className="dot" />
                      {t("approvalTitle")}
                      <span className="when">{t("approvalWhen")}</span>
                    </div>
                    <p>{t("approvalBody")}</p>
                    <div className="approval-row">
                      <span className="yes" data-pressed={phase === 8}>{t("approve")}</span>
                      <span>{t("notNow")}</span>
                    </div>
                  </div></div>
                </div>
                <div className="reveal" data-on={on(9)}>
                  <div className="approved"><div>
                    <span className="step-ok"><IconCheck className="size-2.5" /></span>
                    <span className="min-w-0">
                      <b>{t("approved")}</b> · {t("approvedNote")}
                    </span>
                  </div></div>
                </div>
              </div>
              <div className="chat-input">
                <span className={typing ? "typed" : "flex-1 truncate"}>
                  {typing ? <TypeOut text={ask} /> : t("placeholder")}
                </span>
                <span className="chat-send"><IconSend /></span>
              </div>
            </div>
          </div>
        </div>
      </figure>

      {/* What you see */}
      <figure className="duo-side duo-side-console">
        <figcaption className="duo-cap" data-field-clear>
          <span className="duo-cap-ol" /> {t("capConsole")}
        </figcaption>
        <div className="duo-console ink demo-fade" data-fading={fading}>
          <div className="duo-con-head">
            <span className="font-semibold text-[var(--fg)]">{t("receiptTitle")}</span>
            <span className="text-[var(--fg-3)]" dir="ltr">run_7Qm2Kd9a</span>
          </div>
          <p className="duo-con-sub" dir="ltr">cust_bluebird-bakery <span>·</span> ws_8f2KqL3xT9 <span>·</span> live</p>
          {/* Below 1024px the receipt has no fixed height: hidden copies of its two tallest
              frames (the wall open; every row in) share its cell, so the run never moves the page. */}
          <div className="duo-stack">
            <ol className="duo-rows">{receipt(phase, true)}</ol>
            <ol className="duo-rows duo-sizer">{receipt(WALL_OPEN + 1, false)}</ol>
            <ol className="duo-rows duo-sizer">{receipt(HOLD.length - 1, false)}</ol>
          </div>
          <div className="duo-cap-meter">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[var(--fg-2)]">{t("period", { customer: t("customer") })}</span>
              <span className="t-num text-[var(--fg-2)]">
                {t.rich("meter", {
                  used: nf.format(used),
                  cap: nf.format(CAP),
                  b: (c) => <b className="font-medium text-[var(--fg)]">{c}</b>,
                })}
              </span>
            </div>
            <div className="meter mt-2.5"><span style={{ ["--v" as string]: used / CAP }} /></div>
            <div className="duo-total">
              <span>{t("runLabel")}</span>
              <span className="t-num">{t("runCost", { n: spent })}</span>
            </div>
          </div>
        </div>
      </figure>
    </div>
  );
}

/** The customer's message, typed out one character at a time. */
function TypeOut({ text }: { text: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setN(i);
      if (i >= text.length) window.clearInterval(id);
    }, 32);
    return () => window.clearInterval(id);
  }, [text]);
  return (
    <>
      {text.slice(0, n)}
      <span className="caret" />
    </>
  );
}
