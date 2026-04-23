import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Link } from "@/i18n/navigation";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service for OpenLegion AI agent platform. Covers managed hosting, self-hosted deployment under BSL 1.1 license, and the openlegion.ai website.",
  alternates: { canonical: "https://www.openlegion.ai/terms" },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <>
      <a href="#main" className="skip-nav">
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="mx-auto max-w-3xl px-6 pb-24 pt-32 md:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-muted">
          Effective date: March 7, 2026 &middot; Last updated: March 7, 2026
        </p>

        <div className="prose-legal mt-10 space-y-8 text-sm leading-relaxed text-muted">
          {/* ── 1 ── */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              1. Agreement to Terms
            </h2>
            <p>
              By accessing or using the OpenLegion website (<strong>openlegion.ai</strong>),
              managed hosting service, self-hosted software, APIs, documentation, or any
              related services (collectively, the &ldquo;<strong>Service</strong>&rdquo;),
              you (&ldquo;<strong>Customer</strong>,&rdquo; &ldquo;<strong>you</strong>&rdquo;)
              agree to be bound by these Terms of Service
              (&ldquo;<strong>Terms</strong>&rdquo;). If you do not agree, do not use the
              Service.
            </p>
            <p className="mt-2">
              If you are using the Service on behalf of an organization, you represent that
              you have authority to bind that organization, and &ldquo;you&rdquo; refers to
              that organization.
            </p>
          </section>

          {/* ── 2 ── */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              2. Description of Service
            </h2>
            <p>
              OpenLegion provides an AI agent framework and optional managed hosting
              platform for deploying, orchestrating, and monitoring autonomous AI agents.
              The Service may include web dashboards, APIs, container orchestration,
              third-party LLM provider integrations, and related tooling.
            </p>
          </section>

          {/* ── 3 ── */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              3. Eligibility
            </h2>
            <p>
              You must be at least 18 years old and legally capable of entering into a
              binding agreement. The Service is not intended for use by anyone under the
              age of 18.
            </p>
          </section>

          {/* ── 4 ── */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              4. Accounts &amp; Security
            </h2>
            <p>
              You are responsible for maintaining the confidentiality of your account
              credentials and for all activity under your account. You agree to notify us
              immediately of any unauthorized access. We reserve the right to suspend or
              terminate accounts at our sole discretion, with or without notice, for any
              reason, including violation of these Terms.
            </p>
          </section>

          {/* ── 5 ── */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              5. Acceptable Use
            </h2>
            <p>You agree not to use the Service to:</p>
            <ul className="ml-5 mt-2 list-disc space-y-1">
              <li>Violate any applicable law, regulation, or third-party right;</li>
              <li>
                Generate, distribute, or store content that is unlawful, harmful,
                threatening, abusive, defamatory, or otherwise objectionable;
              </li>
              <li>
                Transmit malware, viruses, or any code designed to disrupt, damage, or
                limit the functionality of any software or hardware;
              </li>
              <li>
                Attempt to gain unauthorized access to the Service, other accounts, or
                systems connected to the Service;
              </li>
              <li>
                Use the Service for cryptocurrency mining, denial-of-service attacks, spam,
                or any activity that degrades performance for other users;
              </li>
              <li>
                Reverse-engineer, decompile, or disassemble any proprietary component of
                the Service beyond what is permitted by the applicable open-source license;
              </li>
              <li>
                Resell, sublicense, or redistribute the managed hosting Service without
                prior written consent;
              </li>
              <li>
                Use AI agents deployed on the Service to engage in fraud, impersonation,
                harassment, or any illegal activity.
              </li>
            </ul>
            <p className="mt-2">
              We may investigate violations and, at our sole discretion, immediately
              terminate or suspend your access without notice and without refund.
              This applies to violations of these Terms only — good-faith refund requests
              within the money-back guarantee window are handled separately under
              Section 6.
            </p>
          </section>

          {/* ── 6 ── */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              6. Fees, Billing &amp; Refunds
            </h2>
            <p>
              Certain features of the Service may require payment. All fees are stated on
              our pricing page and are billed in advance on a recurring basis.
            </p>
            <p className="mt-2">
              <strong>Money-back guarantee.</strong> New customers may request a full
              refund of their first subscription payment within 14 days of that payment.
              Refunds are processed via our payment processor and typically settle within
              5 business days. Receiving a refund cancels your subscription immediately,
              and your hosted instance is taken offline within 24 hours. Welcome credits
              granted with the refunded subscription are reclaimed at the time of refund.
              Customers who receive a money-back refund are not eligible for a second
              money-back refund or a second welcome-credits grant on a future
              subscription. See our{" "}
              <Link href="/money-back-guarantee" className="underline">
                Money-Back Guarantee
              </Link>{" "}
              page for full terms.
            </p>
            <p className="mt-2">
              Outside the 14-day money-back window, fees are non-refundable except where
              required by applicable law. We reserve the right to change pricing at any
              time with 30 days&apos; notice. Continued use after a price change
              constitutes acceptance of the new pricing.
            </p>
            <p className="mt-2">
              You are solely responsible for all third-party costs incurred through your
              use of the Service, including but not limited to LLM API provider charges,
              cloud infrastructure fees, and domain registration costs. OpenLegion is not
              liable for any third-party charges.
            </p>
          </section>

          {/* ── 7 ── */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              7. Intellectual Property
            </h2>
            <p>
              The OpenLegion framework source code is licensed under the Business Source
              License 1.1 (BSL 1.1). These Terms do not grant you any rights beyond what
              that license permits. All trademarks, logos, and branding elements of
              OpenLegion are the property of the OpenLegion project and may not be used
              without prior written consent.
            </p>
            <p className="mt-2">
              You retain ownership of all data, content, and configurations
              (&ldquo;<strong>Customer Data</strong>&rdquo;) you submit to the Service.
              You grant us a limited, non-exclusive license to host and process Customer
              Data solely to provide the Service.
            </p>
          </section>

          {/* ── 8 ── */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              8. Third-Party Services &amp; LLM Providers
            </h2>
            <p>
              The Service integrates with third-party LLM providers (e.g., Anthropic,
              OpenAI, Google, Mistral, and others). Your use of those providers is governed
              by their respective terms of service and privacy policies.{" "}
              <strong>
                OpenLegion makes no representations or warranties regarding any third-party
                service, and is not responsible for the output, accuracy, availability, or
                conduct of any third-party LLM or API.
              </strong>
            </p>
          </section>

          {/* ── 9 ── */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              9. AI Agent Output &amp; Autonomous Actions
            </h2>
            <p>
              AI agents deployed through the Service operate autonomously based on your
              configuration.{" "}
              <strong>
                You are solely responsible for the actions, outputs, and consequences of
                any AI agents you deploy, configure, or operate using the Service.
              </strong>{" "}
              OpenLegion does not control, review, or endorse agent outputs and accepts no
              liability for damages arising from agent behavior, including but not limited
              to financial losses, data corruption, incorrect information, or unintended
              actions taken by agents.
            </p>
          </section>

          {/* ── 10 ── */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              10. DISCLAIMER OF WARRANTIES
            </h2>
            <p className="uppercase">
              THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo;
              WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY,
              INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS
              FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. OPENLEGION DOES NOT
              WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE
              OF VIRUSES OR OTHER HARMFUL COMPONENTS. NO ADVICE OR INFORMATION, WHETHER
              ORAL OR WRITTEN, OBTAINED FROM OPENLEGION OR THROUGH THE SERVICE SHALL
              CREATE ANY WARRANTY NOT EXPRESSLY STATED HEREIN.
            </p>
            <p className="mt-2 uppercase">
              OPENLEGION DOES NOT WARRANT THE ACCURACY, COMPLETENESS, OR USEFULNESS OF ANY
              OUTPUT GENERATED BY AI AGENTS, LLM PROVIDERS, OR ANY OTHER COMPONENT OF THE
              SERVICE. YOU ACKNOWLEDGE THAT AI-GENERATED CONTENT MAY BE INACCURATE,
              INCOMPLETE, OR HARMFUL, AND YOU USE SUCH CONTENT AT YOUR OWN RISK.
            </p>
          </section>

          {/* ── 11 ── */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              11. LIMITATION OF LIABILITY
            </h2>
            <p className="uppercase">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL
              OPENLEGION, ITS OWNER, OPERATORS, CONTRIBUTORS, AFFILIATES, OR LICENSORS BE
              LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR
              PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO DAMAGES FOR LOSS OF PROFITS,
              GOODWILL, USE, DATA, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR IN
              CONNECTION WITH YOUR USE OF OR INABILITY TO USE THE SERVICE, REGARDLESS OF
              THE THEORY OF LIABILITY (CONTRACT, TORT, STRICT LIABILITY, OR OTHERWISE) AND
              EVEN IF OPENLEGION HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
            <p className="mt-2 uppercase">
              IN NO EVENT SHALL OPENLEGION&apos;S TOTAL AGGREGATE LIABILITY FOR ALL CLAIMS
              ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICE EXCEED THE GREATER
              OF (A) THE TOTAL AMOUNT YOU PAID TO OPENLEGION IN THE TWELVE (12) MONTHS
              PRECEDING THE CLAIM, OR (B) FIFTY UNITED STATES DOLLARS (US $50.00).
            </p>
            <p className="mt-2 uppercase">
              SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR LIMITATION OF CERTAIN
              DAMAGES. IN SUCH JURISDICTIONS, OPENLEGION&apos;S LIABILITY SHALL BE LIMITED
              TO THE FULLEST EXTENT PERMITTED BY LAW.
            </p>
          </section>

          {/* ── 12 ── */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              12. Indemnification
            </h2>
            <p>
              You agree to indemnify, defend, and hold harmless OpenLegion, its owner,
              operators, contributors, and affiliates from and against any and all claims,
              damages, losses, liabilities, costs, and expenses (including reasonable
              attorneys&apos; fees) arising out of or related to: (a) your use of the
              Service; (b) your violation of these Terms; (c) your violation of any
              third-party right, including any intellectual property or privacy right; (d)
              the actions, outputs, or consequences of any AI agents you deploy using the
              Service; or (e) any Customer Data you submit to the Service.
            </p>
          </section>

          {/* ── 13 ── */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              13. Service Availability &amp; Modifications
            </h2>
            <p>
              We do not guarantee any specific uptime or availability. The Service may be
              modified, suspended, or discontinued at any time, with or without notice. We
              are not liable to you or any third party for any modification, suspension, or
              discontinuation of the Service.
            </p>
          </section>

          {/* ── 14 ── */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              14. Termination
            </h2>
            <p>
              We may terminate or suspend your access to the Service immediately, without
              prior notice or liability, for any reason, including breach of these Terms.
              Upon termination, your right to use the Service ceases immediately. Sections
              that by their nature should survive termination (including, without
              limitation, Sections 10, 11, 12, 16, and 17) shall survive.
            </p>
            <p className="mt-2">
              You may terminate your account at any time by discontinuing use of the
              Service. We are under no obligation to retain your data after termination.
            </p>
          </section>

          {/* ── 15 ── */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              15. Modifications to Terms
            </h2>
            <p>
              We reserve the right to modify these Terms at any time. Material changes will
              be communicated by updating the &ldquo;Last updated&rdquo; date at the top
              of this page. Your continued use of the Service after changes are posted
              constitutes acceptance of the revised Terms. It is your responsibility to
              review these Terms periodically.
            </p>
          </section>

          {/* ── 16 ── */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              16. Governing Law &amp; Dispute Resolution
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of
              the State of Delaware, United States, without regard to its conflict-of-law
              provisions. Any dispute arising under or in connection with these Terms shall
              be resolved exclusively through binding arbitration administered by the
              American Arbitration Association (AAA) under its Commercial Arbitration
              Rules. The arbitration shall take place remotely (via telephone, video
              conference, or written submissions) unless both parties agree otherwise. The
              arbitrator&apos;s award shall be final and binding and may be entered as a
              judgment in any court of competent jurisdiction.
            </p>
            <p className="mt-2">
              <strong>
                YOU AGREE THAT ANY DISPUTE RESOLUTION PROCEEDINGS WILL BE CONDUCTED ONLY ON
                AN INDIVIDUAL BASIS AND NOT IN A CLASS, CONSOLIDATED, OR REPRESENTATIVE
                ACTION.
              </strong>{" "}
              If this class-action waiver is found to be unenforceable, then the entirety
              of this arbitration provision shall be null and void.
            </p>
          </section>

          {/* ── 17 ── */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              17. General Provisions
            </h2>
            <ul className="ml-5 list-disc space-y-2">
              <li>
                <strong>Entire Agreement.</strong> These Terms, together with our Privacy
                Policy, constitute the entire agreement between you and OpenLegion.
              </li>
              <li>
                <strong>Severability.</strong> If any provision of these Terms is held
                invalid or unenforceable, that provision shall be enforced to the maximum
                extent permissible, and the remaining provisions shall remain in full force.
              </li>
              <li>
                <strong>Waiver.</strong> No waiver of any term shall be deemed a further or
                continuing waiver of such term or any other term.
              </li>
              <li>
                <strong>Assignment.</strong> You may not assign or transfer these Terms
                without our prior written consent. We may assign these Terms without
                restriction.
              </li>
              <li>
                <strong>Force Majeure.</strong> OpenLegion shall not be liable for any
                failure or delay caused by events beyond our reasonable control, including
                natural disasters, war, terrorism, pandemics, labor disputes, government
                actions, power failures, internet or telecommunications failures, or
                third-party service outages.
              </li>
              <li>
                <strong>No Agency.</strong> Nothing in these Terms creates a partnership,
                joint venture, employment, or agency relationship between you and
                OpenLegion.
              </li>
            </ul>
          </section>

          {/* ── 18 ── */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              18. Contact
            </h2>
            <p>
              Questions about these Terms? Contact us at{" "}
              <a
                href="mailto:support@openlegion.ai"
                className="text-accent underline underline-offset-2 hover:text-accent/80"
              >
                support@openlegion.ai
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
