"use client";

import { useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { AnimateIn } from "@/components/ui/animate-in";
import { CodeBlock } from "@/components/ui/code-block";

interface Tab {
  id: string;
  label: string;
  code: string;
  highlightedHtml: string;
}

interface QuickstartClientProps {
  tabs: Tab[];
}

const subscribe = () => () => {};
function useIsWindows() {
  return useSyncExternalStore(
    subscribe,
    () => navigator.userAgent.toLowerCase().includes("win"),
    () => false
  );
}

export function QuickstartClient({ tabs }: QuickstartClientProps) {
  const t = useTranslations("quickstart");
  const isWindows = useIsWindows();
  const [active, setActive] = useState(() => (isWindows ? 1 : 0));

  return (
    <AnimateIn>
      {/* Tab switcher */}
      <div
        role="tablist"
        aria-label={t("tabGroupLabel")}
        className="mb-4 flex gap-1 rounded-lg border border-border/40 bg-card/30 p-1"
      >
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active === i}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => setActive(i)}
            className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
              active === i
                ? "bg-accent/10 text-accent-light shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Code block for active tab */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tabs[active].id}
          role="tabpanel"
          id={`panel-${tabs[active].id}`}
          aria-labelledby={`tab-${tabs[active].id}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          <CodeBlock
            code={tabs[active].code}
            highlightedHtml={tabs[active].highlightedHtml}
          />
        </motion.div>
      </AnimatePresence>
    </AnimateIn>
  );
}
