import { Megaphone, TrendingUp, BookOpen, Workflow } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionWrapper } from "@/components/ui/section-wrapper";
import { AnimateIn, StaggerContainer, StaggerItem } from "@/components/ui/animate-in";
import { APP_URL } from "@/lib/constants";

const TEAMS = [
  { icon: Megaphone },
  { icon: TrendingUp },
  { icon: BookOpen },
  { icon: Workflow },
] as const;

export function ReadyMadeTeams() {
  const t = useTranslations("readyMadeTeams");

  return (
    <SectionWrapper id="ready-made-teams" glow>
      <AnimateIn>
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">
            {t("sectionLabel")}
          </p>
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            {t("heading")}
          </h2>
        </div>
      </AnimateIn>

      <StaggerContainer className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {TEAMS.map((team, i) => {
          const Icon = team.icon;
          return (
            <StaggerItem key={i}>
              <div className="card-hover gradient-border glass-shine group flex h-full flex-col items-center rounded-xl border border-border/50 glass-card p-6 text-center">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-accent/15 bg-accent/[0.07] transition group-hover:border-accent/30 group-hover:scale-110">
                  <Icon className="h-5 w-5 text-accent-light" />
                </div>
                <h3 className="mb-4 text-[15px] font-semibold text-foreground">
                  {t(`teams.${i}.name`)}
                </h3>
                <a
                  href={APP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto text-xs font-medium text-accent-light transition-colors hover:text-accent hover:underline"
                >
                  {t("cta")}
                </a>
              </div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </SectionWrapper>
  );
}
