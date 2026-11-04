/**
 * One drawn icon grammar for the site: 16-unit grid, 1.6 stroke, round caps.
 */
type P = { className?: string };
const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const IconArrow = ({ className = "arrow size-4" }: P) => (
  <svg viewBox="0 0 16 16" className={className} {...base}>
    <path d="M3 8h10M9 4l4 4-4 4" />
  </svg>
);

export const IconCheck = ({ className = "size-3" }: P) => (
  <svg viewBox="0 0 12 12" className={className} {...base} strokeWidth={2}>
    <path d="M2.5 6.5 5 9l4.5-5.5" />
  </svg>
);

export const IconPlus = ({ className = "faq-plus size-4" }: P) => (
  <svg viewBox="0 0 16 16" className={className} {...base}>
    <path d="M8 3v10M3 8h10" />
  </svg>
);

export const IconSpark = ({ className = "size-3" }: P) => (
  <svg viewBox="0 0 12 12" className={className} fill="currentColor" aria-hidden="true">
    <path d="M6 0.5l1.25 4.25L11.5 6 7.25 7.25 6 11.5 4.75 7.25 0.5 6l4.25-1.25z" />
  </svg>
);

export const IconSend = ({ className = "size-3.5" }: P) => (
  <svg viewBox="0 0 16 16" className={className} {...base}>
    <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" />
  </svg>
);

export const IconExternal = ({ className = "size-3.5" }: P) => (
  <svg viewBox="0 0 16 16" className={className} {...base}>
    <path d="M6 3.5H3.5v9h9V10M9 3h4v4M13 3 7.5 8.5" />
  </svg>
);

export const IconStop = ({ className = "size-3.5" }: P) => (
  <svg viewBox="0 0 16 16" className={className} {...base}>
    <rect x="4" y="4" width="8" height="8" rx="1.5" />
  </svg>
);

export const IconLock = ({ className = "size-3.5" }: P) => (
  <svg viewBox="0 0 16 16" className={className} {...base}>
    <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" />
    <path d="M5.5 7V5.5a2.5 2.5 0 0 1 5 0V7" />
  </svg>
);

export const IconGlobe = ({ className = "size-3.5" }: P) => (
  <svg viewBox="0 0 16 16" className={className} {...base}>
    <circle cx="8" cy="8" r="5.5" />
    <path d="M2.5 8h11M8 2.5c1.6 1.6 2.4 3.4 2.4 5.5S9.6 11.9 8 13.5C6.4 11.9 5.6 10.1 5.6 8S6.4 4.1 8 2.5Z" />
  </svg>
);

export const IconKey = ({ className = "size-3.5" }: P) => (
  <svg viewBox="0 0 16 16" className={className} {...base}>
    <circle cx="5.5" cy="10.5" r="2.75" />
    <path d="M7.5 8.5 13 3M10.5 5.5 12 7" />
  </svg>
);
