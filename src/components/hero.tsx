"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AnimateIn } from "@/components/ui/animate-in";
import { WAITLIST_URL } from "@/lib/constants";
import { trackCtaClick } from "@/lib/analytics";

const PARTICLES = [
  { top: "12%", left: "8%", size: 4, color: "bg-accent/30", duration: "7s", delay: "0s" },
  { top: "25%", left: "85%", size: 3, color: "bg-accent-light/25", duration: "9s", delay: "1s" },
  { top: "65%", left: "12%", size: 5, color: "bg-accent-bright/20", duration: "11s", delay: "2s" },
  { top: "78%", left: "90%", size: 3, color: "bg-accent/20", duration: "8s", delay: "3s" },
  { top: "40%", left: "5%", size: 4, color: "bg-accent-light/25", duration: "10s", delay: "1.5s" },
  { top: "55%", left: "92%", size: 3, color: "bg-accent-bright/20", duration: "12s", delay: "0.5s" },
];

const TRUST_KEYS = ["0", "1", "2"] as const;

export function Hero() {
  const t = useTranslations("hero");

  return (
    <section
      id="hero"
      aria-label={t("ariaLabel")}
      className="relative flex min-h-[calc(100dvh-96px)] items-center overflow-hidden px-6 md:px-8"
    >
      <div className="hero-glow" aria-hidden="true" />
      <div className="hero-orb-3" aria-hidden="true" />
      <div className="dot-pattern absolute inset-0 opacity-50" aria-hidden="true" />

      {/* Floating particles */}
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className={`floating-particle ${p.color}`}
          style={{
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
            "--duration": p.duration,
            "--delay": p.delay,
            "--opacity": "0.3",
          } as React.CSSProperties}
          aria-hidden="true"
        />
      ))}

      <div className="relative z-10 mx-auto w-full max-w-6xl pt-12 pb-8 sm:pt-16 sm:pb-12">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          {/* Left: text content */}
          <div className="text-center lg:text-left">
            <AnimateIn scale>
              <div className="badge-shimmer mb-6 inline-flex items-center rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-sm font-medium text-accent-light backdrop-blur-sm">
                {t("badge")}
              </div>
            </AnimateIn>

            <AnimateIn delay={0.06} scale>
              <h1 className="mb-2 text-[2rem] font-extrabold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-[3rem] xl:text-[3.25rem]">
                {t("headingLine1")}<span className="gradient-text-animated">{t("headingHighlight")}</span>
                <br />
                {t("headingLine2")}
              </h1>
              <p className="mb-5 text-base font-medium tracking-tight text-muted/60 sm:text-lg md:text-xl">
                {t("tagline")}
              </p>
            </AnimateIn>

            <AnimateIn delay={0.1}>
              <p className="mx-auto mb-6 max-w-2xl text-lg leading-relaxed text-muted lg:mx-0">
                {t("subtitle")}
              </p>
            </AnimateIn>

            <AnimateIn delay={0.14}>
              <div id="hero-cta" className="flex flex-col items-center sm:flex-row sm:justify-center lg:justify-start">
                <Link
                  href={WAITLIST_URL}
                  onClick={() => trackCtaClick({ location: "hero_primary" })}
                  className="group/btn btn-shine btn-glow btn-gradient flex w-full items-center justify-center gap-2.5 rounded-xl px-7 py-3.5 text-sm font-semibold text-white sm:w-auto"
                >
                  {t("ctaPrimary")}
                </Link>
              </div>
              <p className="mt-4 text-center text-[13px] text-muted lg:text-left">
                {TRUST_KEYS.map((key, i) => (
                  <span key={key}>
                    {i > 0 && " · "}
                    {t(`trustStrip.${key}`)}
                  </span>
                ))}
              </p>
            </AnimateIn>
          </div>

          {/* Right: product frame — a workspace thread, one sentence in,
              a standing agent and its first approval card out. Static by
              decision: the old demo.mp4 showed the retired VPS product. */}
          <AnimateIn delay={0.18}>
            <div className="mx-auto max-w-lg lg:max-w-none">
              <div className="terminal terminal-hero">
                <div className="terminal-header">
                  <div className="terminal-dot bg-[#ff5f57]" />
                  <div className="terminal-dot bg-[#febc2e]" />
                  <div className="terminal-dot bg-[#28c840]" />
                  <span className="ml-2 font-mono text-xs text-muted/50">
                    {t("terminalTitle")}
                  </span>
                </div>

                <div className="space-y-4 p-5 text-start md:p-6">
                  <div>
                    <p className="mb-1 font-mono text-[11px] uppercase tracking-wider text-muted/60">
                      {t("frame.youLabel")}
                    </p>
                    <p className="text-[13px] leading-relaxed text-foreground/90">
                      {t("frame.prompt")}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 font-mono text-[11px] uppercase tracking-wider text-accent-light/80">
                      {t("frame.assistantLabel")}
                    </p>
                    <p className="text-[13px] leading-relaxed text-foreground/90">
                      {t("frame.reply")}
                    </p>
                  </div>

                  <div className="rounded-lg border border-border bg-card p-3.5">
                    <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted/60">
                      {t("frame.taskLabel")}
                    </p>
                    <p className="text-[13px] font-semibold text-foreground">
                      {t("frame.taskTitle")}
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-muted">
                      {t("frame.taskMeta")}
                    </p>
                  </div>

                  <div className="rounded-lg border border-accent/30 bg-accent/[0.08] p-3.5">
                    <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-accent-light">
                      {t("frame.approvalLabel")}
                    </p>
                    <p className="text-[13px] text-foreground/90">
                      {t("frame.approvalBody")}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2" aria-hidden="true">
                      <span className="rounded-md bg-accent px-3 py-1 text-[11px] font-semibold text-white">
                        {t("frame.approveLabel")}
                      </span>
                      <span className="rounded-md border border-border px-3 py-1 text-[11px] font-medium text-muted">
                        {t("frame.denyLabel")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-center text-sm text-muted/70">
                {t("frame.caption")}
              </p>
            </div>
          </AnimateIn>
        </div>

      </div>

      {/* Scroll cue at bottom of hero — hidden on mobile to avoid overlap */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-muted/30 hidden sm:block" aria-hidden="true">
        <div className="scroll-mouse" />
      </div>
    </section>
  );
}
