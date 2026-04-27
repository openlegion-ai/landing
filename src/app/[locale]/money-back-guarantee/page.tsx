import type { Metadata } from "next";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "14-Day Money-Back Guarantee",
  description:
    "Full refund on your first month if OpenLegion isn't a fit. No questions asked.",
  alternates: {
    canonical: "https://www.openlegion.ai/money-back-guarantee",
  },
  robots: { index: true, follow: true },
};

export default function MoneyBackGuaranteePage() {
  return (
    <>
      <main id="main" className="mx-auto max-w-3xl px-6 pb-24 pt-8 md:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          14-Day Money-Back Guarantee
        </h1>
        <p className="mt-2 text-sm text-muted">
          Full refund on your first month, no questions asked.
        </p>

        <div className="prose-legal mt-10 space-y-8 text-sm leading-relaxed text-muted">
          {/* ── Intro ── */}
          <section>
            <p>
              We stand behind OpenLegion. If your first month isn&rsquo;t a fit
              for any reason, email{" "}
              <a
                href="mailto:support@openlegion.ai"
                className="text-accent underline underline-offset-2 hover:text-accent/80"
              >
                support@openlegion.ai
              </a>{" "}
              within 14 days of your first subscription payment and we&rsquo;ll
              refund the full amount you actually paid (the launch-pricing
              amount billed by Polar &mdash; not the higher anchor displayed
              alongside).
            </p>
          </section>

          {/* ── What's covered ── */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              What&rsquo;s covered
            </h2>
            <ul className="ml-5 mt-2 list-disc space-y-1">
              <li>
                Your first subscription payment (the actual amount charged
                &mdash; e.g. $19 for Basic monthly, not the $39 anchor).
              </li>
              <li>
                Full refund of that amount &mdash; no questions asked, no
                partial pro-ration.
              </li>
            </ul>
          </section>

          {/* ── What's not covered ── */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              What&rsquo;s not covered
            </h2>
            <ul className="ml-5 mt-2 list-disc space-y-1">
              <li>
                Credit top-ups (already consumed credits are non-refundable
                &mdash; unused credits remain on your account until the refund
                is processed).
              </li>
              <li>Renewal billing after the first 14 days.</li>
              <li>
                Subscriptions used abusively (violating the acceptable use
                policy).
              </li>
            </ul>
          </section>

          {/* ── What happens to your account after a refund ── */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              What happens to your account after a refund
            </h2>
            <ul className="ml-5 mt-2 list-disc space-y-1">
              <li>
                Your subscription is cancelled and your hosted instance is
                taken offline within 24 hours of the refund.
              </li>
              <li>
                Welcome credits granted with the subscription are reclaimed
                and your credit balance returns to zero (consistent with the
                refund).
              </li>
              <li>
                You are not eligible to claim a second money-back refund or a
                second welcome-credits grant on a future subscription. Future
                subscriptions are billed normally.
              </li>
            </ul>
          </section>

          {/* ── How to request a refund ── */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              How to request a refund
            </h2>
            <p>
              Email{" "}
              <a
                href="mailto:support@openlegion.ai"
                className="text-accent underline underline-offset-2 hover:text-accent/80"
              >
                support@openlegion.ai
              </a>{" "}
              with your account email and subscription ID. Refunds are
              processed within 5 business days via Polar (funds return to your
              original payment method).
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
