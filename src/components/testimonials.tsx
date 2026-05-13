"use client";

import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { AnimateIn, StaggerContainer, StaggerItem } from "@/components/ui/animate-in";

// =============================================================================
// IMPORTANT: These testimonials are NOT from real customers — they are
// realistic-looking stand-ins modeled on the kinds of outcomes our target
// audience (non-technical entrepreneurs and SMB operators) tends to care
// about. Names, companies, and figures are fictional. Swap each entry for
// a real customer quote the moment you have one — a single real quote
// will outperform three polished fictional ones.
// =============================================================================
interface Testimonial {
  quote: string;
  name: string;
  role: string;
  company: string;
  initials: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "We were spending $2,800/mo on a lead-research VA team. Replaced the whole thing with five OpenLegion agents in three days. They run 24/7, never call in sick, and frankly do better research than the humans did.",
    name: "Elena V.",
    role: "Founder",
    company: "Marketing Agency",
    initials: "EV",
  },
  {
    quote:
      "I'm not technical at all. I wrote what I wanted in plain English - “follow up with leads who haven't replied in five days, sound friendly not pushy” - and the agent figured the rest out. Closed three deals this quarter from that one workflow.",
    name: "David P.",
    role: "Sales Coach",
    company: "Independent",
    initials: "DP",
  },
  {
    quote:
      "Two months in, the fleet runs our invoicing, content drafts, and customer research end-to-end. We saved enough on freelance hours to pay for Pro Max twice over. The hardest part was deciding what to automate first.",
    name: "Amara O.",
    role: "Head of Operations",
    company: "Creative Studio",
    initials: "AO",
  },
];

export function Testimonials() {
  const t = useTranslations("testimonials");
  return (
    <section
      aria-labelledby="testimonials-heading"
      className="relative px-5 py-16 sm:px-6 md:px-8 md:py-20"
    >
      <div className="mx-auto max-w-6xl">
        <AnimateIn>
          <div className="mb-10 text-center md:mb-12">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">
              {t("eyebrow")}
            </p>
            <h2
              id="testimonials-heading"
              className="text-balance text-3xl font-bold tracking-tight md:text-4xl"
            >
              {t("heading")}
            </h2>
          </div>
        </AnimateIn>

        <StaggerContainer className="grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((item, i) => (
            <StaggerItem key={i}>
              <figure className="card-hover gradient-border glass-shine group flex h-full flex-col rounded-2xl border border-border/50 glass-card p-6">
                <div
                  className="mb-3 flex items-center gap-0.5 text-amber-400"
                  aria-label={t("starsAriaLabel")}
                >
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="h-4 w-4" fill="currentColor" aria-hidden="true" />
                  ))}
                </div>
                <blockquote className="flex-1 text-sm leading-relaxed text-foreground/90">
                  &ldquo;{item.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-border/40 pt-4">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent-light"
                    aria-hidden="true"
                  >
                    {item.initials}
                  </span>
                  <div className="min-w-0 leading-tight">
                    <div className="truncate text-sm font-semibold text-foreground">{item.name}</div>
                    <div className="truncate text-xs text-muted">
                      {item.role} · {item.company}
                    </div>
                  </div>
                </figcaption>
              </figure>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
