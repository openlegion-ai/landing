"use client";

import { useId, useState } from "react";
import { highlight } from "./highlight";

export function CodeTabs({ files, label }: { files: { name: string; code: string }[]; label: string }) {
  const [active, setActive] = useState(0);
  const base = useId();
  return (
    <div className="code-panel">
      <div className="flex overflow-x-auto border-b border-[var(--line)] bg-[var(--code-head)] px-1" role="tablist" aria-label={label}>
        {files.map((f, i) => (
          <button
            key={f.name}
            id={`${base}-tab-${i}`}
            role="tab"
            type="button"
            aria-selected={active === i}
            aria-controls={`${base}-panel-${i}`}
            tabIndex={active === i ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(e) => {
              // Arrows follow the reading direction: in RTL, the left arrow moves to the next tab.
              const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
              const step = e.key === "ArrowRight" ? (rtl ? -1 : 1) : e.key === "ArrowLeft" ? (rtl ? 1 : -1) : 0;
              let next: number;
              if (step) next = (active + step + files.length) % files.length;
              else if (e.key === "Home") next = 0;
              else if (e.key === "End") next = files.length - 1;
              else return;
              e.preventDefault();
              setActive(next);
              document.getElementById(`${base}-tab-${next}`)?.focus();
            }}
            className="tab shrink-0"
          >
            {f.name}
          </button>
        ))}
      </div>
      {files.map((f, i) => (
        <div
          key={f.name}
          id={`${base}-panel-${i}`}
          role="tabpanel"
          aria-labelledby={`${base}-tab-${i}`}
          hidden={active !== i}
        >
          <pre dir="ltr">
            <code>{highlight(f.code)}</code>
          </pre>
        </div>
      ))}
    </div>
  );
}
