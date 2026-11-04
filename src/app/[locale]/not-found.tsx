import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { IconArrow } from "@/components/site/icons";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Locale 404. */
export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <main id="main" className="glow flex min-h-[72vh] items-center overflow-hidden">
      <div className="wrap py-24">
        <p className="t-mono text-[0.8125rem] text-[var(--fg-3)]" dir="ltr">
          404 · page_not_found
        </p>
        <h1 className="t-h1 mt-5 max-w-[16ch]">{t("description")}</h1>
        <Link href="/" className="btn mt-10">
          {t("backToHome")} <IconArrow />
        </Link>
      </div>
    </main>
  );
}
