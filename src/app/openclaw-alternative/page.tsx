import type { Metadata } from "next";
import { getContentPage } from "@/lib/markdown";
import { buildMetadata } from "@/lib/content-page-helpers";
import { ContentPage } from "@/components/content-page";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const SLUG = "/openclaw-alternative";

export async function generateMetadata(): Promise<Metadata> {
  const { frontmatter } = await getContentPage(SLUG);
  return buildMetadata(frontmatter);
}

export default async function Page() {
  const page = await getContentPage(SLUG);
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
