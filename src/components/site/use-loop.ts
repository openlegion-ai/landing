"use client";

import { useEffect, useState, type RefObject } from "react";

/** True while the element is on screen and the tab is visible. */
export function useActive(ref: RefObject<Element | null>, threshold = 0.15) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let inView = false;
    const update = () => setActive(inView && document.visibilityState === "visible");
    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      update();
    }, { threshold });
    io.observe(el);
    document.addEventListener("visibilitychange", update);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, [ref, threshold]);
  return active;
}

/** prefers-reduced-motion, live. */
export function useStill() {
  const [still, setStill] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setStill(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return still;
}

/**
 * A phase timeline: holds[i] is how long phase i lasts. Runs only while
 * `active`, loops after the last phase (with a fade flag for the gap), and
 * holds at `stillPhase` under reduced motion. It also starts at `stillPhase`,
 * so the server HTML and the first paint are the designed frame, and motion
 * carries on from there. `holds` must be a stable (module-level) array.
 */
export function useTimeline(
  holds: readonly number[],
  { active, still, stillPhase, fade = 520 }: { active: boolean; still: boolean; stillPhase: number; fade?: number },
) {
  const [phase, setPhase] = useState(stillPhase);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (still || !active) return;
    let id = 0;
    if (fading) {
      id = window.setTimeout(() => {
        setPhase(0);
        setFading(false);
      }, fade);
    } else if (phase >= holds.length - 1) {
      id = window.setTimeout(() => setFading(true), holds[holds.length - 1]);
    } else {
      id = window.setTimeout(() => setPhase((p) => p + 1), holds[phase]);
    }
    return () => window.clearTimeout(id);
  }, [phase, fading, active, still, fade, holds]);

  return still ? { phase: stillPhase, fading: false } : { phase, fading };
}
