# Content Authoring Guide

This is the contract between the OpenLegion content engine and this repository.
Read it as your system prompt. The CI validator (`scripts/validate-content.mjs`)
enforces every rule below; PRs that violate any of them are blocked.

---

## TL;DR for the engine

To ship a new page, open a PR that adds **one** file:

```
+ src/content/<slug-path>.md
```

Nothing else. Routes, sitemap, OG image, internal links, JSON-LD, llms.txt,
and the content manifest all regenerate automatically. PRs that touch any file
outside `src/content/` are out-of-scope and require human review per
`.github/CODEOWNERS`.

One PR = one page. No bundled multi-page PRs.

---

## Directory layout

```
src/content/
  comparison.md                       # /comparison hub
  comparison/<name>.md                # /comparison/<name>
  learn/<name>.md                     # /learn/<name>
  <name>.md                           # /<name>  (root content like /openclaw-alternative)
  zh/<same-relative-path>.md          # zh translation of any English page
  zh-TW/<same-relative-path>.md       # zh-TW translation
  ...                                 # one dir per supported translation locale
  _template.md                        # canonical authoring template (do not modify)
```

**File path must mirror URL path.** A markdown file at
`src/content/learn/agent-cost-controls.md` MUST declare
`slug: "/learn/agent-cost-controls"` in frontmatter. The validator hard-fails
on mismatches.

Translations under `src/content/<locale>/` reuse the same relative path as
their canonical English file.

---

## Frontmatter contract

The full machine-readable contract lives in `content-schema.json`. Authoring
TL;DR:

| Field                | Type     | Required | Notes                                                                                             |
| -------------------- | -------- | -------- | ------------------------------------------------------------------------------------------------- |
| `title`              | string   | yes      | 30–75 chars. Must contain every word of `primary_keyword`.                                        |
| `description`        | string   | yes      | 80–200 chars. Target 150–160 for clean SERP. Used as meta description + OG description.           |
| `slug`               | string   | yes      | URL path. Must mirror file location. Pattern: `/[a-z0-9-]+(/[a-z0-9-]+)*`.                        |
| `primary_keyword`    | string   | yes      | Single term this page targets. Verbatim presence required in title and H1 (all words, any order). |
| `secondary_keywords` | string[] | no       | Up to 10. Each should appear in the body somewhere.                                               |
| `date_published`     | string   | no       | ISO `YYYY-MM` or `YYYY-MM-DD`.                                                                    |
| `last_updated`       | string   | yes      | ISO date. Validator warns if older than 12 months.                                                |
| `schema_types`       | string[] | yes      | One or more of: Article, FAQPage, HowTo, DefinedTerm, BreadcrumbList, ItemList, Product, SoftwareApplication. |
| `howto_total_time`   | string   | cond.    | ISO 8601 duration (`PT15M`, `PT2H30M`, `PT30S`). Required if `schema_types` includes `HowTo`.     |
| `howto_tools`        | string[] | no       | Tool names for HowTo schema.                                                                      |
| `page_type`          | enum     | no       | `comparison` \| `learn` \| `alternative` \| `root` \| `hub`. Inferred from slug if omitted.       |
| `related`            | string[] | no       | 3–6 curated full-slug paths. Validator rejects unresolved slugs.                                  |
| `author`             | string   | no       | E-E-A-T byline. Defaults to OpenLegion organization byline.                                       |

---

## Required document structure

Every content page must contain — in this order:

1. **H1** with the primary keyword.
2. **Lede paragraph** of 35–90 words, immediately after H1, no headings between. This is the paragraph AI Overviews extract; lead with the answer.
3. **Definition block** wrapping the primary topic, marked with `<!-- SCHEMA: DefinitionBlock -->`. Emits `DefinedTerm` JSON-LD.
4. **TL;DR or unique-POV section** — one of: `## OpenLegion's Take` (preferred), `## TL;DR`, `## Bottom Line`, `## The Verdict`, `## In Practice`. Must contain opinionated, non-generic claims.
5. **Body** with proper H2 → H3 heading hierarchy. No skipped levels (H1 → H3 without H2 fails).
6. **Comparison table or HowTo block** where the page type warrants it.
7. **`## Frequently Asked Questions`** marked with `<!-- SCHEMA: FAQPage -->` containing **≥5 H3 questions**, each with a 2–4 sentence direct answer (no internal links inside answers — they get stripped from JSON-LD).
8. **CTA block** at the end.

Word-count thresholds by page type:

- `comparison`: ≥800 words
- `learn`: ≥600 words
- `alternative`: ≥800 words
- `root`: ≥600 words
- `hub`: ≥400 words (lighter prose, more index)

---

## What the validator hard-fails on

Run locally with `node scripts/validate-content.mjs`. Each of these is a
merge-blocker:

- Any frontmatter field missing or out of range per `content-schema.json`.
- File-path / slug mismatch.
- Primary keyword's words not all present in title and H1.
- Word count below page-type threshold.
- Lede paragraph missing or outside 35–90 words.
- H1 missing, multiple H1s, or heading hierarchy skipping a level.
- FAQ section absent or fewer than 5 H3 questions after the marker.
- Unique-POV section missing.
- Any image missing alt text or with a generic alt (`image`, `screenshot`, `chart`, `graph`, `logo`, `diagram`, `picture`).
- Any internal link (`/...`) that doesn't resolve to a known page or recognized nav route.
- Any `related:` slug that doesn't resolve, or includes self.
- Placeholder strings: `Lorem ipsum`, `TODO:`, `<!-- TODO`, `[INSERT`, `{{ `, `as an AI`, `as a language model`, `I am an AI`.
- Near-duplicate detection: TF-IDF cosine similarity of (H1 + lede + all H2s) vs every existing page exceeds the dynamic baseline (`max-existing-pairwise + 0.05`). Calibrate and inspect with `--calibrate`.
- `last_updated` not a valid ISO date.

---

## Engine-readable surfaces

These are stable interfaces the engine can rely on without breaking when the
repo evolves:

- **`content-schema.json`** — frontmatter shape (single source of truth).
- **`public/content-manifest.json`** — generated at build time. Lists every published slug, title, primary keyword, schema types, related slugs, available locales, and last_updated. Use it to dedupe slug proposals, populate `related:` arrays correctly, and detect stale pages.
- **`public/llms.txt`** — auto-regenerated. Hand-curated brand preamble + grouped URL index.
- **`public/llms-full.txt`** — auto-regenerated. Full markdown of every page concatenated.

The engine MUST NOT modify any of these — they are derived from
`src/content/` plus the generator script.

---

## Internal-link conventions

- Use absolute paths: `/learn/ai-agent-platform`, not `/learn/ai-agent-platform/` or `https://www.openlegion.ai/...`.
- Anchor links (`#section`) are fine and don't get validated.
- The four canonical hubs are: `/comparison`, `/learn`, `/pricing`, `/faq`.
- Cross-link between adjacent pages liberally — internal-link velocity is a strong AEO signal — but always with descriptive anchor text. No `[click here]`, no `[this page]`.

---

## Translation handling

- The English file at `src/content/<path>.md` is canonical. Its frontmatter drives sitemap, OG image, JSON-LD.
- Translations live at `src/content/<locale>/<path>.md` and may omit the `slug` frontmatter (it's inherited from the canonical).
- Sitemap automatically emits `hreflang` only for locales where the translation file exists. Locales without a translation get a `noindex,follow` meta tag on that locale's URL — preventing English-content-under-foreign-URL duplication.
- When adding a translation, mirror the English file structure exactly; the validator only runs on canonical English files.

---

## Out of scope for the engine

The following are infrastructure decisions, owned by humans via `.github/CODEOWNERS`:

- Validator rules (`scripts/validate-content.mjs`).
- Content schema (`content-schema.json`).
- Routes, sitemap, OG generation, JSON-LD helpers (`src/lib/`, `src/app/`).
- Build derivatives generator (`scripts/generate-content-derivatives.mjs`).
- This document.

If a content PR needs any of the above to change, open a separate PR that
includes the rationale and tag a maintainer.
