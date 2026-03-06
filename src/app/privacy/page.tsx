import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for OpenLegion managed hosting and the openlegion.ai website.",
  alternates: { canonical: "https://openlegion.ai/privacy" },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <>
      <a href="#main" className="skip-nav">
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="mx-auto max-w-3xl px-6 pb-24 pt-32 md:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-muted">
          Effective date: March 7, 2026 &middot; Last updated: March 7, 2026
        </p>

        <div className="prose-legal mt-10 space-y-8 text-sm leading-relaxed text-muted">
          {/* ── 1 ── */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              1. Introduction
            </h2>
            <p>
              This Privacy Policy describes how OpenLegion
              (&ldquo;<strong>we</strong>,&rdquo; &ldquo;<strong>us</strong>,&rdquo;
              &ldquo;<strong>our</strong>&rdquo;) collects, uses, and discloses information
              when you visit <strong>openlegion.ai</strong> (the
              &ldquo;<strong>Website</strong>&rdquo;) or use our managed hosting service,
              APIs, and related services (collectively, the
              &ldquo;<strong>Service</strong>&rdquo;).
            </p>
            <p className="mt-2">
              By using the Service, you consent to the practices described in this Privacy
              Policy. If you do not agree, please do not use the Service.
            </p>
          </section>

          {/* ── 2 ── */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              2. Information We Collect
            </h2>

            <h3 className="mb-2 mt-4 text-base font-medium text-foreground/90">
              2.1 Information You Provide
            </h3>
            <ul className="ml-5 list-disc space-y-1">
              <li>
                <strong>Account information:</strong> Email address, name, and password
                when you create an account.
              </li>
              <li>
                <strong>Payment information:</strong> Billing details processed by our
                third-party payment processor (e.g., Stripe). We do not store full credit
                card numbers on our servers.
              </li>
              <li>
                <strong>Communications:</strong> Information you provide when contacting us
                via email, live chat (Tawk.to), or Discord.
              </li>
              <li>
                <strong>Customer Data:</strong> Agent configurations, workflow definitions,
                and other data you submit to the Service.
              </li>
            </ul>

            <h3 className="mb-2 mt-4 text-base font-medium text-foreground/90">
              2.2 Information Collected Automatically
            </h3>
            <ul className="ml-5 list-disc space-y-1">
              <li>
                <strong>Usage data:</strong> Pages visited, features used, timestamps,
                referral URLs, and general interaction patterns.
              </li>
              <li>
                <strong>Device information:</strong> Browser type, operating system, screen
                resolution, and device identifiers.
              </li>
              <li>
                <strong>IP address:</strong> Collected for security, analytics, and
                approximate geolocation purposes.
              </li>
              <li>
                <strong>Cookies and similar technologies:</strong> See Section 6 below.
              </li>
            </ul>
          </section>

          {/* ── 3 ── */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              3. How We Use Your Information
            </h2>
            <p>We use the information we collect to:</p>
            <ul className="ml-5 mt-2 list-disc space-y-1">
              <li>Provide, operate, and maintain the Service;</li>
              <li>Process payments and send billing-related communications;</li>
              <li>Respond to your inquiries and provide customer support;</li>
              <li>
                Analyze usage patterns to improve the Service (via Google Analytics and
                Microsoft Clarity);
              </li>
              <li>Detect, prevent, and address technical issues, fraud, or abuse;</li>
              <li>
                Send transactional emails (account confirmation, password reset, billing
                receipts);
              </li>
              <li>Comply with legal obligations.</li>
            </ul>
            <p className="mt-2">
              <strong>We do not sell your personal information.</strong> We do not use
              Customer Data to train AI models.
            </p>
          </section>

          {/* ── 4 ── */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              4. Third-Party Services
            </h2>
            <p>
              We use the following third-party services that may collect information as
              described in their respective privacy policies:
            </p>
            <ul className="ml-5 mt-2 list-disc space-y-1">
              <li>
                <strong>Google Analytics</strong> &mdash; website analytics and traffic
                measurement.
              </li>
              <li>
                <strong>Microsoft Clarity</strong> &mdash; session recording and heatmaps
                for UX analysis.
              </li>
              <li>
                <strong>Tawk.to</strong> &mdash; live chat widget for customer support.
              </li>
              <li>
                <strong>Stripe</strong> (or equivalent) &mdash; payment processing.
              </li>
              <li>
                <strong>LLM API providers</strong> (e.g., Anthropic, OpenAI, Google,
                Mistral) &mdash; AI model inference. Prompts and agent data sent to these
                providers are governed by their respective privacy policies and data
                processing terms. OpenLegion is not responsible for how third-party LLM
                providers handle data.
              </li>
            </ul>
            <p className="mt-2">
              We encourage you to review the privacy policies of these third-party
              services.
            </p>
          </section>

          {/* ── 5 ── */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              5. Data Sharing &amp; Disclosure
            </h2>
            <p>We may share your information only in the following circumstances:</p>
            <ul className="ml-5 mt-2 list-disc space-y-1">
              <li>
                <strong>Service providers:</strong> Third-party vendors who assist in
                operating the Service (hosting, payment processing, analytics) under
                contractual obligations to protect your data.
              </li>
              <li>
                <strong>Legal requirements:</strong> When required by law, subpoena, court
                order, or governmental request.
              </li>
              <li>
                <strong>Protection of rights:</strong> To enforce our Terms of Service,
                protect our rights or safety, or investigate fraud.
              </li>
              <li>
                <strong>Business transfers:</strong> In connection with a merger,
                acquisition, or sale of assets, your information may be transferred as part
                of that transaction.
              </li>
            </ul>
          </section>

          {/* ── 6 ── */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              6. Cookies &amp; Tracking Technologies
            </h2>
            <p>
              We use cookies and similar technologies (pixels, local storage) for
              analytics, functionality, and security purposes. The Website uses:
            </p>
            <ul className="ml-5 mt-2 list-disc space-y-1">
              <li>
                <strong>Essential cookies:</strong> Required for the Service to function
                (session management, authentication).
              </li>
              <li>
                <strong>Analytics cookies:</strong> Google Analytics and Microsoft Clarity
                cookies to understand how visitors interact with the Website.
              </li>
              <li>
                <strong>Third-party cookies:</strong> Set by Tawk.to for live chat
                functionality.
              </li>
            </ul>
            <p className="mt-2">
              You can control cookies through your browser settings. Disabling cookies may
              affect the functionality of the Service.
            </p>
          </section>

          {/* ── 7 ── */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              7. Data Retention
            </h2>
            <p>
              We retain your information for as long as your account is active or as needed
              to provide the Service. We may also retain information as necessary to comply
              with legal obligations, resolve disputes, and enforce our agreements. When
              data is no longer needed, we will delete or anonymize it within a reasonable
              timeframe.
            </p>
          </section>

          {/* ── 8 ── */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              8. Data Security
            </h2>
            <p>
              We implement commercially reasonable technical and organizational measures to
              protect your information. However,{" "}
              <strong>
                no method of transmission over the Internet or electronic storage is 100%
                secure. We cannot guarantee absolute security and are not liable for any
                unauthorized access, data breach, or loss of data.
              </strong>
            </p>
          </section>

          {/* ── 9 ── */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              9. Your Rights
            </h2>
            <p>
              Depending on your jurisdiction, you may have the following rights regarding
              your personal information:
            </p>
            <ul className="ml-5 mt-2 list-disc space-y-1">
              <li>
                <strong>Access:</strong> Request a copy of the personal information we hold
                about you.
              </li>
              <li>
                <strong>Correction:</strong> Request correction of inaccurate or incomplete
                data.
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your personal information,
                subject to legal retention requirements.
              </li>
              <li>
                <strong>Portability:</strong> Request your data in a structured,
                machine-readable format.
              </li>
              <li>
                <strong>Objection:</strong> Object to processing of your personal
                information for certain purposes.
              </li>
              <li>
                <strong>Opt-out of sale:</strong> We do not sell personal information. If
                this changes, we will provide a clear opt-out mechanism.
              </li>
            </ul>
            <p className="mt-2">
              To exercise any of these rights, contact us at{" "}
              <a
                href="mailto:privacy@openlegion.ai"
                className="text-accent underline underline-offset-2 hover:text-accent/80"
              >
                privacy@openlegion.ai
              </a>
              . We will respond within 30 days (or as required by applicable law).
            </p>
          </section>

          {/* ── 10 ── */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              10. California Residents (CCPA)
            </h2>
            <p>
              If you are a California resident, you have additional rights under the
              California Consumer Privacy Act (CCPA), including the right to know what
              personal information we collect, request deletion, and opt out of the sale of
              personal information. We do not sell personal information. To exercise your
              CCPA rights, contact{" "}
              <a
                href="mailto:privacy@openlegion.ai"
                className="text-accent underline underline-offset-2 hover:text-accent/80"
              >
                privacy@openlegion.ai
              </a>
              .
            </p>
          </section>

          {/* ── 11 ── */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              11. European Economic Area (GDPR)
            </h2>
            <p>
              If you are in the EEA, our legal basis for processing your personal data
              includes: (a) your consent; (b) performance of a contract; (c) compliance
              with a legal obligation; and (d) our legitimate interests (improving and
              securing the Service) where those interests are not overridden by your data
              protection rights.
            </p>
            <p className="mt-2">
              You may lodge a complaint with your local data protection authority if you
              believe we have violated your rights under the GDPR.
            </p>
          </section>

          {/* ── 12 ── */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              12. International Data Transfers
            </h2>
            <p>
              Your information may be transferred to and processed in the United States or
              other countries where our service providers operate. These countries may have
              different data protection laws than your jurisdiction. By using the Service,
              you consent to such transfers.
            </p>
          </section>

          {/* ── 13 ── */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              13. Children&apos;s Privacy
            </h2>
            <p>
              The Service is not directed to individuals under 18. We do not knowingly
              collect personal information from children. If we become aware that we have
              collected data from a child, we will delete it promptly.
            </p>
          </section>

          {/* ── 14 ── */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              14. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy at any time. Changes will be reflected by
              updating the &ldquo;Last updated&rdquo; date at the top of this page. Your
              continued use of the Service after any changes constitutes acceptance of the
              updated Privacy Policy.
            </p>
          </section>

          {/* ── 15 ── */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              15. Contact Us
            </h2>
            <p>
              If you have questions about this Privacy Policy or wish to exercise your
              rights, contact us at:
            </p>
            <p className="mt-2">
              <a
                href="mailto:privacy@openlegion.ai"
                className="text-accent underline underline-offset-2 hover:text-accent/80"
              >
                privacy@openlegion.ai
              </a>
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
