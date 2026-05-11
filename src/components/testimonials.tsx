"use client";

import { Star } from "lucide-react";
import { AnimateIn, StaggerContainer, StaggerItem } from "@/components/ui/animate-in";

// =============================================================================
// PLACEHOLDER TESTIMONIALS — swap for real customer quotes ASAP.
//
// Voice targets non-technical entrepreneurs and SMB operators (the real
// audience), with one tech-flavored quote to retain credibility with
// developer browsers. Replace each entry with a real customer the moment
// you can — even one real quote outperforms three perfect-looking fakes.
// Initials → swap to real names. Roles → swap to real titles. Companies →
// swap to real company names (or "Solo Operator" / "Independent Consultant"
// if the customer prefers anonymity).
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
      "I run a marketing agency. Five lead-research agents were working by day two — they do in a day what my interns did in a week. I describe what I want in plain English; they figure out the rest.",
    name: "Sarah M.",
    role: "Founder",
    company: "[Marketing Agency]",
    initials: "SM",
  },
  {
    quote:
      "Replaced two virtual assistants and a $400/mo automation stack. My team handles email triage, lead enrichment, and follow-ups end-to-end. I focus on closing deals now, not chasing them.",
    name: "David C.",
    role: "Solo Consultant",
    company: "Sales Coaching",
    initials: "DC",
  },
  {
    quote:
      "I'm not a developer. Set everything up over coffee one morning. Two months in, our agent fleet runs our entire ops back-office — invoicing, research, content drafts, all of it.",
    name: "Priya P.",
    role: "Operations Lead",
    company: "[Consulting Firm]",
    initials: "PP",
  },
];

export function Testimonials() {
  return (
    <section
      aria-labelledby="testimonials-heading"
      className="relative px-5 py-16 sm:px-6 md:px-8 md:py-20"
    >
      <div className="mx-auto max-w-6xl">
        <AnimateIn>
          <div className="mb-10 text-center md:mb-12">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">
              From our customers
            </p>
            <h2
              id="testimonials-heading"
              className="text-balance text-3xl font-bold tracking-tight md:text-4xl"
            >
              Real teams, running on autopilot
            </h2>
          </div>
        </AnimateIn>

        <StaggerContainer className="grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <StaggerItem key={i}>
              <figure className="card-hover gradient-border glass-shine group flex h-full flex-col rounded-2xl border border-border/50 glass-card p-6">
                <div
                  className="mb-3 flex items-center gap-0.5 text-amber-400"
                  aria-label="5 out of 5 stars"
                >
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="h-4 w-4" fill="currentColor" aria-hidden="true" />
                  ))}
                </div>
                <blockquote className="flex-1 text-sm leading-relaxed text-foreground/90">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-border/40 pt-4">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent-light"
                    aria-hidden="true"
                  >
                    {t.initials}
                  </span>
                  <div className="min-w-0 leading-tight">
                    <div className="truncate text-sm font-semibold text-foreground">{t.name}</div>
                    <div className="truncate text-xs text-muted">
                      {t.role} · {t.company}
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
