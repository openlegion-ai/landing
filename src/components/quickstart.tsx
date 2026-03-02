import { SectionWrapper } from "@/components/ui/section-wrapper";
import { AnimateIn } from "@/components/ui/animate-in";
import { QUICKSTART } from "@/lib/constants";
import { QuickstartClient } from "@/components/quickstart-client";
import { codeToHtml } from "shiki";

export async function Quickstart() {
  const highlighted = await Promise.all(
    QUICKSTART.tabs.map((tab) =>
      codeToHtml(tab.code, {
        lang: tab.lang,
        theme: "github-dark-default",
      })
    )
  );

  const tabs = QUICKSTART.tabs.map((tab, i) => ({
    id: tab.id,
    label: tab.label,
    code: tab.code,
    highlightedHtml: highlighted[i],
  }));

  return (
    <SectionWrapper id="quickstart" glow>
      <AnimateIn>
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">
            Quick Start
          </p>
          <h2 className="mb-5 text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Up and running in{" "}
            <span className="gradient-text">under 60 seconds</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted">
            Three commands to a working agent fleet. No external dependencies.
          </p>
        </div>
      </AnimateIn>

      <div className="mx-auto max-w-3xl">
        <div className="gradient-border glass-shine mb-6 rounded-lg border border-border/40 glass-card px-5 py-3.5 text-sm text-muted">
          <span className="font-medium text-foreground/80">Requirements:</span>{" "}
          {QUICKSTART.requirements}
        </div>

        <QuickstartClient tabs={tabs} />
      </div>
    </SectionWrapper>
  );
}
