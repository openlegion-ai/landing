import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { AnimateIn, StaggerContainer, StaggerItem } from "@/components/ui/animate-in";
import { FOOTER_COLUMNS } from "@/lib/constants";

export function Footer() {
  const t = useTranslations("footer");
  return (
    <footer className="footer-gradient relative px-6 md:px-8">
      {/* Gradient top border */}
      <div
        className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-6xl py-16 md:py-20">
        <div className="flex flex-col gap-12 md:flex-row md:justify-between">
          {/* Brand */}
          <AnimateIn className="max-w-xs">
            <div className="flex items-center gap-2.5">
              <Image
                src="/logo.png"
                alt=""
                width={24}
                height={24}
                sizes="24px"
                className="rounded-full"
              />
              <span className="text-lg font-bold tracking-tight text-foreground">
                Open<span className="text-accent">Legion</span>
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              {t("brandDescription")}
            </p>
            <p className="mt-4 text-xs text-muted/70">
              {t("license", { year: new Date().getFullYear() })}
            </p>
          </AnimateIn>

          {/* Link columns */}
          <StaggerContainer className="grid grid-cols-2 gap-10 sm:grid-cols-3 xl:grid-cols-6 xl:gap-8">
            {FOOTER_COLUMNS.map((col, colIdx) => (
              <StaggerItem key={col.title}>
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground/50">
                  {t(`columns.${colIdx}.title`)}
                </p>
                <ul className="space-y-3">
                  {col.links.map((link, linkIdx) => {
                    const isExternal = link.href.startsWith("http");
                    const className = "inline-block py-0.5 text-sm text-muted transition-all hover:translate-x-0.5 hover:text-foreground";

                    return (
                      <li key={link.label}>
                        {isExternal ? (
                          <a
                            href={link.href}
                            className={className}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {t(`columns.${colIdx}.links.${linkIdx}`)}
                          </a>
                        ) : (
                          <Link href={link.href} className={className}>
                            {t(`columns.${colIdx}.links.${linkIdx}`)}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </div>
    </footer>
  );
}
