"use client";

import { useEffect, useRef } from "react";

/**
 * The ground of the page atmosphere: a field of customer workspaces receding
 * to a horizon. Most tiles sleep; the awake ones (an agent working) glow blue
 * and slowly wake and sleep, each on its own cycle.
 *
 * Place it as the first child of a `.stage`. It lays itself out from two
 * marked elements in that stage:
 * - `[data-field-anchor]`: the product the field sits behind (the horizon runs
 *   behind its lower half and the field converges on it). Without one, the
 *   field is centred under the copy.
 * - `[data-field-copy]`: the text block, which is always kept clear.
 * - `[data-field-clear]`: any other small text over the field (captions), also kept clear.
 *
 * It pauses out of view and in hidden tabs, draws one still frame under
 * reduced motion, and redraws when the system theme changes.
 */
type Tile = { x: number; y: number; w: number; h: number; a: number; bright: boolean; phase: number; period: number };

export function AgentField({ quiet = false }: { quiet?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    const stage = cv?.parentElement;
    const ctx = cv?.getContext("2d");
    if (!cv || !stage || !ctx) return;

    const mqDark = window.matchMedia("(prefers-color-scheme: dark)");
    const mqStill = window.matchMedia("(prefers-reduced-motion: reduce)");
    const k = quiet ? 0.62 : 1;
    let awake: Tile[] = [];
    let base: HTMLCanvasElement | null = null;
    let glow: HTMLCanvasElement | null = null;
    let W = 0, H = 0, dpr = 1, raf = 0, last = 0, inView = true;

    const sprite = (rgb: string) => {
      const c = document.createElement("canvas");
      c.width = c.height = 64;
      const g = c.getContext("2d");
      if (!g) return null;
      const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      r.addColorStop(0, `rgba(${rgb},1)`);
      r.addColorStop(0.35, `rgba(${rgb},.35)`);
      r.addColorStop(1, `rgba(${rgb},0)`);
      g.fillStyle = r; g.fillRect(0, 0, 64, 64);
      return c;
    };

    const build = () => {
      const light = !mqDark.matches;
      const sr = stage.getBoundingClientRect();
      W = stage.clientWidth; H = stage.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      glow = sprite(light ? "37,99,235" : "96,165,250");

      const copyEl = stage.querySelector("[data-field-copy]");
      const anchorEl = stage.querySelector("[data-field-anchor]");
      const copy = copyEl?.getBoundingClientRect();
      const anchor = anchorEl?.getBoundingClientRect();
      // Stacked when the product sits under the copy rather than beside it.
      const stacked = !anchor || !copy || anchor.top >= copy.bottom - 8;
      const vx = anchor && !stacked ? anchor.left - sr.left + anchor.width / 2 : W / 2;
      const yh = anchor && !stacked
        ? anchor.top - sr.top + anchor.height * 0.52
        : (copy ? copy.bottom - sr.top : H * 0.6) + (anchor ? 28 : 72);
      const f = W < 640 ? 46 : stacked ? 64 : 96;
      // the field fades faster toward the copy's side (the left, or the right in RTL)
      const copyFirst = !anchor || !copy || copy.left < anchor.left;
      const near = 2.2;
      const camH = (Math.max(H - yh, 120) + 30) * near / f;
      const box = (r: DOMRect, pad: number) => ({ x0: r.left - sr.left - pad, x1: r.right - sr.left + pad, y0: r.top - sr.top - pad, y1: r.bottom - sr.top + pad, soft: pad * 2 });
      const clears = [
        ...(copy ? [box(copy, 44)] : []),
        ...[...stage.querySelectorAll("[data-field-clear]")].map((el) => box(el.getBoundingClientRect(), 10)),
      ];

      base = document.createElement("canvas");
      base.width = cv.width; base.height = cv.height;
      const g = base.getContext("2d");
      if (!g) return;
      g.scale(dpr, dpr);

      // Horizon light where the field meets the sky, brightest under the product
      const hz = g.createRadialGradient(vx, yh, 0, vx, yh, W * 0.55);
      hz.addColorStop(0, light ? `rgba(96,165,250,${0.38 * k})` : `rgba(59,130,246,${0.55 * k})`);
      hz.addColorStop(0.35, light ? `rgba(147,197,253,${0.16 * k})` : `rgba(37,99,235,${0.18 * k})`);
      hz.addColorStop(1, "rgba(0,0,0,0)");
      g.save(); g.translate(vx, yh); g.scale(1, 0.32); g.translate(-vx, -yh);
      g.fillStyle = hz; g.fillRect(0, yh - W, W, 2 * W); g.restore();

      let seed = 7;
      const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      awake = [];
      const sleepFill = light ? "12,16,28" : "148,163,184";
      const sleepA = light ? 0.11 : 0.16;
      for (let Z = near; Z < 56; Z += 0.5) {
        const half = Math.ceil((W / f) * Z) + 2;
        for (let X = -half; X <= half; X += 1) {
          const r = rnd(), r2 = rnd();
          const x = vx + (X / Z) * f, y = yh + (camH / Z) * f;
          if (x < -20 || x > W + 20 || y > H + 10) continue;
          const w = (0.54 / Z) * f;
          if (w < 0.7) continue;
          const h = w * (camH / Math.hypot(camH, Z)) * 0.9;
          const fog = Math.min(1, Math.max(0, (Z - near) / 2.5)) * Math.max(0, 1 - Z / 56);
          const dx = (x - vx) / W, side = stacked ? 1.3 : (dx < 0) === copyFirst ? 2.3 : 0.9;
          const lateral = Math.max(0, 1 - Math.pow(Math.abs(dx) * side * 1.25, 1.6));
          let away = 1;
          for (const c of clears) {
            const ox = Math.max(c.x0 - x, 0, x - c.x1), oy = Math.max(c.y0 - y, 0, y - c.y1);
            away = Math.min(away, Math.hypot(ox, oy) / c.soft);
          }
          const a = fog * lateral * away * k;
          if (a <= 0.01) continue;
          if (r < 0.1) {
            awake.push({ x, y, w, h, a, bright: r < 0.016, phase: r2 * Math.PI * 2, period: 5 + r2 * 6 });
          } else {
            g.fillStyle = `rgba(${sleepFill},${sleepA * a})`;
            g.beginPath(); g.roundRect(x - w / 2, y - h / 2, w, h, Math.min(w, h) * 0.22); g.fill();
          }
        }
      }
      // The field dissolves into the page at the foot of the stage
      g.globalCompositeOperation = "destination-out";
      const cut = g.createLinearGradient(0, H - 140, 0, H);
      cut.addColorStop(0, "rgba(0,0,0,0)");
      cut.addColorStop(1, "rgba(0,0,0,1)");
      g.fillStyle = cut; g.fillRect(0, H - 140, W, 140);
      g.globalCompositeOperation = "source-over";
    };

    const draw = (t: number) => {
      if (!base) return;
      const light = !mqDark.matches;
      const still = mqStill.matches;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(base, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const fadeFrom = H - 140;
      for (const tile of awake) {
        const breath = still ? 1 : 0.55 + 0.45 * Math.pow(Math.sin((t / 1000 / tile.period) * Math.PI * 2 + tile.phase) * 0.5 + 0.5, 2);
        const foot = tile.y > fadeFrom ? Math.max(0, 1 - (tile.y - fadeFrom) / 140) : 1;
        const a = tile.a * breath * foot;
        if (a <= 0.01) continue;
        if (glow) {
          const s = Math.max(tile.w * 3.2, tile.bright ? 34 : 16);
          ctx.globalAlpha = a * (tile.bright ? 0.75 : 0.4);
          ctx.globalCompositeOperation = light ? "source-over" : "lighter";
          ctx.drawImage(glow, tile.x - s / 2, tile.y - s / 2, s, s);
          ctx.globalCompositeOperation = "source-over";
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = light
          ? `rgba(37,99,235,${(tile.bright ? 0.85 : 0.5) * a})`
          : `rgba(${tile.bright ? "191,219,254" : "96,165,250"},${(tile.bright ? 1 : 0.72) * a})`;
        ctx.beginPath(); ctx.roundRect(tile.x - tile.w / 2, tile.y - tile.h / 2, tile.w, tile.h, Math.min(tile.w, tile.h) * 0.22); ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const loop = (t: number) => {
      raf = 0;
      if (!inView || mqStill.matches || document.hidden) return;
      if (t - last > 40) { draw(t); last = t; } // about 24 fps: plenty for a slow breath
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
      cancelAnimationFrame(raf); cancelAnimationFrame(pending);
      ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", start);
      mqDark.removeEventListener("change", redraw);
      mqStill.removeEventListener("change", redraw);
    };
  }, [quiet]);

  return <canvas ref={ref} className="agent-field" aria-hidden="true" />;
}
