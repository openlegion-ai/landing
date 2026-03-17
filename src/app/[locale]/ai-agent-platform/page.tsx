import type { Metadata } from "next";
import { getContentPage } from "@/lib/markdown";
import { buildMetadata } from "@/lib/content-page-helpers";
import { ContentPage } from "@/components/content-page";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const SLUG = "/ai-agent-platform";

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
      <a href="#main" className="skip-nav">Skip to content</a>
      <Navbar />
      <main id="main">
        <ContentPage page={page} />
      </main>
      <Footer />
    </>
  );
}
