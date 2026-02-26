"use client";

import { AlertTriangle, X, Check } from "lucide-react";
import { SectionWrapper } from "@/components/ui/section-wrapper";
import { AnimateIn } from "@/components/ui/animate-in";
import { COMPARISON_ALERT, COMPARISON_ROWS } from "@/lib/constants";

export function Comparison() {
  return (
    <SectionWrapper id="comparison">
      <AnimateIn>
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-danger">
            Comparison
          </p>
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            {COMPARISON_ALERT.title}
          </h2>
        </div>
      </AnimateIn>

      <AnimateIn delay={0.08}>
        <div className="mb-8 rounded-xl border border-danger/20 bg-danger/[0.03] p-5 md:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-danger/10">
              <AlertTriangle className="h-4.5 w-4.5 text-danger" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm leading-relaxed text-foreground/90">
                {COMPARISON_ALERT.description}
              </p>
              <p className="mt-2 text-xs text-muted">{COMPARISON_ALERT.source}</p>
            </div>
          </div>
        </div>
      </AnimateIn>

      <AnimateIn delay={0.16}>
        <div className="overflow-x-auto rounded-xl border border-border/50 bg-card/40">
          <table className="w-full min-w-[540px] text-sm">
            <caption className="sr-only">
              Feature comparison between OpenClaw and OpenLegion
            </caption>
            <thead>
              <tr className="border-b border-border/50">
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted sm:px-6 sm:py-4">
                  Aspect
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-danger/70 sm:px-6 sm:py-4">
                  OpenClaw & Others
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-success/70 sm:px-6 sm:py-4">
                  OpenLegion
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, i) => (
                <tr
                  key={row.aspect}
                  className={
                    i < COMPARISON_ROWS.length - 1
                      ? "border-b border-border/30"
                      : ""
                  }
                >
                  <td className="px-4 py-3.5 font-medium text-foreground sm:px-6 sm:py-4">
                    {row.aspect}
                  </td>
                  <td className="px-4 py-3.5 sm:px-6 sm:py-4">
                    <span className="flex items-center gap-2 text-muted/80">
                      <X className="h-3.5 w-3.5 shrink-0 text-danger/50" aria-hidden="true" />
                      <span>{row.them}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3.5 sm:px-6 sm:py-4">
                    <span className="flex items-center gap-2 text-success">
                      <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>{row.openlegion}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AnimateIn>
    </SectionWrapper>
  );
}
