"use client";

import { X, Check } from "lucide-react";
import { motion } from "framer-motion";
import { SectionWrapper } from "@/components/ui/section-wrapper";
import { AnimateIn } from "@/components/ui/animate-in";
import { COMPARISON_ROWS } from "@/lib/constants";

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
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">
            Comparison
          </p>
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            How OpenLegion is different
          </h2>
        </div>
      </AnimateIn>

      <AnimateIn delay={0.06}>
        <p className="mx-auto mb-4 max-w-2xl text-center text-muted">
          Most AI agent tools were built for demos — OpenLegion was built for production.
        </p>
        <p className="mx-auto mb-4 max-w-2xl text-center text-[13px] leading-relaxed text-muted/70">
          OpenLegion is the only AI agent framework shipping vault-proxied credentials, container isolation, and per-agent budget enforcement as defaults — with zero CVEs reported since launch.
        </p>
        <p className="mb-8 text-center text-xs text-muted/50">
          Based on public security disclosures and community reports.
        </p>
      </AnimateIn>

      <AnimateIn delay={0.14}>
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

      <AnimateIn delay={0.24}>
        <p className="mt-6 text-center text-[13px] text-muted/60">
          OpenLegion launched in February 2026. GitHub star counts reflect project age, not production readiness.
        </p>
      </AnimateIn>
    </SectionWrapper>
  );
}
