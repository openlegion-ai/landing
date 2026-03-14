import { UserPlus, CreditCard, Wrench, Rocket } from "lucide-react";
import { SectionWrapper } from "@/components/ui/section-wrapper";
import { AnimateIn } from "@/components/ui/animate-in";
import { QUICKSTART, APP_URL, DOCS_URL } from "@/lib/constants";

const STEPS = [
  { icon: UserPlus, label: "Create your account" },
  { icon: CreditCard, label: "Select a plan" },
  { icon: Wrench, label: "Configure your agents" },
  { icon: Rocket, label: "Run your fleet" },
];
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
              <h3 className="mb-5 text-lg font-semibold text-foreground md:text-xl">
                No terminal. No config files.
              </h3>
              <div className="mb-5 grid flex-1 grid-cols-2 gap-3">
                {STEPS.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.label} className="flex flex-col items-center gap-2 rounded-lg border border-border/30 bg-background/30 p-4 text-center">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent/15 bg-accent/[0.07]">
                        <Icon className="h-4 w-4 text-accent-light" />
                      </div>
                      <span className="text-[13px] font-medium leading-tight text-foreground/80">{step.label}</span>
                    </div>
                  );
                })}
              </div>
              <p className="mb-6 text-[13px] text-muted">
                We handle the containers, credentials, and infrastructure.
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
