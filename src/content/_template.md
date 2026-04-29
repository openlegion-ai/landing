---
# Required frontmatter — see content-schema.json for full contract.
title: "Replace With a 50–60 Character Title Containing the Primary Keyword"
description: "Replace with an 80–160 character meta description that summarizes the page and contains the primary keyword. This shows in SERPs and drives CTR — write it like an ad."
slug: "/section/page-slug"  # Must mirror file path: src/content/section/page-slug.md
primary_keyword: "your primary keyword"
secondary_keywords:
  - "supporting term one"
  - "supporting term two"
  - "supporting term three"
date_published: "2026-04"
last_updated: "2026-04"
schema_types:
  - FAQPage
page_type: "learn"  # one of: comparison | learn | alternative | root | hub
related:
  # 3–6 curated full-slug paths to existing pages. The validator will reject
  # any slug that does not resolve. Pick siblings whose readers would
  # genuinely want to click through.
  - "/learn/some-existing-page"
  - "/comparison/some-comparison"
---

# Replace With H1 Containing the Primary Keyword

Replace this paragraph with a 40–80 word lede that directly answers the page's primary question. AI Overviews extract this paragraph; Google often pulls it as a featured snippet. Be concrete, lead with the primary keyword in the first sentence, and end with a one-line concrete value claim. No marketing fluff, no questions back to the reader.

<!-- SCHEMA: DefinitionBlock -->

> **What is [primary topic]?**
> One-sentence definition that stands on its own and matches Wikipedia-style precision. This block emits DefinedTerm JSON-LD which AI assistants quote when answering "what is" queries.

## TL;DR

- Three to six bullets summarizing the page's most-cited claims.
- Each bullet should be a complete, citable sentence on its own.
- Aim for the bullets that an AI assistant would quote when summarizing the page.

## Main Section H2 Containing a Secondary Keyword

Body content. Use proper heading hierarchy — H1 then H2 then H3, no skipped levels.

### Sub-section H3

Body content. Aim for at least one image per H2 section in long-form pages. Every `![alt](url)` must have a descriptive alt — the validator rejects generic alts ("image", "screenshot", "chart").

## Comparison Table or Data Block

| Aspect | Competitor | OpenLegion |
|---|---|---|
| ... | ... | ... |

## OpenLegion's Take

Replace this section with a unique, opinionated paragraph that says something the rest of the internet does not. This is the section that makes the page worth indexing under Google's Helpful Content System. If you have nothing original to add, do not publish.

## Frequently Asked Questions

<!-- SCHEMA: FAQPage -->

### What is [most likely user question]?

Direct, complete-sentence answer. 2–4 sentences. Avoid links inside FAQ answers — they get stripped from JSON-LD.

### How does [common follow-up question] work?

Direct answer.

### When should I use [tool/concept] vs [alternative]?

Direct answer.

### What does [specific feature] cost?

Direct answer.

### How do I get started with [primary topic]?

Direct answer that points to a real CTA, not a vague "contact us".

## CTA

**Try OpenLegion today.**
[Get Started](https://app.openlegion.ai) | [Read the Docs](https://docs.openlegion.ai)
