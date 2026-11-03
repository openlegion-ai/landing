/*
 * Formerly framer-motion entrance wrappers. The letter world renders its
 * content visible by default — an instrument does not fade in clause by
 * clause. The components remain as plain containers so call sites keep
 * their layout classNames; the page's one authored motion is the signature
 * stroke in the execution blocks (see globals.css `sig-draw`).
 */

export function AnimateIn({
  children,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  scale?: boolean;
}) {
  return <div className={className}>{children}</div>;
}

export function StaggerContainer({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

export function StaggerItem({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}
