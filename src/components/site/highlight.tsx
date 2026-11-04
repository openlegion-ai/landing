import type { ReactNode } from "react";

/** Tiny TS/TSX/HTTP highlighter: comments, strings, keywords, calls, tags. Server- and client-safe. */
export function highlight(code: string): ReactNode[] {
  const re =
    /(\/\/[^\n]*)|("[^"\n]*"|`[^`]*`)|\b(import|from|export|const|async|await|default|return|function|type|POST|GET|PUT|DELETE)\b|(<\/?[A-Z][A-Za-z]*)|\b([A-Za-z_$][\w$]*)(?=\()/g;
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
