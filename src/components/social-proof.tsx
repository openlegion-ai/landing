"use client";

import { useState, useEffect } from "react";
import { AnimateIn } from "@/components/ui/animate-in";
import { DISCORD_URL, GITHUB_URL } from "@/lib/constants";

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

  const stats = [
    { number: "2,100+", label: "tests passing" },
    { number: "100+", label: "LLM providers supported" },
    { number: "0", label: "CVEs reported" },
    { number: "$0", label: "markup on LLM usage" },
    ...(stars ? [{ number: stars, label: "GitHub stars" }] : []),
  ];

  return (
    <section className="relative px-6 py-16 md:px-8 md:py-20">
      <div className="absolute inset-0 bg-accent/[0.015]" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl">
        <AnimateIn>
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-8 sm:gap-x-14">
            {stats.map((stat) => (
              <div key={stat.label} className="min-w-[100px] text-center">
                <div className="mb-1 font-mono text-3xl font-bold text-foreground md:text-4xl">
                  {stat.number}
                </div>
                <div className="text-sm text-muted">{stat.label}</div>
              </div>
            ))}
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
              Discord →
            </a>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full border border-border/40 bg-card/30 px-4 py-2 text-[13px] font-medium text-muted transition-colors hover:border-accent/30 hover:text-foreground"
            >
              GitHub →
            </a>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
