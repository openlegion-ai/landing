"use client";

import { useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useActive, useStill, useTimeline } from "@/components/site/use-loop";

/**
 * Every customer, one board: your console's workspace list for one agent
 * product. One row per customer, each with its own agent, cap and state.
 * Rows change one at a time as their agents work; a wall and a reached cap
 * show up as rows that stop. Bluebird's row opens to show the held send.
 */

type Tone = "blue" | "hold" | "ok" | "danger" | "idle";
type Tag = "working" | "needsApproval" | "capped" | "idle" | "done" | "web_low";
type State = { now: string; tone: Tone; tag: Tag; used: number; drawer?: "held" | "approved" };
type Ws = { name: string; id: string; cap: number; states: State[] };

// Fictional customers; their names are data, not copy.
const WS: Ws[] = [
  { name: "Bluebird Bakery", id: "ws_8f2KqL3xT9", cap: 10000, states: [
    { now: "bbDraft", tone: "blue", tag: "working", used: 6670 },
    { now: "bbHeld", tone: "hold", tag: "needsApproval", used: 6675, drawer: "held" },
    { now: "bbDone", tone: "ok", tag: "done", used: 6678, drawer: "approved" },
  ] },
  { name: "Northwind Supply", id: "ws_1Zd9Hw4pQe", cap: 2500, states: [
    { now: "nwDraft", tone: "blue", tag: "working", used: 2494 },
    { now: "nwCapped", tone: "danger", tag: "capped", used: 2500 },
  ] },
  { name: "Lumen Labs", id: "ws_6Hn2Vb8sLm", cap: 25000, states: [
    { now: "luList", tone: "blue", tag: "working", used: 3174 },
    { now: "luDraft", tone: "blue", tag: "working", used: 3186 },
    { now: "idle", tone: "idle", tag: "idle", used: 3186 },
  ] },
  { name: "Kestrel Coffee", id: "ws_9Qa3Mn6tWd", cap: 10000, states: [
    { now: "keAudience", tone: "blue", tag: "working", used: 812 },
    { now: "keFetch", tone: "blue", tag: "working", used: 815 },
    { now: "keUntrusted", tone: "hold", tag: "web_low", used: 815 },
  ] },
  { name: "Fern & Co", id: "ws_7Rb1Jc0wHy", cap: 5000, states: [
    { now: "idle", tone: "idle", tag: "idle", used: 1408 },
    { now: "feHeld", tone: "hold", tag: "needsApproval", used: 1410 },
    { now: "feDone", tone: "ok", tag: "done", used: 1412 },
  ] },
  { name: "Atlas Fitness", id: "ws_2Lk8Pz5rNe", cap: 10000, states: [
    { now: "atSent", tone: "ok", tag: "done", used: 5021 },
    { now: "atAudience", tone: "blue", tag: "working", used: 5023 },
  ] },
];

/** [tick → (row, state)]: the order rows change in. Bluebird's held send leads, so its drawer is shut only for the opening beat. */
const SCRIPT: Array<[number, number]> = [
  [0, 1], [2, 1], [3, 1], [1, 1], [4, 1], [3, 2], [0, 2], [5, 1], [4, 2], [2, 2],
];
const HOLD = [1400, ...SCRIPT.map((_, i) => (i === 0 ? 2600 : i === 6 ? 2200 : 1500)), 3200];
const STILL = 6;

const stateAt = (tick: number) => {
  const s = WS.map(() => 0);
  for (let i = 0; i < Math.min(tick, SCRIPT.length); i++) s[SCRIPT[i][0]] = SCRIPT[i][1];
  return s;
};

const TAG_CLASS: Record<Tone, string> = { blue: "tag-blue", hold: "tag-hold", ok: "tag-ok", danger: "tag-danger", idle: "" };

export function WorkspaceBoard() {
  const t = useTranslations("home.board");
  const locale = useLocale();
  const nf = new Intl.NumberFormat(`${locale}-u-nu-latn`);
  const ref = useRef<HTMLElement>(null);
  const active = useActive(ref);
  const still = useStill();
  const { phase, fading } = useTimeline(HOLD, { active, still, stillPhase: STILL });
  const idx = stateAt(phase);
  const lastChanged = phase >= 1 && phase <= SCRIPT.length ? SCRIPT[phase - 1][0] : -1;
  const states = WS.map((w, i) => w.states[idx[i]]);
  const needs = states.filter((s) => s.tone === "hold").length;
  const capped = states.filter((s) => s.tone === "danger").length;

  return (
    <figure ref={ref} className="board" aria-hidden="true">
      <div className="board-head">
        <div className="flex min-w-0 items-center gap-3">
          <span className="font-semibold text-[var(--fg)]">{t("ui.workspaces")}</span>
          <code className="board-tpl" dir="ltr">email-marketer</code>
        </div>
        <span className="board-live" dir="ltr"><span className="board-live-dot" />live</span>
      </div>
      <div className="board-filters">
        <span aria-current="true">{t("ui.all")} <b>{WS.length}</b></span>
        <span>{t("ui.needsApproval")} <b className={needs ? "text-[var(--hold)]" : ""}>{needs}</b></span>
        <span>{t("ui.capped")} <b className={capped ? "text-[var(--danger)]" : ""}>{capped}</b></span>
      </div>
      <div className="board-cols">
        <span>{t("ui.colCustomer")}</span>
        <span>{t("ui.colNow")}</span>
        <span className="text-end">{t("ui.colCredits")}</span>
        <span className="text-end">{t("ui.colState")}</span>
      </div>
      <ul className="board-rows demo-fade" data-fading={fading}>
        {WS.map((w, i) => {
          const s = states[i];
          const now = t(`now.${s.now}`);
          return (
            <li key={w.id} className="board-row" data-tone={s.tone} data-hit={!still && i === lastChanged}>
              <div className="board-cust">
                <span className="board-name">{w.name}</span>
                <span className="board-id" dir="ltr">{w.id}</span>
              </div>
              <div className="board-now"><Roll text={now} still={still} whole={SHAPED.has(locale)} /></div>
              <div className="board-credits" dir="ltr">
                <span className="t-num"><b>{nf.format(s.used)}</b> / {nf.format(w.cap)}</span>
                <span className={`meter ${s.tone === "danger" ? "meter-full" : ""}`}><span style={{ ["--v" as string]: Math.min(1, s.used / w.cap) }} /></span>
              </div>
              <div className="board-state">
                <span className={`tag ${TAG_CLASS[s.tone]}`}>
                  {s.tone !== "idle" && <span className="dot" />}
                  {s.tag === "web_low" ? <span dir="ltr">trust: web_low</span> : t(`tag.${s.tag}`)}
                </span>
              </div>
              {i === 0 && (
                <div className="board-drawer" data-open={!!s.drawer}>
                  <div>
                    {/* Both versions stay rendered: below 768px they share one slot, so the row keeps its height. */}
                    <div className="board-drawer-v" data-show={s.drawer !== "approved"}>
                      <p className="board-drawer-line">
                        <span className="t-mono text-[var(--hold)]" dir="ltr">schedule_send · egress</span> <span className="board-sep">·</span>{" "}
                        {t("drawer.held")}
                      </p>
                      <p className="board-drawer-line board-hook">
                        <span dir="ltr">action.requires_approval</span> <span className="board-hook-note">{t("drawer.hook")}</span>
                      </p>
                    </div>
                    <div className="board-drawer-v" data-show={s.drawer === "approved"}>
                      <p className="board-drawer-line board-ok">
                        <span className="t-mono" dir="ltr">approval.decided · usr_412</span> <span className="board-sep">·</span>{" "}
                        {t.rich("drawer.approved", { code: (c) => <span className="t-mono" dir="ltr">{c}</span> })}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </figure>
  );
}

/** Scripts whose letters join or stack: splitting them into spans breaks the shaping. */
const SHAPED = new Set(["ar", "hi", "th"]);

/** New text rolls in one character after another, like a departures board (whole, for shaped scripts). */
function Roll({ text, still, whole }: { text: string; still: boolean; whole: boolean }) {
  if (still) return <span className="board-roll">{text}</span>;
  if (whole) return <span className="board-roll board-roll-whole" key={text}>{text}</span>;
  return (
    <span className="board-roll" key={text}>
      {Array.from(text).map((ch, i) => (
        <span key={i} className="board-ch" style={{ ["--i" as string]: Math.min(i, 40) }}>
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </span>
  );
}
