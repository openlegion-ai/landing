# Google AI Optimization Guide — Coverage Review

**Date:** 2026-06-05
**Source:** [Optimizing for Generative AI features on Google Search](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) (+ the linked [AI Features and Your Website](https://developers.google.com/search/docs/appearance/ai-features) and [Robots Meta Tag](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag) docs)
**Scope:** Map every recommendation in Google's guide to the current state of this landing site, then list gaps and prioritized improvements.

---

## TL;DR

Google's core message is blunt: **AI features (AI Overviews, AI Mode) are still powered by core Search ranking + quality systems, so "GEO/AEO" is still SEO.** The guide debunks the idea that you need new files or markup, and names **four things that actually work**: (1) non-commodity content with a unique point of view, (2) crawlable + indexable pages eligible for a snippet, (3) **images and video**, and (4) strong E-E-A-T. It adds a newer section on **agentic experiences** (browser agents reading the DOM, accessibility tree, and visual rendering).

This site already covers the overwhelming majority of the guide. The infrastructure (robots, snippet controls, hreflang, structured data `@graph`, semantic/accessible components) is mature and, in several places, ahead of the guidance. **The real gaps are concentrated in two of Google's four pillars: multimodal assets (images/video) inside content pages, and named-author E-E-A-T.** Everything else is polish.

Legend: ✅ covered · 🟡 partial / improvable · ❌ gap

---

## 1. "AI features are still Search" — foundational SEO

> *"The best practices for SEO continue to be relevant because our generative AI features on Google Search are rooted in our core Search ranking and quality systems. Your content still needs to be indexed, crawlable, and eligible to appear with a snippet."*

| Requirement | Status | Evidence |
| --- | --- | --- |
| Indexable (`index,follow`) | ✅ | `src/app/[locale]/layout.tsx` robots block + per-page metadata |
| Eligible for a snippet | ✅ | `max-snippet: -1`, `max-image-preview: large`, `max-video-preview: -1` set globally |
| Crawlable | ✅ | `src/app/robots.ts` allows `/` for `*` and every named AI UA |
| Canonical + hreflang | ✅ | `alternates.canonical` + `languages` map with `x-default`; untranslated locales fall back to `/en/<slug>` with `noindex,follow` |
| XML sitemap with lastmod | ✅ | `src/app/sitemap.ts` — content-driven lastmod, stable nav anchor (avoids the "always recent → ignored" antipattern) |

**Verdict:** Fully covered. Nothing to do.

---

## 2. Snippet & AI-feature controls (`nosnippet`, `max-snippet`, `data-nosnippet`, `Google-Extended`)

Google: to *limit* what AI features show, use `nosnippet` / `data-nosnippet` / `max-snippet` / `noindex`; to limit AI **training/grounding** in *other* Google systems use `Google-Extended` (a separate control from AI features in Search — conflating them is the common mistake).

| Item | Status | Notes |
| --- | --- | --- |
| Not accidentally suppressing snippets | ✅ | We explicitly opt **in** to full snippets/images/video — correct for maximizing AI-feature eligibility |
| `Google-Extended` understood as separate from Search | ✅ | `robots.ts` lists it as an opt-in AI-training stanza, not a Search control |
| `data-nosnippet` on boilerplate | 🟡 → **improvement** | Nothing uses `data-nosnippet`. AI Overviews/AI Mode can quote chrome (launch pricing band, live-chat text, nav) instead of the substantive answer. Marking boilerplate with `data-nosnippet` nudges extraction toward real content. Low effort, on-guide. |
| AI-bot robots stanzas mirror `*` disallows | 🟡 → **improvement** | The `*` rule disallows `/_next/` and `/api/`; the per-bot stanzas only set `allow: "/"`, so AI bots are implicitly allowed into `/_next/` + `/api/`. Harmless today but inconsistent — mirror the disallows. |

---

## 3. Unique, non-commodity content + E-E-A-T

> *Four things that work: non-commodity content with a unique point of view … and strong E-E-A-T signals.* Google's example of good content: a first-hand, experience-led piece ("Why We Waived the Inspection & Saved Money…").

| Item | Status | Notes |
| --- | --- | --- |
| Unique POV enforced | ✅ | `CONTENT_GUIDE.md` mandates an opinionated "OpenLegion's Take"/TL;DR section; validator hard-fails generic content |
| Anti-duplication | ✅ | TF-IDF cosine near-dup detection (`MAX_SIMILARITY = 0.30`) across the corpus |
| Answer-first lede | ✅ | 35–90-word lede directly after H1 — exactly what AI Overviews extract |
| FAQ depth | ✅ | ≥5 H3 Q&As with direct 2–4 sentence answers, FAQPage schema |
| Freshness | ✅ | `last_updated` required; validator warns >12 months |
| **Named-author E-E-A-T** | 🟡 → **improvement** | The `author` frontmatter field exists and is documented as an "E-E-A-T byline," but it only feeds the `article:author` OG meta tag. The **Article JSON-LD always hardcodes `author: { @id: ORG }`** (Organization), never a `Person`. There is no visible byline, no author bio, no `sameAs`/`jobTitle`, no `reviewedBy`. Google's helpful-content + E-E-A-T systems favor identifiable expert authors. |
| First-hand experience signals | 🟡 | Content is well-argued but text-only. The guide's own example rewards original screenshots, benchmarks, and lived experience — see §4. |

**Recommendation (author E-E-A-T):** wire the existing `author` frontmatter into a `Person` author on the Article schema (with `sameAs` to a profile and optional `jobTitle`), render a visible byline + short bio block, and consider `/authors/<slug>` entity pages. This is the single highest-leverage E-E-A-T move and the field is already half-built for it.

---

## 4. Multimodal — images and video  ← **biggest gap**

> *"High-quality images and videos are appreciated by people searching online, and generative AI search features can bring in relevant images and video, creating more opportunities for websites to appear beyond web page links."*

| Surface | Status | Notes |
| --- | --- | --- |
| Homepage video | ✅ | `VideoObject` schema with thumbnail, duration, contentUrl, embedUrl (`src/app/[locale]/page.tsx`) |
| Homepage primary image | ✅ | `ImageObject` (OG card) |
| **In-content images/diagrams** | ❌ → **improvement** | Across **37 English content pages** (`/learn/*`, `/comparison/*`), there are **zero** in-body images, diagrams, or screenshots. The only image per page is the auto-generated OG **text card**, which won't surface as an informative image in AI results. This directly misses one of Google's four named pillars. |
| **In-content video** | ❌ | No content page embeds or references video. A single architecture/demo clip embedded on hub pages would open the "appear beyond web links" surface. |
| Markdown image pipeline hardening | 🟡 → **improvement** | The renderer (`src/lib/markdown.ts`) post-processes tables and CTAs but does **not** touch `<img>`. If authors add images today they'd ship without `loading="lazy"`, `decoding="async"`, explicit `width`/`height` (CLS risk), or `<figure>`/`<figcaption>`. The validator requires non-generic alt text — good — but the render path isn't ready. |
| `ImageObject` for content primary image | 🟡 | Article/WebPage `image` points at the OG text card. A real per-page diagram (with its own `ImageObject` + descriptive caption) would be far more useful to AI image surfaces. |
| Image sitemap entries | 🟡 | `sitemap.ts` emits no `image:`/`video:` extensions. Worth adding once real assets exist. |

**Recommendation:** Treat "one meaningful diagram/screenshot per key page (+ a demo video on the hubs)" as a content initiative, and in parallel harden the markdown `<img>` pipeline (lazy/async/dimensions/figure) + emit an `ImageObject` from an optional frontmatter `image` field so the assets are schema-visible. This closes the most material gap relative to the guide.

---

## 5. Page experience

> *Pages that are hard to use, slow, cluttered, unstable, or confusing create a worse post-click experience and are less likely to support strong outcomes over time.*

| Item | Status | Notes |
| --- | --- | --- |
| Reduced-motion respect | ✅ | All animations gated behind `@media (prefers-reduced-motion: no-preference)` |
| Font loading | ✅ | `display: swap`, scoped subsets |
| Resource hints | ✅ | `preconnect`/`dns-prefetch` for GTM, GA, Clarity, Tawk |
| Stable layout (CLS) | ✅ | `<Image>` with explicit dimensions; sticky header reserved |
| Third-party script weight | 🟡 → **watch** | Three trackers load at runtime: GA (`afterInteractive`), Clarity (`afterInteractive`), Tawk.to live chat (`lazyOnload`). Tawk is a known LCP/INP/main-thread cost even when lazy. Recommend a CrUX/field-data check on INP and consider deferring Clarity to `lazyOnload`. No code defect — purely a "not cluttered/slow" coverage item. |

---

## 6. Structured data

> *Structured data isn't required for generative AI search and there's no special schema … but it's a good idea to continue using it for rich-results eligibility.*

| Item | Status | Notes |
| --- | --- | --- |
| Site `@graph` (Org, WebSite, SoftwareApplication, SoftwareSourceCode, Service) | ✅ | Single consolidated `@graph` with stable `@id` cross-refs — the canonical pattern |
| Page schemas (WebPage, Article, CollectionPage, FAQPage, BreadcrumbList, ItemList) | ✅ | `src/components/json-ld.tsx` + `content-page.tsx` |
| `speakable`, `mentions` (verified `sameAs`) | ✅ | Entity-resolution-friendly; sameAs audited |
| `VideoObject` / `ImageObject` | ✅ (home) / 🟡 (content) | See §4 |
| `HowTo` schema | 🟡 | Home already **dropped** HowTo (correct — Google deprecated HowTo rich results for non-recipe content in late 2023). But `CONTENT_GUIDE.md` still lists `HowTo` as a schema type and `json-ld.tsx` still builds it for content pages. Harmless, but it no longer earns a SERP feature — worth a doc note so authors don't over-invest in it. |

**Verdict:** Strong and arguably over-delivered (the guide stresses structured data is *optional* for AI features). Keep it for rich results; no expansion needed beyond §4's media objects.

---

## 7. The myths Google explicitly debunks

| Myth | Google's position | Our state |
| --- | --- | --- |
| Need `llms.txt` / AI text files | **Not needed** | We ship `llms.txt` + `llms-full.txt`. Harmless and potentially useful for *other* engines (this guide only speaks for Google) — keep, but don't treat as a Google-ranking lever. |
| Need to "chunk" content for AI | **Not needed** — Google understands multi-topic pages | We don't force chunking; fine. |
| Need special schema/markup | **Not required** | We use standard schema.org for rich results — aligned. |

No action — but worth recording internally that the heavy `llms.txt` investment is **not** what makes content appear in Google's AI features (per Google). It may still help non-Google assistants.

---

## 8. Agentic experiences (browser agents)

> *Browser agents gather data via visual rendering, DOM structure, and the accessibility tree.* Recommendations: semantic HTML (`<button>`/`<a>` over styled `<div>`), stable layouts, `<label for>` linked to inputs, `cursor: pointer` on clickables.

| Signal | Status | Evidence |
| --- | --- | --- |
| Semantic interactive elements | ✅ | Quickstart tabs = real `<button>` with `role="tab"`/`aria-selected`/`aria-controls`; audience cards = `<button>`; nav = `<nav>`/`<a>`/`<Link>`/`<button>` |
| Accessibility tree fidelity | ✅ | `aria-label`/`aria-expanded` on icon controls, `aria-hidden` on decorative SVGs, `role="tablist"`, `aria-current` on breadcrumb |
| Native form controls + labels | ✅ | Language switcher = native `<select>` with `aria-label` (not a div-menu) |
| `cursor: pointer` on clickables | ✅ | e.g. audience-selector buttons; native buttons inherit pointer |
| Stable layout across pages | ✅ | Shared sticky header/footer, consistent section shells |
| Skip-to-content | ✅ | `<a href="#main" class="skip-nav">` |
| Heading anchor IDs (agent deep-linking) | 🟡 (minor) | Markdown headings render without `id` slugs, so agents/users can't deep-link to a section. Adding `rehype-slug` would help both agents and humans. |

**Verdict:** This is the standout strength — the site is already built "for agents, not just humans" as the guide urges. Only the heading-anchor nicety remains.

---

## Prioritized action list

**P1 — closes a named Google pillar**
1. **Multimodal in content (§4):** add at least one meaningful diagram/screenshot per key `/learn` + `/comparison` page and a demo video on the hubs; emit `ImageObject` from an optional frontmatter `image`.
2. **Markdown `<img>` hardening (§4):** add `loading="lazy"`, `decoding="async"`, dimensions, and `<figure>/<figcaption>` in the render pipeline so authored images are CLS-safe and schema-visible.
3. **Named-author E-E-A-T (§3):** wire `author` frontmatter → `Person` author in Article schema + visible byline/bio.

**P2 — low-effort, on-guide polish**
4. **`data-nosnippet` on boilerplate (§2):** launch pricing band, live-chat, nav — so AI features quote substance, not chrome.
5. **Align AI-bot robots disallows (§2):** mirror `/_next/` + `/api/` disallows into the per-bot stanzas.
6. **`rehype-slug` heading anchors (§8):** agent + human deep-linking.

**P3 — verify / document**
7. **INP/CWV field check (§5):** confirm Tawk.to/Clarity aren't degrading INP; consider deferring Clarity.
8. **HowTo deprecation note (§6):** document that HowTo no longer earns rich results so authors don't over-invest.
9. **Record (§7):** `llms.txt` is not a Google AI-features lever (keep for other engines).

---

## Bottom line

Against Google's own checklist this site scores well: **pillars 1 (crawl/index/snippet), 2 (structured data, optional), and 4-agentic (build for agents) are essentially complete and in places ahead of the guidance.** The concentrated, real opportunity is **pillar — multimodal images/video inside content — and named-author E-E-A-T**, plus a handful of low-effort polish items (`data-nosnippet`, robots parity, heading anchors). Addressing P1 + P2 gives full, defensible coverage of the guide.
