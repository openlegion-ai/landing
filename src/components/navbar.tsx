"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Github, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { NAV_LINKS, APP_URL, GITHUB_URL } from "@/lib/constants";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pastHero, setPastHero] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Track when hero CTA scrolls out of view
  useEffect(() => {
    const heroCtaEl = document.getElementById("hero-cta");
    if (!heroCtaEl) return;
    const observer = new IntersectionObserver(
      ([entry]) => setPastHero(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(heroCtaEl);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <nav
      aria-label="Main navigation"
      className={`fixed top-0 z-50 w-full px-6 transition-all duration-300 md:px-8 ${
        scrolled
          ? "bg-background/80 backdrop-blur-2xl"
          : "bg-transparent"
      }`}
    >
      {scrolled && (
        <div
          className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/25 to-transparent"
          aria-hidden="true"
        />
      )}

      <div className="mx-auto flex max-w-6xl items-center justify-between py-3">
        <Link href="/" className="flex items-center gap-2.5 transition-transform hover:scale-105" aria-label="OpenLegion home">
          <Image
            src="/logo.png"
            alt=""
            width={36}
            height={36}
            sizes="36px"
            priority
            className="rounded-full"
          />
          <span className="text-lg font-bold tracking-tight text-foreground">
            Open<span className="text-accent">Legion</span>
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const isExternal = link.href.startsWith("http");
            return (
              <a
                key={link.href}
                href={link.href}
                {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="nav-link rounded-md px-3 py-2 text-sm text-muted transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            );
          })}
          <div className="ml-3 h-5 w-px bg-border" aria-hidden="true" />
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 rounded-md p-2 text-muted transition-colors hover:text-foreground"
            aria-label="GitHub repository"
          >
            <Github className="h-4 w-4" aria-hidden="true" />
          </a>
          <span className={`ml-1 text-[13px] text-emerald-400 font-medium transition-opacity duration-300 ${pastHero ? "opacity-100" : "opacity-0"}`}>
            Free trial
          </span>
          <a
            href={APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-shine ml-2 flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Try free →
          </a>
        </div>

        {/* Mobile — CTA always visible outside hamburger */}
        <div className="flex items-center gap-1.5 md:hidden ml-auto">
          <span className={`text-[11px] text-emerald-400 font-medium transition-opacity duration-300 ${pastHero ? "opacity-100" : "opacity-0"}`}>
            Free trial
          </span>
          <a
            href={APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-shine flex items-center gap-2 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
          >
            Try free →
          </a>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-md p-2 text-muted transition-colors hover:text-foreground"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden border-t border-border/50 bg-background/95 backdrop-blur-2xl md:hidden"
          >
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 py-4">
              {NAV_LINKS.map((link) => {
                const isExternal = link.href.startsWith("http");
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="rounded-md px-3 py-3 text-sm text-muted transition-colors hover:bg-card hover:text-foreground"
                  >
                    {link.label}
                  </a>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
