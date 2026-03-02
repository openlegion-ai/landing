"use client";

import { AlertTriangle, X, Check } from "lucide-react";
import { motion } from "framer-motion";
import { SectionWrapper } from "@/components/ui/section-wrapper";
import { AnimateIn } from "@/components/ui/animate-in";
import { COMPARISON_ALERT, COMPARISON_ROWS } from "@/lib/constants";

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const staggerRow = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
};

export function Comparison() {
  return (
    <SectionWrapper id="comparison" fade={false}>
      <AnimateIn>
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-danger">
            Comparison
          </p>
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            {COMPARISON_ALERT.title}
          </h2>
        </div>
      </AnimateIn>

      <AnimateIn delay={0.08} scale>
        <div className="glass-shine mb-8 rounded-xl border border-danger/20 bg-danger/[0.03] p-5 backdrop-blur-sm md:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-danger/10">
              <AlertTriangle className="h-5 w-5 text-danger" aria-hidden="true" />
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
        <div className="gradient-border glass-shine rounded-xl border border-border/50 glass-card">
          <div className="overflow-x-auto rounded-[inherit]">
            <table className="w-full min-w-[480px] text-sm">
            <caption className="sr-only">
              Feature comparison between OpenClaw and OpenLegion
            </caption>
            <thead>
              <tr className="comparison-header border-b border-border/50">
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
            <motion.tbody
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={staggerContainer}
            >
              {COMPARISON_ROWS.map((row, i) => (
                <motion.tr
                  key={row.aspect}
                  variants={staggerRow}
                  className={`group/row transition-colors hover:bg-white/[0.02] ${
                    i < COMPARISON_ROWS.length - 1
                      ? "border-b border-border/30"
                      : ""
                  }`}
                >
                  <td className="px-4 py-3.5 font-medium text-foreground sm:px-6 sm:py-4">
                    {row.aspect}
                  </td>
                  <td className="px-4 py-3.5 sm:px-6 sm:py-4">
                    <span className="flex items-center gap-2 text-muted/80">
                      <X className="h-3.5 w-3.5 shrink-0 text-danger/50 transition-transform group-hover/row:scale-110" aria-hidden="true" />
                      <span>{row.them}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3.5 sm:px-6 sm:py-4">
                    <span className="flex items-center gap-2 text-success">
                      <Check className="h-3.5 w-3.5 shrink-0 transition-transform group-hover/row:scale-110" aria-hidden="true" />
                      <span>{row.openlegion}</span>
                    </span>
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
            </table>
          </div>
        </div>
      </AnimateIn>
    </SectionWrapper>
  );
}
