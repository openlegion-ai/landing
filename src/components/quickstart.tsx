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
            <span className="gradient-text">minutes</span>
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

        <AnimateIn delay={0.1}>
          <ol className="mb-6 space-y-1 text-sm text-muted">
            <li><span className="font-medium text-foreground/80">Step 1:</span> Clone the repository from GitHub.</li>
            <li><span className="font-medium text-foreground/80">Step 2:</span> Run the installer to check dependencies, create a virtual environment, and make the CLI globally available.</li>
            <li><span className="font-medium text-foreground/80">Step 3:</span> Run <code className="rounded bg-card px-1.5 py-0.5 font-mono text-xs text-accent-light">openlegion start</code> to launch the setup wizard and deploy agents in isolated containers.</li>
          </ol>
        </AnimateIn>

        <QuickstartClient tabs={tabs} />
      </div>
    </SectionWrapper>
  );
}
