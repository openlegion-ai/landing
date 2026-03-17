"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useTranslations } from "next-intl";

interface CodeBlockProps {
  code: string;
  highlightedHtml?: string;
}

export function CodeBlock({ code, highlightedHtml }: CodeBlockProps) {
  const t = useTranslations("common");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (non-HTTPS or denied)
    }
  };

  return (
    <div className="terminal">
      <div className="terminal-header">
        <div className="terminal-dot bg-[#ff5f57]" aria-hidden="true" />
        <div className="terminal-dot bg-[#febc2e]" aria-hidden="true" />
        <div className="terminal-dot bg-[#28c840]" aria-hidden="true" />
        <span className="ml-3 select-none text-xs text-muted/60" aria-hidden="true">
          terminal
        </span>
        <button
          onClick={handleCopy}
          className="ml-auto flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs text-muted transition-colors hover:bg-white/5 hover:text-foreground"
          aria-label={t("copyToClipboard")}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" />
              <span className="text-success">{t("copiedLabel")}</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              {t("copyLabel")}
            </>
          )}
        </button>
      </div>
      {highlightedHtml ? (
        <div
          className="overflow-x-auto p-5 text-[13px] leading-relaxed [&_pre]:!bg-transparent [&_code]:!bg-transparent"
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      ) : (
        <pre className="overflow-x-auto p-5 text-[13px] leading-relaxed">
          <code className="text-foreground">{code}</code>
        </pre>
      )}
    </div>
  );
}
