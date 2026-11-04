"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { IconCheck, IconSend, IconSpark } from "@/components/site/icons";

/**
 * The hero illustration: "your app" (its own campaign list, kept quiet)
 * with our agent docked inside it, working for one of your customers.
 * The customer asks, the agent calls two of your functions, the draft lands
 * in your app as a real object, and the send waits for a person's approval.
 * It ends as a receipt with its credit cost.
 *
 * Under the window, four capability steps light up as the story reaches
 * them. One authored motion moment for the page. Reduced motion and no-JS
 * both get the paused-at-approval frame (`data-static`).
 */

const STILL_PHASE = 7;
/** ms to wait in each phase before moving to the next (index = phase). */
const HOLD = [900, 0, 600, 800, 900, 1000, 800, 2600, 380, 4400];
const STEPS = 4;

/** Which capability step is current for a phase. */
const stepFor = (phase: number) => (phase < 4 ? 0 : phase < 7 ? 1 : phase < 9 ? 2 : 3);

export function HeroDemo() {
  const t = useTranslations("home.demo");
  const ask = t("ask");
  const [phase, setPhase] = useState(0);
  const [typed, setTyped] = useState(0);
  const [fading, setFading] = useState(false);
  const [active, setActive] = useState(false);
  const [still, setStill] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      setStill(mq.matches);
      setFading(false);
      setTyped(0);
      setPhase(mq.matches ? STILL_PHASE : 0);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let inView = false;
    const update = () => setActive(inView && document.visibilityState === "visible");
    const io = new IntersectionObserver(
      ([e]) => {
        inView = e.isIntersecting;
        update();
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    document.addEventListener("visibilitychange", update);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  useEffect(() => {
    if (still || !active) return;
    let id = 0;
    const after = (ms: number, fn: () => void) => {
      id = window.setTimeout(fn, ms);
    };
    if (fading) {
      after(520, () => {
        setPhase(0);
        setTyped(0);
        setFading(false);
      });
    } else if (phase === 1) {
      if (typed < ask.length) after(typed === 0 ? 240 : 28, () => setTyped((n) => n + 1));
      else after(360, () => setPhase(2));
    } else if (phase >= HOLD.length - 1) {
      after(HOLD[HOLD.length - 1], () => setFading(true));
    } else {
      after(HOLD[phase], () => setPhase((p) => p + 1));
    }
    return () => window.clearTimeout(id);
  }, [phase, typed, active, fading, still, ask.length]);

  const on = (n: number) => phase >= n;
  const typing = phase === 1;
  const typedText = typing ? ask.slice(0, typed) : "";
  const scheduled = on(9);
  const current = stepFor(phase);

  return (
    <figure className="relative">
      <div ref={ref} className="app-window" aria-hidden="true" data-field-anchor>
        <div className="app-bar">
          <span className="app-mark" />
          <span className="font-semibold tracking-[-0.01em] text-[var(--fg)]">{t("app")}</span>
          <span className="app-user">
            <span className="app-avatar" />
            {t("customer")}
          </span>
        </div>

        <div className="app-body demo-fade" data-fading={fading}>
          {/* Your app's own UI, quiet and real; the one new object is the agent's draft. */}
          <div className="app-main">
            <div className="app-list-head">
              <b>{t("listTitle")}</b>
              <span className="app-btn">{t("newCampaign")}</span>
            </div>
            <div className="reveal" data-on={on(5)} data-static="true">
              <div>
                <div className="camp camp-new">
                  <b>{t("newRow.title")}</b>
                  <small>
                    <span>{t("newRow.meta")}</span>
                    <span className={`tag ${scheduled ? "tag-ok" : "tag-blue"}`}>{scheduled ? t("scheduled") : t("draft")}</span>
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
                <span className="chat-spark">
                  <IconSpark className="size-2.5" />
                </span>
                {t("assistant")}
              </span>
            </div>

            <div className="chat-log">
              <div className="reveal" data-on={on(2)} data-static="true">
                <div className="msg-user">
                  <p>{ask}</p>
                </div>
              </div>
              <div className="reveal" data-on={phase === 3}>
                <div>
                  <span className="typing"><i /><i /><i /></span>
                </div>
              </div>
              <div className="reveal" data-on={on(4)} data-static="true">
                <div className="step-line">
                  <div>
                    <span className="step-ok"><IconCheck className="size-2.5" /></span>
                    <span className="min-w-0 truncate">{t("step1")}</span>
                    <code dir="ltr">get_audience</code>
                  </div>
                </div>
              </div>
              <div className="reveal" data-on={on(5)} data-static="true">
                <div className="step-line">
                  <div>
                    <span className="step-ok"><IconCheck className="size-2.5" /></span>
                    <span className="min-w-0 truncate">{t("step2")}</span>
                    <code dir="ltr">draft_campaign</code>
                  </div>
                </div>
              </div>
              <div className="reveal" data-on={on(6)} data-static="true">
                <div>
                  <p className="msg-agent">{t("reply")}</p>
                </div>
              </div>
              <div className="reveal" data-on={on(7)} data-gone={on(9)} data-static="true">
                <div className="approval">
                  <div>
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
                  </div>
                </div>
              </div>
              <div className="reveal" data-on={on(9)}>
                <div className="approved">
                  <div>
                    <span className="step-ok"><IconCheck className="size-2.5" /></span>
                    <span className="min-w-0">
                      <b>{t("approved")}</b> · {t("approvedNote")}
                      <small dir="ltr">{t("receipt")}</small>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="chat-input">
              <span className={typing ? "typed" : "flex-1 truncate"}>
                {typing ? (
                  <>
                    {typedText}
                    <span className="caret" />
                  </>
                ) : (
                  t("placeholder")
                )}
              </span>
              <span className={`chat-send ${typing && typed === ask.length ? "ready" : ""}`}>
                <IconSend />
              </span>
            </div>
          </div>
        </div>
      </div>

      <ol className="demo-steps" aria-label={t("stepsLabel")} data-field-clear>
        {Array.from({ length: STEPS }, (_, i) => (
          <li key={i} data-state={i < current ? "done" : i === current ? "on" : "next"}>
            <span className="n" dir="ltr">{String(i + 1).padStart(2, "0")}</span>
            {t(`steps.${i}`)}
          </li>
        ))}
      </ol>

      <noscript
        dangerouslySetInnerHTML={{
          __html: '<style>.reveal[data-static="true"]{grid-template-rows:1fr;opacity:1;transform:none}</style>',
        }}
      />
      <figcaption className="t-fine mt-4" data-field-clear>{t("caption")}</figcaption>
    </figure>
  );
}
