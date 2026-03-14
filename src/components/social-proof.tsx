"use client";

import { useState, useEffect } from "react";
import { Github } from "lucide-react";
import { AnimateIn } from "@/components/ui/animate-in";
import { Counter } from "@/components/ui/counter";
import { DISCORD_URL, GITHUB_URL } from "@/lib/constants";

interface StatDef {
  target: number;
  prefix?: string;
  suffix?: string;
  fallback: string;
  label: string;
}

const STATS: StatDef[] = [
  { target: 2100, suffix: "+", fallback: "2,100+", label: "tests passing" },
  { target: 100, suffix: "+", fallback: "100+", label: "LLM providers supported" },
  { target: 0, suffix: "", fallback: "0", label: "CVEs reported" },
  { target: 0, prefix: "$", suffix: "", fallback: "$0", label: "markup on LLM usage" },
];

export function SocialProof() {
  const [stars, setStars] = useState<string | null>(null);

  useEffect(() => {
    fetch("https://api.github.com/repos/openlegion-ai/openlegion")
      .then((r) => r.json())
      .then((data) => {
        const count = data.stargazers_count;
        if (typeof count === "number") {
          setStars(count >= 1000 ? (count / 1000).toFixed(1) + "k" : String(count));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="relative px-6 py-16 md:px-8 md:py-20">
      <div className="absolute inset-0 bg-accent/[0.015]" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl">
        <AnimateIn>
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-8 sm:gap-x-14">
            {STATS.map((stat) => (
              <div key={stat.label} className="min-w-[100px] text-center">
                <div className="mb-1 font-mono text-3xl font-bold text-foreground md:text-4xl">
                  {stat.target > 0 ? (
                    <Counter target={stat.target} prefix={stat.prefix} suffix={stat.suffix} />
                  ) : (
                    <span>{stat.fallback}</span>
                  )}
                </div>
                <div className="text-sm text-muted">{stat.label}</div>
              </div>
            ))}
            {stars && (
              <div className="min-w-[100px] text-center">
                <div className="mb-1 font-mono text-3xl font-bold text-foreground md:text-4xl">
                  {stars}
                </div>
                <div className="text-sm text-muted">GitHub stars</div>
              </div>
            )}
          </div>
        </AnimateIn>

        <AnimateIn delay={0.1}>
          <div className="mt-10 flex items-center justify-center gap-4">
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full border border-border/40 bg-card/30 px-4 py-2 text-[13px] font-medium text-muted transition-colors hover:border-accent/30 hover:text-foreground"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
              </svg>
              Discord
            </a>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full border border-border/40 bg-card/30 px-4 py-2 text-[13px] font-medium text-muted transition-colors hover:border-accent/30 hover:text-foreground"
            >
              <Github className="h-3.5 w-3.5" aria-hidden="true" />
              GitHub
            </a>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
