# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: owners and operations leads at 5–200-person companies ("SMB → mid-market ops") evaluating whether to put AI agents to work on recurring business tasks. They evaluate during the workday, at a desk, often comparing vendors; Team ($99) is the center of gravity and Enterprise ($1,500+) the ceiling the page must dress for. Secondary: technical founders and developers who arrive via the learn/comparison content.

## Product Purpose

OpenLegion is a web platform where you describe the team you want and it staffs AI agents ("AI employees") that do recurring business work. v2 is inbox-first: the human's job is to unblock and review (approvals, questions, deliverables, failures in one queue), not to watch. Work is organized goals → tasks → agents; agents live where work happens (Slack, Telegram, email, webhooks — first responder wins). Success for the landing surface: a visitor understands what this is, believes it is safe to hand work to, and signs up or books a demo.

## Positioning

Control you can audit, not magic you must trust. Mechanisms a neighboring product could not truthfully copy:

- Every agent side effect is an **intent through one policy engine** — approvals, receipts. Decisions are made in the app's Needs-you view (channels can notify; they do not yet decide).
- Approvals stop work at **three walls only** — reaching a third party on your behalf, deleting data, acting on untrusted content — so a card still means something when it appears.
- **Per-agent budgets and exact cost-per-task**; every unit of work is a recorded, replayable **wake**, metered in credits at $0.001 each.
- Credentials live in a **vault agents can never see** (brokered and injected outside the model, which only holds a handle).
- Agents are rows, not servers: creating one is instant, an idle agent costs ~nothing, a workspace can run hundreds.

## Operating Context

The buyer reads this page in office light, mid-workday, likely after a search or a comparison query. Their team already lives in Slack/Teams/email; agents must join those places rather than demand a new one. Procurement-adjacent eyes (IT, finance) may review the security and pricing pages.

## Capabilities and Constraints

- **Ships at v2 launch, on a branch until then.** The live site (this repo's Vercel project → www.openlegion.ai) keeps serving current content until the launch window. CTA at launch: **sign in with Google** (the only sign-in method at launch — no GitHub, no email/password) + "Book a demo" for Team/Enterprise.
- **Pricing truth (decided 2026-08-27, credits re-denominated 2026-08-28):** Free $0, no card, chat-only, **1,000 one-time credits** · Pro $29/month with **10,000 credits** · Team $99/month with **35,000 credits** · Enterprise from $1,500. **1 credit = $0.001**; included credits refresh each billing month, purchased packs never expire. Never invent other numbers, discounts, SLAs, or a yearly price — there is no yearly plan.
- **Model presets (decision D9, 2026-09-17):** the page names **Smartest / Smart / Normal**, never model ids, and **BYOK is not offered** (built, hidden).
- **Channels at launch, per plan:** web chat everywhere · Telegram + webhooks from Pro · Slack + inbound email on Team and above (no Discord, WhatsApp, CLI, or outbound email). **Connectors:** Google Calendar and the Google Drive files the user picks. **No browser automation, no MCP, no skills** at launch.
- **13 locales** (en, de, es, fr, pt, ru, hi, th, ja, ko, zh, zh-TW, ar) with a translation pipeline; **ar is RTL** — the design must be logical-property/RTL-safe and hold up in CJK, Thai, and Devanagari. Every copy change fans out ×13.
- **SEO asset — hard constraint:** URL structure, slugs, ranking-page titles/H1s, sitemap, hreflang alternates, and the JSON-LD entity graph are preserved. Homepage repositioning is allowed; ~600 learn/comparison pages restyle only through the shared content templates.
- Stack is settled: Next.js 16 (App Router) + Tailwind 4 + next-intl; content from markdown with a derivative-generation prebuild.

## Brand Commitments

- Name **OpenLegion**, domain www.openlegion.ai; existing logo at `public/logo.png`; open-source core at github.com/openlegion-ai/openlegion (real stars, fetched live).
- Jeff (owner), 2026-08-27, binding steer: **away from** the dark near-black + glowing-blue "tech startup" look; the surface must read **enterprise-credible** to an ops buyer.
- Jeff (owner), 2026-08-28, standing preference — **the category standard, played straight**: the polished light enterprise SaaS page. Craft bar: Stripe, Linear, Notion, Datadog/Vanta — adopting the best of each plus what the current site does well (produced product frames, live dashboard mock). Concept-heavy visual worlds (e.g. the 2026-08-27 "Letter of Engagement" build, parked on `redesign/letter-of-engagement`) were rejected: "we should just work off revising our original."
- The original site's **copy is an SEO asset and is preserved byte-identical** in redesigns (all 13 locales); copy changes only via the deliberate launch truth pass. **That pass ran on 2026-09-17 (PROD-PLAN lane L, session 1): English + structure rewritten to v2 truth on `redesign/enterprise-standard`; the 12 locales carry English placeholders for every changed key until session 2.**
- Voice: plain, concrete, no hype; claims must be mechanically true of the product.

## Evidence on Hand

- **Real:** the product's own v2 screens (inbox, wake inspector with cost-per-task, memory screen, usage dashboard) — demonstrable as genuine product UI; the architecture facts in Positioning; live GitHub star count; ~600 authored learn/comparison articles.
- **Not real — never present as real:** the current testimonials + avatars (`public/avatars/`, synthetic — drop them; earn trust with real material); any customer names, logos, quotes, case studies, or benchmarks (none exist yet); compliance certifications (no SOC 2 / ISO — do not claim).
- **Dropped 2026-09-17:** `public/demo.mp4` (the old VPS product) is no longer on the page — the hero carries a static product frame until a v2 recording exists. The file stays in `public/` unreferenced; the homepage `VideoObject` JSON-LD went with it.
- The money-back-guarantee page is a standing commercial commitment: **decision D8 (2026-09-17) keeps it**, reworded for Stripe and the Free/Pro/Team tiers.

## Product Principles

1. **Prove control, not magic** — approvals, receipts, budgets, and the vault are the story, because they are the mechanism.
2. **Honest proof only** — nothing synthetic presented as real; demonstration material is labeled.
3. **Work happens where you already work** — channels-first is a feature, show it.
4. **Cheap to start, safe to scale** — $0 no-card entry and hundreds-of-agents ceiling are both true; say both.

## Accessibility & Inclusion

Existing standards to preserve: skip-nav, `:focus-visible` outlines, `prefers-reduced-motion` guards on all animation, semantic prose/tables in content pages. RTL is first-class, not a variant.
