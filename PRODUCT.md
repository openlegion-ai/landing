# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary (since the 2026-11-03 pivot, R12/R25): **builders at SaaS companies**: technical founders, staff engineers and product leads who want to put AI agents inside their own product, one per customer, under their own brand. They read this page at a desk with an editor and a terminal open, often arriving from a coding agent, a link or a comparison search, and they judge us the way they judge Stripe: by the code sample, the docs, test mode, webhooks and pricing clarity. Secondary: their CTO or security reviewer, who reads /security; developers arriving through the ~600 learn and comparison articles.

The direct product (AI employees for teams) is **frozen behind its waitlist** and is our reference app. It is no longer what the site sells.

## Product Purpose

OpenLegion is **AI agents for SaaS, the way Stripe is payments for SaaS**. A partner defines an agent product as code (template, tools, limits), creates one OpenLegion **workspace per end customer** with one API call, and puts the agent in its own UI. OpenLegion runs the harness: every action policy-checked and receipted, approvals at three walls, per-customer credit caps, a vault the model never sees, and signed webhooks back to the partner. Success for the landing surface: a builder understands this in one viewport, believes the integration is ten minutes and the controls are real, and requests early access.

## Positioning

The partner owns the customer; we run the agent. Mechanisms a neighbouring product could not truthfully copy:

- **One workspace per end customer**: the unit of isolation (row-level security), money and fairness. Test and live are separate worlds inside one org; a mismatched key gets a 404, not a 403.
- **Every agent side effect is an intent through one policy engine**: checked before it runs, with a receipt.
- **Approvals at three walls only**: reaching a third party, deleting data, acting on untrusted content. The partner's own user decides in the partner's UI, and the decision is recorded as theirs.
- **Per-customer caps that mirror the partner's plans**: one prepaid org pool, monthly/daily caps, `period_anchor`, credit grants for top-ups; a reached cap is a typed refusal plus `workspace.cap_reached`.
- **Tools are the partner's own functions** (`defineTool`, or their MCP server), called with a signed request naming the customer (`ol_signed`). Each tool declares its `effect` (read/draft/write/egress).
- **Hard invariant (K2): OpenLegion never contacts a partner's end customer.** Everything leaves through the partner's webhooks and API.
- **Stripe-grade conventions**: `olp_test_`/`olp_live_` keys, idempotency, prefixed ids, dated versions, `Request-Id`, signed webhooks with rotation overlap, an events API.

## Operating Context

The buyer reads in daylight at a desk, mid-build, comparing "build the harness ourselves" against "buy it". Their security reviewer may read /security and /pricing later. Many will hand the integration to Claude Code, Cursor or Codex, so `llms.txt` and the docs matter as much as the page.

## Capabilities and Constraints

- **Pre-launch, private beta.** The decided wire is `platform/docs/plans/contracts/PLATFORM-API-v1.md`; the integration kit (PL-DX: `npx openlegion init`, `ol dev`, `defineTool`, `defineAgent`, `<AgentChat>`) is planned, not shipped. Code on the site is labelled a preview of the kit's API.
- **CTA:** "Request early access" → the existing waitlist sign-in (`WAITLIST_URL`); "Book a call" → `DEMO_URL`. J-5 (self-serve test mode) is OPEN: never claim self-serve test mode.
- **Pricing (R24) is OPEN.** /pricing explains how billing works (org pool, per-customer caps, grants, test allowance) and says partner pricing is shared with early-access partners. **No dollar figures for partners.** Every planning figure in the platform docs is internal (rule 24).
- **npm:** `openlegion` and `@openlegion/*` were unclaimed on 2026-11-04. Never give the install command a copy button until the names are reserved.
- **13 locales** (en, de, es, fr, pt, ru, hi, th, ja, ko, zh, zh-TW, ar), `ar` RTL. New copy lands in English first; locales fall back to English (`src/i18n/request.ts` deep-merge) until translated. The translation pass must land before launch.
- **SEO asset, hard constraint:** URLs, slugs, the learn/comparison titles, H1s and bodies, sitemap, hreflang and the JSON-LD entity graph are preserved. The homepage ranks for brand only (GSC Jun–Oct 2026), so it may be repositioned; the earning pages restyle only through shared templates. Footer links to the earning pages stay.
- Stack: Next.js 16 (App Router) + Tailwind 4 + next-intl; content from markdown.

## Brand Commitments

- Name **OpenLegion**, domain www.openlegion.ai, logo `public/logo.png`.
- 2026-11-04: the **Specimen** (security print) build was rejected on sight ("we want to be like stripe"). Jeff then approved comp A: **product-grade dark**. That means the incumbent near-black and blue brand held to Stripe-grade polish, real product UI instead of concept art, and one authored motion moment: a simple agent chat inside a partner's own app.
- History: the light "Enterprise Standard" build (Aug–Nov 2026), the glowing-blue effects of the old dark site (gradient text, glass, particles) and Specimen are all retired. Jeff called the light build "trash" on 2026-11-03; any redesign is screenshot-reviewed with him before merge.
- Voice: plain, concrete, no hype; claims must be mechanically true of the contract or the shipped harness.

## Evidence on Hand

- **Real:** the decided API contract (routes, events, ids, signature scheme); the shipped harness (policy engine, receipts, approvals, vault, metering, RLS, kill switch at step boundary #185); partner #1 is our own social-publishing product (8 tools, one workspace per brand). Do not name it publicly without Jeff's OK.
- **Not real, never present as real:** customer logos, quotes, case studies, benchmarks, usage numbers, compliance certifications (no SOC 2 / ISO / HIPAA). Demo data in the hero chat and the illustrated panels is labelled illustrative.

## Product Principles

1. **Prove control, not magic.** Receipts, walls, caps and the vault are the story, because they are the mechanism.
2. **The builder's ten minutes.** Show the code they will write, not a diagram of ours.
3. **The partner owns the customer.** No OpenLegion brand, email or login ever reaches their users.
4. **Honest proof only.** Previews are labelled previews; nothing synthetic is presented as real.

## Accessibility & Inclusion

Skip-nav, `:focus-visible` outlines, `prefers-reduced-motion` guards on all animation, semantic prose and tables, RTL logical properties, and type stacks that hold up in CJK, Thai, Devanagari and Arabic.
