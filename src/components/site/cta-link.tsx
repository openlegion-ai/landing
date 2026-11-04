"use client";

import type { ReactNode } from "react";
import { trackCtaClick } from "@/lib/analytics";

/** An external CTA link that records a `cta_click` with its location. */
export function CtaLink({
  href,
  location,
  className,
  children,
}: {
  href: string;
  location: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a href={href} className={className} onClick={() => trackCtaClick({ location })}>
      {children}
    </a>
  );
}
