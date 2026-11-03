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
        <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
          <p className="mb-3 text-sm font-semibold text-accent">404</p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground">
            Page not found
          </h1>
          <p className="mb-8 max-w-md text-lg text-muted">
            This page doesn&apos;t exist. The fleet hasn&apos;t been deployed here yet.
          </p>
          <a
            href="/en"
            className="btn-gradient rounded-lg px-8 py-3.5 text-sm font-semibold text-white"
          >
            Back to Home
          </a>
        </main>
      </body>
    </html>
  );
}
