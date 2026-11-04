"use client";

import { useEffect, useRef } from "react";

/**
 * The ground of the page atmosphere: a field of customer workspaces receding
 * to a horizon. Most tiles sleep; the awake ones (an agent working) glow blue
 * and wake and sleep, each on its own cycle. The field drifts slowly away
 * from you, toward the product, so the whole ground is alive.
 *
 * Two canvases: the base (horizon light, the far field, and far awake tiles
 * too small to read as breathing) is drawn once per layout; the live one
 * redraws only what moves: the near rows, which drift, and the awake tiles
 * big enough to breathe. Far rows move less than a pixel a second, so they
 * are baked, and the near rows cross-fade into them.
 *
 * Place it as the first child of a `.stage`. It lays itself out from marked
 * elements in that stage:
 * - `[data-field-anchor]`: the product the field sits behind (the field
 *   converges on it, and nothing hidden behind it is drawn).
 * - `[data-field-copy]`: the text block, which is always kept clear.
 * - `[data-field-clear]`: any other small text over the field, also kept clear.
 *
 * It pauses out of view and in hidden tabs, draws one still frame under
 * reduced motion, and redraws when the system theme changes.
 */
type Box = { x0: number; x1: number; y0: number; y1: number; soft: number };
type Lit = { x: number; y: number; w: number; h: number; a: number; bright: boolean; phase: number; period: number };

const STEP = 0.5; // world rows are half a unit apart
const NEAR = 2.2;
const FAR = 56;
const AWAKE = 0.1; // share of workspaces with an agent working
const BRIGHT = 0.016;
const BREATHE_MIN = 1.6; // awake tiles smaller than this (px) are baked: too small to read as breathing
const DYN = 15; // rows nearer than this drift
const BLEND = 3; // and cross-fade into the baked rows over this depth
const SPEED = 0.3; // world units a second, away from the viewer
const FRAME = 40; // ms: about 24 fps, plenty for slow motion

/** Stable per-workspace randomness from its grid cell, so a tile keeps its identity as the field moves. */
const hash = (a: number, b: number) => {
  let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};

export function AgentField({ quiet = false }: { quiet?: boolean }) {
  const baseRef = useRef<HTMLCanvasElement>(null);
  const liveRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const bc = baseRef.current;
    const cv = liveRef.current;
    const stage = cv?.parentElement;
    const bg = bc?.getContext("2d");
    const ctx = cv?.getContext("2d");
    if (!bc || !cv || !stage || !bg || !ctx) return;

    const mqDark = window.matchMedia("(prefers-color-scheme: dark)");
    const mqStill = window.matchMedia("(prefers-reduced-motion: reduce)");
    const k = quiet ? 0.62 : 1;

    let W = 0, H = 0, dpr = 1, raf = 0, last = 0, inView = true, light = false;
    let vx = 0, yh = 0, f = 64, camH = 1, top = 0;
    let clears: Box[] = [];
    let hide: Box | null = null; // the product: opaque, so nothing behind it is drawn
    let glow: HTMLCanvasElement | null = null;
    let lateral = new Float32Array(0); // sideways fade, sampled across the width
    let breathing: Lit[] = [];
    const near: Lit[] = [];

    const sprite = (rgb: string) => {
      const c = document.createElement("canvas");
      c.width = c.height = 64;
      const g = c.getContext("2d");
      if (!g) return null;
      const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      r.addColorStop(0, `rgba(${rgb},1)`);
      r.addColorStop(0.35, `rgba(${rgb},.35)`);
      r.addColorStop(1, `rgba(${rgb},0)`);
      g.fillStyle = r;
      g.fillRect(0, 0, 64, 64);
      return c;
    };

    const fog = (Z: number) => Math.min(1, Math.max(0, (Z - NEAR) / 2.5)) * Math.max(0, 1 - Z / FAR);
    const foot = (y: number) => (y > H - 140 ? Math.max(0, 1 - (y - (H - 140)) / 140) : 1);
    const side = (x: number) => lateral[Math.min(lateral.length - 1, Math.max(0, ((x / W) * (lateral.length - 1)) | 0))] ?? 0;
    const away = (x: number, y: number) => {
      let a = 1;
      for (const c of clears) {
        const oy = Math.max(c.y0 - y, 0, y - c.y1);
        if (oy >= c.soft * a) continue;
        const ox = Math.max(c.x0 - x, 0, x - c.x1);
        const d = Math.sqrt(ox * ox + oy * oy) / c.soft;
        if (d < a) a = d;
      }
      return a;
    };
    const hidden = (x: number, y: number) => !!hide && x > hide.x0 && x < hide.x1 && y > hide.y0 && y < hide.y1;

    /** One tile: an awake tile glows (light theme lays the glow on, dark adds it). */
    const tile = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, a: number, bright: boolean) => {
      if (glow) {
        const s = Math.max(w * 3.2, bright ? 34 : 16);
        g.globalAlpha = a * (bright ? 0.75 : 0.4);
        g.globalCompositeOperation = light ? "source-over" : "lighter";
        g.drawImage(glow, x - s / 2, y - s / 2, s, s);
        g.globalCompositeOperation = "source-over";
      }
      g.globalAlpha = 1;
      g.fillStyle = light
        ? `rgba(37,99,235,${(bright ? 0.85 : 0.5) * a})`
        : `rgba(${bright ? "191,219,254" : "96,165,250"},${(bright ? 1 : 0.72) * a})`;
      g.beginPath();
      g.roundRect(x - w / 2, y - h / 2, w, h, Math.min(w, h) * 0.22);
      g.fill();
    };
    const breath = (t: number, phase: number, period: number) =>
      0.55 + 0.45 * Math.pow(Math.sin((t / 1000 / period) * Math.PI * 2 + phase) * 0.5 + 0.5, 2);

    const build = () => {
      light = !mqDark.matches;
      const sr = stage.getBoundingClientRect();
      W = stage.clientWidth;
      H = stage.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      for (const c of [bc, cv]) {
        c.width = Math.round(W * dpr);
        c.height = Math.round(H * dpr);
      }
      glow = sprite(light ? "37,99,235" : "96,165,250");

      const copy = stage.querySelector("[data-field-copy]")?.getBoundingClientRect();
      const anchor = stage.querySelector("[data-field-anchor]")?.getBoundingClientRect();
      // Stacked when the product sits under the copy rather than beside it.
      const stacked = !anchor || !copy || anchor.top >= copy.bottom - 8;
      vx = anchor && !stacked ? anchor.left - sr.left + anchor.width / 2 : W / 2;
      yh = anchor && !stacked
        ? anchor.top - sr.top + anchor.height * 0.52
        : (copy ? copy.bottom - sr.top : H * 0.6) + (anchor ? 28 : 72);
      // Wide and stacked, the product covers the middle: a finer grid, and sides bright enough to read.
      const wide = stacked && W >= 1024;
      f = W < 640 ? 46 : stacked ? (wide ? 72 : 64) : 96;
      const copyFirst = !anchor || !copy || copy.left < anchor.left;
      camH = ((Math.max(H - yh, 120) + 30) * NEAR) / f;
      top = Math.max(0, yh - 24);
      lateral = new Float32Array(257);
      for (let i = 0; i < lateral.length; i++) {
        const dx = (i / (lateral.length - 1)) - vx / W;
        const s = stacked ? (wide ? 0.8 : 1.3) : (dx < 0) === copyFirst ? 2.3 : 0.9;
        lateral[i] = Math.max(0, 1 - Math.pow(Math.abs(dx) * s * 1.25, 1.6));
      }
      const box = (r: DOMRect, pad: number): Box => ({ x0: r.left - sr.left - pad, x1: r.right - sr.left + pad, y0: r.top - sr.top - pad, y1: r.bottom - sr.top + pad, soft: Math.abs(pad) * 2 });
      clears = [
        ...(copy ? [box(copy, 44)] : []),
        ...[...stage.querySelectorAll("[data-field-clear]")].map((el) => box(el.getBoundingClientRect(), 10)),
      ];
      hide = anchor ? box(anchor, -12) : null;

      bg.setTransform(dpr, 0, 0, dpr, 0, 0);
      bg.clearRect(0, 0, W, H);
      // Horizon light where the field meets the sky, brightest under the product
      const hz = bg.createRadialGradient(vx, yh, 0, vx, yh, W * 0.55);
      hz.addColorStop(0, light ? `rgba(96,165,250,${0.38 * k})` : `rgba(59,130,246,${0.55 * k})`);
      hz.addColorStop(0.35, light ? `rgba(147,197,253,${0.16 * k})` : `rgba(37,99,235,${0.18 * k})`);
      hz.addColorStop(1, "rgba(0,0,0,0)");
      bg.save();
      bg.translate(vx, yh);
      bg.scale(1, 0.32);
      bg.translate(-vx, -yh);
      bg.fillStyle = hz;
      bg.fillRect(0, yh - W, W, 2 * W);
      bg.restore();

      // The far field, baked. Awake tiles big enough to breathe go to the live canvas.
      breathing = [];
      const sleepFill = light ? "rgb(12,16,28)" : "rgb(148,163,184)";
      const sleepA = light ? 0.11 : 0.16;
      for (let row = 0; NEAR + row * STEP < FAR; row++) {
        const Z = NEAR + row * STEP;
        const ramp = Z >= DYN ? 1 : Z <= DYN - BLEND ? 0 : (Z - (DYN - BLEND)) / BLEND;
        if (ramp <= 0) continue;
        const fz = f / Z, y = yh + camH * fz, w = 0.54 * fz;
        if (y > H + 10 || w < 0.7) continue;
        const h = w * (camH / Math.sqrt(camH * camH + Z * Z)) * 0.9;
        const rowA = fog(Z) * foot(y) * ramp * k;
        if (rowA <= 0.01) continue;
        for (let X = Math.ceil((-20 - vx) / fz), X1 = Math.floor((W + 20 - vx) / fz); X <= X1; X++) {
          const x = vx + X * fz;
          if (hidden(x, y)) continue;
          const a = rowA * side(x) * away(x, y);
          if (a <= 0.01) continue;
          const r = hash(X, row);
          if (r < AWAKE) {
            const bright = r < BRIGHT, r2 = hash(X + 7919, row * 31 + 3);
            if (w >= BREATHE_MIN || bright) breathing.push({ x, y, w, h, a, bright, phase: r2 * Math.PI * 2, period: 3.5 + r2 * 5 });
            else tile(bg, x, y, w, h, a * 0.78, false); // its average breath
          } else {
            bg.globalAlpha = sleepA * a;
            bg.fillStyle = sleepFill;
            bg.beginPath();
            bg.roundRect(x - w / 2, y - h / 2, w, h, Math.min(w, h) * 0.22);
            bg.fill();
          }
        }
      }
      bg.globalAlpha = 1;
      // The field dissolves into the page at the foot of the stage
      bg.globalCompositeOperation = "destination-out";
      const cut = bg.createLinearGradient(0, H - 140, 0, H);
      cut.addColorStop(0, "rgba(0,0,0,0)");
      cut.addColorStop(1, "rgba(0,0,0,1)");
      bg.fillStyle = cut;
      bg.fillRect(0, H - 140, W, 140);
      bg.globalCompositeOperation = "source-over";
    };

    /** The live layer: near rows moved by how far the field has flowed, then every breathing tile. */
    const draw = (t: number) => {
      const still = mqStill.matches;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, top, W, H - top);
      const u = still ? 0 : (SPEED * t) / 1000;
      const shift = Math.floor(u / STEP), off = u - shift * STEP;
      const sleepA = light ? 0.11 : 0.16;
      ctx.fillStyle = light ? "rgb(12,16,28)" : "rgb(148,163,184)";
      near.length = 0;
      for (let row = 0; ; row++) {
        const Z = NEAR + row * STEP + off;
        if (Z >= DYN) break;
        const fz = f / Z, y = yh + camH * fz, w = 0.54 * fz;
        if (y > H + 10 || w < 0.7) continue;
        const h = w * (camH / Math.sqrt(camH * camH + Z * Z)) * 0.9;
        const rowA = fog(Z) * foot(y) * (Z <= DYN - BLEND ? 1 : (DYN - Z) / BLEND) * k;
        if (rowA <= 0.01) continue;
        const id = row - shift; // the same workspace keeps its id as it flows
        const behind = !!hide && y > hide.y0 && y < hide.y1;
        for (let X = Math.ceil((-20 - vx) / fz), X1 = Math.floor((W + 20 - vx) / fz); X <= X1; X++) {
          const x = vx + X * fz;
          if (behind && x > hide!.x0 && x < hide!.x1) continue;
          const a = rowA * side(x) * away(x, y);
          if (a <= 0.01) continue;
          const r = hash(X, id);
          if (r < AWAKE) {
            const r2 = hash(X + 7919, id * 31 + 3);
            near.push({ x, y, w, h, a, bright: r < BRIGHT, phase: r2 * Math.PI * 2, period: 3.5 + r2 * 5 });
          } else {
            ctx.globalAlpha = sleepA * a;
            if (w < 5) ctx.fillRect(x - w / 2, y - h / 2, w, h);
            else {
              ctx.beginPath();
              ctx.roundRect(x - w / 2, y - h / 2, w, h, Math.min(w, h) * 0.22);
              ctx.fill();
            }
          }
        }
      }
      for (const s of breathing) tile(ctx, s.x, s.y, s.w, s.h, s.a * (still ? 1 : breath(t, s.phase, s.period)), s.bright);
      for (const s of near) tile(ctx, s.x, s.y, s.w, s.h, s.a * (still ? 1 : breath(t, s.phase, s.period)), s.bright);
      ctx.globalAlpha = 1;
    };

    const loop = (t: number) => {
      raf = 0;
      if (!inView || mqStill.matches || document.hidden) return;
      if (t - last > FRAME) { draw(t); last = t; }
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (!raf && inView && !mqStill.matches && !document.hidden) raf = requestAnimationFrame(loop);
    };
    const redraw = () => { build(); draw(performance.now()); start(); };

    redraw();
    let pending = 0;
    const ro = new ResizeObserver(() => { cancelAnimationFrame(pending); pending = requestAnimationFrame(redraw); });
    ro.observe(stage);
    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; start(); });
    io.observe(stage);
    document.addEventListener("visibilitychange", start);
    mqDark.addEventListener("change", redraw);
    mqStill.addEventListener("change", redraw);
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(pending);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", start);
      mqDark.removeEventListener("change", redraw);
      mqStill.removeEventListener("change", redraw);
    };
  }, [quiet]);

  return (
    <>
      <canvas ref={baseRef} className="agent-field" aria-hidden="true" />
      <canvas ref={liveRef} className="agent-field" aria-hidden="true" />
    </>
  );
}
