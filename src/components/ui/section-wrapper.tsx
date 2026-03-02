interface SectionWrapperProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
  fade?: boolean;
  glow?: boolean;
}

export function SectionWrapper({
  children,
  id,
  className = "",
  fade = true,
  glow = false,
}: SectionWrapperProps) {
  return (
    <section
      id={id}
      className={`relative px-5 py-16 sm:px-6 md:px-8 md:py-28 lg:py-36 ${fade ? "section-fade" : ""} ${glow ? "section-glow" : ""} ${className}`}
    >
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}
