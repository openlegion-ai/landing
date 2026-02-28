"use client";

import Image from "next/image";
import { Github, ArrowRight } from "lucide-react";
import { AnimateIn } from "@/components/ui/animate-in";
import { Counter } from "@/components/ui/counter";
import { GITHUB_URL, DISCORD_URL } from "@/lib/constants";

export function CTA() {
  return (
    <section className="relative overflow-hidden px-6 py-24 md:px-8 md:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-accent/[0.03] via-accent/[0.015] to-transparent" aria-hidden="true" />
      <div className="absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-accent/30 to-transparent" aria-hidden="true" />

      <div className="relative mx-auto max-w-3xl text-center">
        <AnimateIn>
          <div className="mb-8 flex justify-center">
            <Image
              src="/logo.png"
              alt=""
              width={56}
              height={56}
              sizes="56px"
              className="rounded-full opacity-80"
              aria-hidden="true"
            />
          </div>
        </AnimateIn>
        <AnimateIn delay={0.06}>
          <h2 className="mb-5 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Ready to deploy{" "}
            <span className="gradient-text">secure agent fleets</span>?
          </h2>
        </AnimateIn>
        <AnimateIn delay={0.12}>
          <p className="mx-auto mb-8 max-w-xl text-lg text-muted">
            Zero external dependencies. Clone, install, deploy — your first
            fleet in under 60 seconds.
          </p>
        </AnimateIn>

        {/* Reinforcement stats */}
        <AnimateIn delay={0.16}>
          <div className="mx-auto mb-10 flex max-w-md items-center justify-center gap-6 text-sm text-muted sm:gap-8">
            <div className="text-center">
              <div className="font-mono text-lg font-bold text-foreground">
                <Counter target={1607} />
              </div>
              <div className="text-xs">Tests</div>
            </div>
            <div className="h-8 w-px bg-border/50" aria-hidden="true" />
            <div className="text-center">
              <div className="font-mono text-lg font-bold text-foreground">
                <Counter target={100} suffix="+" />
              </div>
              <div className="text-xs">LLM Providers</div>
            </div>
            <div className="h-8 w-px bg-border/50" aria-hidden="true" />
            <div className="text-center">
              <div className="font-mono text-lg font-bold text-foreground">
                <Counter target={25} prefix="~" suffix="k" />
              </div>
              <div className="text-xs">Lines of Code</div>
            </div>
          </div>
        </AnimateIn>

        <AnimateIn delay={0.2}>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-shine btn-glow flex w-full items-center justify-center gap-2.5 rounded-xl bg-accent px-7 py-3.5 text-sm font-semibold text-white sm:w-auto"
            >
              <Github className="h-4 w-4" aria-hidden="true" />
              Get the Code
            </a>
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-7 py-3.5 text-sm font-semibold text-foreground transition-all hover:border-accent/40 hover:bg-accent/5 sm:w-auto"
            >
              Join our Discord
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
