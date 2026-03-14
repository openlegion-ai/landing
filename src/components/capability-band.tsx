import { AnimateIn } from "@/components/ui/animate-in";

const PILLS = [
  { label: "Browse any website", tip: "Researches competitors, reads news, pulls product data" },
  { label: "Fill out any form", tip: "Submits applications, updates CRMs, books appointments" },
  { label: "Write and run code", tip: "Builds features, fixes bugs, runs tests, deploys changes" },
  { label: "Send emails & messages", tip: "Runs outreach sequences, follows up, replies to enquiries" },
  { label: "Manage files & folders", tip: "Organises docs, renames files, moves and archives content" },
  { label: "Research & summarise", tip: "Reads articles, compiles reports, answers research questions" },
  { label: "Scrape data from sites", tip: "Extracts pricing, contacts, listings — no API needed" },
  { label: "Qualify sales leads", tip: "Scores prospects, enriches data, books discovery calls" },
  { label: "Process spreadsheets", tip: "Cleans data, runs calculations, generates summaries" },
  { label: "Post to social media", tip: "Drafts and schedules posts across multiple platforms" },
  { label: "Monitor for changes", tip: "Alerts you when prices drop, pages update, or events fire" },
  { label: "Trigger via Slack, Telegram, Discord", tip: "Trigger agents and get updates via the tools your team already uses" },
];

export function CapabilityBand() {
  return (
    <section className="relative px-6 py-16 md:px-8 md:py-20" aria-label="What agents can automate">
      <div className="absolute inset-0 bg-accent/[0.015]" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl text-center">
        <AnimateIn>
          <h2 className="mx-auto mb-3 max-w-[600px] text-balance text-2xl font-medium leading-snug tracking-tight md:text-3xl">
            If a human can do it, an agent can too.
          </h2>
          <p className="mb-7 text-sm text-muted">
            Built-in stealth browser. Runs 24/7.
          </p>
        </AnimateIn>

        <AnimateIn delay={0.08}>
          <div className="mx-auto mb-7 flex max-w-[760px] flex-wrap justify-center gap-2">
            {PILLS.map((pill) => (
              <span
                key={pill.label}
                title={pill.tip}
                className="pill-interactive cursor-default rounded-full border border-border/40 bg-card/50 px-4 py-2 text-[13px] font-medium text-foreground/80"
              >
                {pill.label}
              </span>
            ))}
          </div>
        </AnimateIn>

        <AnimateIn delay={0.12}>
          <p className="mx-auto max-w-[480px] text-[13px] text-muted">
            All agents run in isolated containers with vault-secured credentials and automatic spend caps.
          </p>
        </AnimateIn>
      </div>
    </section>
  );
}
