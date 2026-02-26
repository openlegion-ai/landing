import Image from "next/image";
import { FOOTER_COLUMNS } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-border/40 px-6 md:px-8">
      <div className="mx-auto max-w-6xl py-16 md:py-20">
        <div className="flex flex-col gap-12 md:flex-row md:justify-between">
          {/* Brand */}
          <div className="max-w-xs">
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
                Open<span className="gradient-text">Legion</span>
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              The open source AI agent framework built for production.
              Container-isolated, auditable, and cost-controlled.
            </p>
            <p className="mt-4 text-xs text-muted/70">
              BSL 1.1 License &copy; {new Date().getFullYear()} OpenLegion
              Contributors
            </p>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4 lg:gap-12">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground/50">
                  {col.title}
                </p>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="inline-block py-0.5 text-sm text-muted transition-colors hover:text-foreground"
                        {...(link.href.startsWith("http")
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
