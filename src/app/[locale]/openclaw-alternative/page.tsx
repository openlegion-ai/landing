import type { Metadata } from "next";
import { getContentPage } from "@/lib/markdown";
import { buildMetadata } from "@/lib/content-page-helpers";
import { ContentPage } from "@/components/content-page";
import { Footer } from "@/components/footer";

const SLUG = "/openclaw-alternative";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const { frontmatter } = await getContentPage(SLUG, locale);
  return buildMetadata(frontmatter);
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const page = await getContentPage(SLUG, locale);
  return (
    <>
      <main id="main">
        <ContentPage page={page} />
      </main>
      <Footer />
    </>
  );
}
