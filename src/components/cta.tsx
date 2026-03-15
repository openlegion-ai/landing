"use client";

import { ArrowRight } from "lucide-react";
import { AnimateIn } from "@/components/ui/animate-in";
import { APP_URL, DISCORD_URL } from "@/lib/constants";

const CTA_PARTICLES = [
  { top: "15%", left: "10%", size: 3, duration: "9s", delay: "0s" },
  { top: "70%", left: "85%", size: 4, duration: "11s", delay: "1.5s" },
  { top: "30%", left: "90%", size: 3, duration: "8s", delay: "0.5s" },
  { top: "80%", left: "15%", size: 4, duration: "10s", delay: "2s" },
];

export function CTA() {
  return (
    <section className="cta-mesh relative overflow-hidden px-6 py-24 md:px-8 md:py-32">
      {/* Top divider */}
      <div
        className="absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-accent/30 to-transparent"
        aria-hidden="true"
      />

      {/* Floating particles */}
      {CTA_PARTICLES.map((p, i) => (
        <div
          key={i}
          className="floating-particle bg-accent/20"
          style={{
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
            "--duration": p.duration,
            "--delay": p.delay,
            "--opacity": "0.25",
          } as React.CSSProperties}
          aria-hidden="true"
        />
      ))}

      <div className="relative mx-auto max-w-3xl text-center">
        <AnimateIn scale>
          <h2 className="mb-5 text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Your AI team is one{" "}
            <span className="gradient-text-animated">deploy away</span>.
          </h2>
        </AnimateIn>
        <AnimateIn delay={0.06}>
          <p className="mb-8 text-[13px] text-muted">
            7-day free trial · No credit card required · 100+ LLM providers · No vendor lock-in
          </p>
        </AnimateIn>

        <AnimateIn delay={0.14}>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group/btn btn-shine btn-glow btn-gradient flex w-full items-center justify-center gap-2.5 rounded-xl px-7 py-3.5 text-sm font-semibold text-white sm:w-auto"
            >
              Start free trial →
            </a>
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex w-full items-center justify-center gap-2 rounded-xl border border-border px-7 py-3.5 text-sm font-semibold text-foreground transition-all hover:border-accent/40 hover:bg-accent/5 sm:w-auto"
            >
              Join our Discord
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </a>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
