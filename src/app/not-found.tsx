import Link from "next/link";
import "./globals.css";

/*
 * Root 404 — catches unknown paths that never enter the [locale] layout
 * (the locale-aware not-found only renders for notFound() calls inside it).
 * Self-contained html/body because the root layout is a passthrough.
 * English-only by necessity: no locale context exists out here.
 */
export default function RootNotFound() {
  return (
    <html lang="en">
      <body className="antialiased">
        <main className="glow flex min-h-screen items-center overflow-hidden">
          <div className="wrap py-24">
            <p className="t-mono text-[0.8125rem] text-[var(--fg-3)]">404 · page_not_found</p>
            <h1 className="t-h1 mt-5 max-w-[16ch]">This page doesn&apos;t exist.</h1>
            <Link href="/en" className="btn mt-10">
              Back to home
            </Link>
            <ul className="nf-links">
              {[["/en#platform", "Platform"], ["/en/learn", "Learn"], ["/en/pricing", "Pricing"], ["/en/security", "Security"]].map(([href, label]) => (
                <li key={href}>
                  <Link href={href}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </main>
      </body>
    </html>
  );
}
