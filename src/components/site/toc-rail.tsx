"use client";

import { useEffect, useState } from "react";

/**
 * "On this page": the article's sections, sticky beside the text on wide
 * screens. The section you are reading is marked as you scroll. Hidden below
 * 1280px, where the article runs as a single column.
 */
export function TocRail({ items, label }: { items: Array<{ id: string; text: string }>; label: string }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const heads = items.map((it) => document.getElementById(it.id)).filter((el): el is HTMLElement => !!el);
    if (!heads.length) return;
    const onScroll = () => {
      // The current section is the last heading that has scrolled past a line 30% down the viewport.
      const line = window.innerHeight * 0.3;
      let current: string | null = null;
      for (const h of heads) {
        if (h.getBoundingClientRect().top <= line) current = h.id;
        else break;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [items]);

  return (
    <nav className="toc-rail" aria-label={label}>
      <p className="toc-label">{label}</p>
      <ol>
        {items.map((it) => (
          <li key={it.id}>
            <a href={`#${it.id}`} aria-current={active === it.id ? "true" : undefined}>
              {it.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
