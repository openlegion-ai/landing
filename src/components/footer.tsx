"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimateIn, StaggerContainer, StaggerItem } from "@/components/ui/animate-in";
import { FOOTER_COLUMNS } from "@/lib/constants";

export function Footer() {
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
              The AI agent framework built for production.
              Container-isolated, auditable, and cost-controlled.
            </p>
            <p className="mt-4 text-xs text-muted/70">
              BSL 1.1 License &copy; {new Date().getFullYear()} OpenLegion
              Contributors
            </p>
          </AnimateIn>

          {/* Link columns */}
          <StaggerContainer className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-6 lg:gap-8">
            {FOOTER_COLUMNS.map((col) => (
              <StaggerItem key={col.title}>
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground/50">
                  {col.title}
                </p>
                <ul className="space-y-3">
                  {col.links.map((link) => {
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
                            {link.label}
                          </a>
                        ) : (
                          <Link href={link.href} className={className}>
                            {link.label}
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
