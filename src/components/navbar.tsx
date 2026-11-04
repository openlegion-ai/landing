"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { DEMO_URL, WAITLIST_URL } from "@/lib/constants";
import { LanguageSwitcher } from "@/components/language-switcher";
import { trackCtaClick } from "@/lib/analytics";
import { IconArrow } from "@/components/site/icons";

const LINKS = [
  { key: "platform", href: "/#platform" },
  { key: "quickstart", href: "/#quickstart" },
  { key: "security", href: "/security" },
  { key: "pricing", href: "/pricing" },
  { key: "learn", href: "/learn" },
] as const;

export function Navbar() {
  const t = useTranslations("nav");
  const s = useTranslations("site.nav");
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <nav
      aria-label={t("ariaLabel")}
      className={`w-full border-b bg-[var(--bg)] transition-[border-color,background-color] duration-300 ${
        scrolled || open ? "border-[var(--line-2)]" : "nav-top border-transparent"
      }`}
    >
      <div className="wrap flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label={t("homeAriaLabel")}>
          <Image src="/logo.png" alt="" width={28} height={28} sizes="28px" priority className="rounded-full" />
          <span className="text-[1.0625rem] font-semibold tracking-[-0.02em] text-[var(--fg)]">OpenLegion</span>
        </Link>

        <div className="hidden items-center gap-0.5 lg:flex">
          {LINKS.map((l) => (
            <Link key={l.key} href={l.href} className="nav-link">
              {s(`links.${l.key}`)}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <a href={DEMO_URL} onClick={() => trackCtaClick({ location: "nav_call" })} className="nav-link whitespace-nowrap">
            {s("bookCall")}
          </a>
          <a href={WAITLIST_URL} onClick={() => trackCtaClick({ location: "nav_primary_desktop" })} className="btn btn-sm">
            {s("requestAccess")}
          </a>
        </div>

        <div className="flex items-center gap-1.5 lg:hidden">
          <a href={WAITLIST_URL} onClick={() => trackCtaClick({ location: "nav_primary_mobile" })} className="btn btn-sm">
            {s("requestAccess")}
          </a>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="inline-flex size-11 items-center justify-center rounded-[8px] text-[var(--fg)] hover:bg-[var(--tint-1)]"
            aria-label={t("toggleMenuAriaLabel")}
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              {open ? <path d="M4.5 4.5l11 11M15.5 4.5l-11 11" /> : <path d="M3 6.5h14M3 10h14M3 13.5h14" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" className="border-t border-[var(--line)] bg-[var(--bg)] lg:hidden">
          <ul className="wrap py-2">
            {LINKS.map((l) => (
              <li key={l.key} className="border-b border-[var(--line)]">
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center justify-between text-[1rem] font-medium text-[var(--fg)]"
                >
                  {s(`links.${l.key}`)}
                  <IconArrow className="size-4 text-[var(--fg-3)] rtl:-scale-x-100" />
                </Link>
              </li>
            ))}
            <li className="border-b border-[var(--line)]">
              <a href={DEMO_URL} onClick={() => trackCtaClick({ location: "nav_call_mobile" })} className="flex min-h-12 items-center text-[1rem] font-medium text-[var(--fg)]">
                {s("bookCall")}
              </a>
            </li>
            <li className="py-4">
              <LanguageSwitcher />
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}
