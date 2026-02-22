import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <h1 className="mb-4 text-6xl font-bold tracking-tight">
        4<span className="gradient-text">0</span>4
      </h1>
      <p className="mb-8 max-w-md text-lg text-muted">
        This page doesn&apos;t exist. The fleet hasn&apos;t been deployed here
        yet.
      </p>
      <Link
        href="/"
        className="btn-shine rounded-xl bg-accent px-8 py-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        Back to Home
      </Link>
    </main>
  );
}
