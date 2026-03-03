import Link from "next/link";

const ALL_PAGES = [
  { href: "/ai-agent-platform", label: "AI Agent Platform" },
  { href: "/ai-agent-orchestration", label: "AI Agent Orchestration" },
  { href: "/ai-agent-frameworks", label: "AI Agent Frameworks Comparison" },
  { href: "/ai-agent-security", label: "AI Agent Security" },
  { href: "/openclaw-alternative", label: "OpenClaw Alternative" },
  { href: "/comparison/openclaw", label: "OpenLegion vs OpenClaw" },
];

export function RelatedPages({ currentSlug }: { currentSlug: string }) {
  const links = ALL_PAGES.filter((p) => p.href !== currentSlug);

  return (
    <nav aria-label="Related pages" className="related-pages">
      <h2>Related Pages</h2>
      <ul>
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
