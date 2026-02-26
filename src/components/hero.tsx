"use client";

import { useRef, useEffect } from "react";
import { Github, ChevronRight } from "lucide-react";
import { AnimateIn } from "@/components/ui/animate-in";
import { Counter } from "@/components/ui/counter";
import { HERO, GITHUB_URL } from "@/lib/constants";

export function Hero({ stars = 0 }: { stars?: number }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reducedMotion) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="hero"
      aria-label="Introduction"
      className="relative flex min-h-[100dvh] items-center overflow-hidden px-6 md:px-8"
    >
      <div className="hero-glow" aria-hidden="true" />
      <div className="grid-pattern absolute inset-0 opacity-50" aria-hidden="true" />

      <div className="relative z-10 mx-auto w-full max-w-6xl pt-24 pb-12">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          {/* Left: text content */}
          <div className="text-center lg:text-left">
            <AnimateIn>
              <div className="mb-6 inline-flex items-center rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-sm font-medium text-accent-light backdrop-blur-sm">
                {HERO.badge}
              </div>
            </AnimateIn>

            <AnimateIn delay={0.06}>
              <h1 className="mb-5 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl xl:text-6xl">
                {HERO.titleLine1}
                <br />
                <span className="gradient-text">{HERO.titleAccent}</span>
              </h1>
            </AnimateIn>

            <AnimateIn delay={0.12}>
              <p className="mx-auto mb-8 max-w-xl text-lg leading-relaxed text-muted lg:mx-0">
                {HERO.subtitle}
              </p>
            </AnimateIn>

            <AnimateIn delay={0.18}>
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <a
                  href="#quickstart"
                  className="btn-shine btn-glow flex w-full items-center justify-center gap-2.5 rounded-xl bg-accent px-7 py-3.5 text-sm font-semibold text-white sm:w-auto"
                >
                  {HERO.ctaPrimary}
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </a>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-7 py-3.5 text-sm font-semibold text-foreground transition-all hover:border-accent/40 hover:bg-accent/5 sm:w-auto"
                >
                  <Github className="h-4 w-4" aria-hidden="true" />
                  {HERO.ctaSecondary}
                  {stars > 0 && (
                    <>
                      <span
                        className="mx-1 h-3.5 w-px bg-border/60"
                        aria-hidden="true"
                      />
                      <span className="tabular-nums text-muted">
                        {stars.toLocaleString()}
                      </span>
                    </>
                  )}
                </a>
              </div>
            </AnimateIn>
          </div>

          {/* Right: video demo */}
          <AnimateIn delay={0.2}>
            <div className="mx-auto max-w-lg lg:max-w-none">
              <div className="terminal">
                <div className="terminal-header">
                  <div className="terminal-dot bg-[#ff5f57]" />
                  <div className="terminal-dot bg-[#febc2e]" />
                  <div className="terminal-dot bg-[#28c840]" />
                  <span className="ml-2 font-mono text-xs text-muted/50">
                    openlegion demo
                  </span>
                </div>
                <video
                  ref={videoRef}
                  src="/demo.mp4"
                  muted
                  loop
                  playsInline
                  controls
                  preload="metadata"
                  className="w-full"
                >
                  <p>Your browser does not support HTML5 video.</p>
                </video>
              </div>
            </div>
          </AnimateIn>
        </div>

        {/* Stats — full width below both columns */}
        <AnimateIn delay={0.32}>
          <div className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-6 sm:gap-8 lg:mt-20 lg:max-w-none">
            {HERO.stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div
                  className="mb-1 font-mono text-2xl font-bold text-foreground sm:text-3xl md:text-4xl"
                  aria-label={`${stat.prefix}${stat.value}${stat.suffix} ${stat.label}`}
                >
                  <Counter
                    target={stat.value}
                    suffix={stat.suffix}
                    prefix={stat.prefix}
                  />
                </div>
                <div className="text-xs text-muted sm:text-sm">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
