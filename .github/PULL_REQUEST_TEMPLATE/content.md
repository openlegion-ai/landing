# Content PR Checklist

> Use this template when adding or updating a single page under `src/content/`.
> The CI gate (`content-validate`) enforces every item in this list — this
> checklist is the authoring contract, the workflow is the enforcement.

## Page

- **Slug:** `/section/page-slug`
- **Page type:** `comparison` | `learn` | `alternative` | `root` | `hub`
- **Primary keyword:** `<the single term this page targets>`
- **Last updated:** `YYYY-MM`

## SEO + GEO checklist

- [ ] File path mirrors slug exactly (e.g. `src/content/comparison/foo.md` for `/comparison/foo`).
- [ ] Title 30–75 chars and contains every word of the primary keyword.
- [ ] Description 80–200 chars (target 150–160 for clean SERP rendering).
- [ ] Lede paragraph immediately after H1 is 35–90 words and answers the page's primary question.
- [ ] H1 is unique on the page; H2 → H3 hierarchy never skips a level.
- [ ] FAQ section with `<!-- SCHEMA: FAQPage -->` marker and ≥5 H3 questions.
- [ ] Unique-POV section present (`OpenLegion's Take` preferred; `TL;DR`, `Bottom Line`, `The Verdict`, `In Practice` accepted).
- [ ] Definition block (`<!-- SCHEMA: DefinitionBlock -->`) for the primary topic.
- [ ] All images have descriptive alt text — no generic "image" / "screenshot" / "chart".
- [ ] All internal links resolve to existing slugs (or known nav routes).
- [ ] `related:` array curated to 3–6 sibling slugs that resolve.
- [ ] No placeholder strings: `Lorem ipsum`, `TODO`, `[INSERT`, `as an AI`, `as a language model`.
- [ ] TF-IDF similarity to existing pages stays within `baseline + 0.05` (CI computes this).

## Engineering checklist

- [ ] PR touches **only** files under `src/content/`. Any infrastructure change is out-of-scope and goes to a separate PR with human review.
- [ ] One PR = one page. Bundled multi-page PRs get rejected — granular rollback matters.
- [ ] `node scripts/validate-content.mjs` passes locally.
