"use client";

import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { AnimateIn, StaggerContainer, StaggerItem } from "@/components/ui/animate-in";

// Real customer quotes. The quote/role/company are pulled from translations
// so each locale can adapt phrasing naturally; the name and initials stay the
// same across locales because they identify the customer, not free-form text.
const TESTIMONIAL_KEYS = ["0", "1", "2"] as const;
const TESTIMONIAL_NAMES = [
  { name: "Elena V.", initials: "EV" },
  { name: "David P.", initials: "DP" },
  { name: "Amara O.", initials: "AO" },
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
          {TESTIMONIAL_KEYS.map((key, i) => {
            const { name, initials } = TESTIMONIAL_NAMES[i];
            return (
              <StaggerItem key={key}>
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
                    &ldquo;{t(`items.${key}.quote`)}&rdquo;
                  </blockquote>
                  <figcaption className="mt-5 flex items-center gap-3 border-t border-border/40 pt-4">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent-light"
                      aria-hidden="true"
                    >
                      {initials}
                    </span>
                    <div className="min-w-0 leading-tight">
                      <div className="truncate text-sm font-semibold text-foreground">{name}</div>
                      <div className="truncate text-xs text-muted">
                        {t(`items.${key}.role`)} · {t(`items.${key}.company`)}
                      </div>
                    </div>
                  </figcaption>
                </figure>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
