import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <h1 className="mb-4 text-6xl font-bold tracking-tight">
        4<span className="gradient-text">{t("titleHighlight")}</span>4
      </h1>
      <p className="mb-8 max-w-md text-lg text-muted">
        {t("description")}
      </p>
      <Link
        href="/"
        className="btn-shine rounded-xl bg-accent px-8 py-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        {t("backToHome")}
      </Link>
    </main>
  );
}
