"use client";

import { useId, useState, type ReactNode } from "react";

/** Tiny TS/TSX highlighter: comments, strings, keywords, calls, tags. */
function highlight(code: string): ReactNode[] {
  const re =
    /(\/\/[^\n]*)|("[^"\n]*"|`[^`]*`)|\b(import|from|export|const|async|await|default|return|function|type)\b|(<\/?[A-Z][A-Za-z]*)|\b([A-Za-z_$][\w$]*)(?=\()/g;
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(code))) {
    if (m.index > last) out.push(code.slice(last, m.index));
    const [tok, c, s, k, tag, f] = m;
    const cls = c ? "tok-c" : s ? "tok-s" : k ? "tok-k" : tag ? "tok-p" : f ? "tok-f" : "";
    out.push(
      <span key={i++} className={cls}>
        {tok}
      </span>,
    );
    last = m.index + tok.length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}

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
              if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
              const dir = e.key === "ArrowRight" ? 1 : -1;
              const next = (active + dir + files.length) % files.length;
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
