import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { Features } from "@/components/features";
import { UseCases } from "@/components/use-cases";
import { Comparison } from "@/components/comparison";
import { Architecture } from "@/components/architecture";
import { Quickstart } from "@/components/quickstart";
import { CTA } from "@/components/cta";
import { Footer } from "@/components/footer";

async function getStarCount(): Promise<number> {
  try {
    const res = await fetch(
      "https://api.github.com/repos/openlegion-ai/openlegion",
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return 0;
    const data = await res.json();
    return data.stargazers_count ?? 0;
  } catch {
    return 0;
  }
}

export default async function Home() {
  const stars = await getStarCount();

  return (
    <>
      <a href="#main" className="skip-nav">
        Skip to content
      </a>
      <Navbar />
      <main id="main">
        <Hero stars={stars} />
        <Features />
        <UseCases />
        <Comparison />
        <Architecture />
        <Quickstart />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
