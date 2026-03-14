import { SectionWrapper } from "@/components/ui/section-wrapper";
import { AnimateIn } from "@/components/ui/animate-in";
import { QUICKSTART, APP_URL, DOCS_URL } from "@/lib/constants";
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
            Two paths to your first{" "}
            <span className="gradient-text">AI agent</span>
          </h2>
        </div>
      </AnimateIn>

      <div className="mx-auto max-w-5xl">
        <AnimateIn delay={0.08}>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left column — Managed hosting */}
            <div className="gradient-border glass-shine flex min-w-0 flex-col rounded-xl border border-border/50 glass-card bg-gradient-to-b from-accent/[0.04] to-transparent p-6 md:p-8">
              <span className="mb-4 inline-flex w-fit items-center rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-medium text-accent-light">
                Easiest — no setup required
              </span>
              <h3 className="mb-4 text-lg font-semibold text-foreground">
                No terminal. No config files.
              </h3>
              <ol className="mb-6 flex-1 list-decimal space-y-2 pl-5 text-sm text-muted marker:font-medium marker:text-foreground/80">
                <li>Sign up at app.openlegion.ai</li>
                <li>Pick a team template</li>
                <li>Add your LLM API key</li>
                <li>Agents are live.</li>
              </ol>
              <p className="mb-6 text-sm text-muted">
                That&apos;s it. We manage the containers, credentials, and infrastructure.
              </p>
              <a
                href={APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group/btn btn-shine btn-glow btn-gradient flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white"
              >
                Get started →
              </a>
            </div>

            {/* Right column — Self-hosted */}
            <div className="gradient-border glass-shine flex min-w-0 flex-col rounded-xl border border-border/50 glass-card p-6 md:p-8">
              <span className="mb-4 inline-flex w-fit items-center rounded-full border border-border/40 bg-background/50 px-3 py-1 text-xs font-medium text-muted">
                Full control — on-premise support
              </span>
              <h3 className="mb-4 text-lg font-semibold text-foreground">
                Three commands. One machine.
              </h3>
              <div className="mb-4 rounded-lg border border-border/40 bg-background/50 px-4 py-2.5 text-sm text-muted">
                <span className="font-medium text-foreground/80">Requirements:</span>{" "}
                {QUICKSTART.requirements}
              </div>
              <div className="mb-6 min-w-0 flex-1 overflow-hidden">
                <QuickstartClient tabs={tabs} />
              </div>
              <a
                href={DOCS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground transition-all hover:border-accent/40 hover:bg-accent/5"
              >
                Read the docs →
              </a>
            </div>
          </div>
        </AnimateIn>
      </div>
    </SectionWrapper>
  );
}
