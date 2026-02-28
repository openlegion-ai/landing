# Landing Page Redesign — Design Document

**Date:** 2026-02-28
**Goal:** Full redesign of openlegion.ai landing page with new demo video, improved conversion funnel, visual variety, and SEO optimization.

## Approach

**Conversion-Optimized Storytelling Redesign** — restructure the page around a narrative sales funnel (problem → proof → solution → trust → action) with stronger visual variety and improved design quality.

## Decisions

| Decision | Choice |
|----------|--------|
| Video source | Download to `/public/demo.mp4` (replace current) |
| Theme | Dark-mode only |
| Conversion CTAs | GitHub + Discord (no email capture) |
| Hero layout | Keep 2-column split (text left, video right) |
| Features layout | Bento grid (mixed card sizes) |
| Architecture layout | Nested concentric diagram |
| Comparison position | Move up (after hero, before features) |

## New Section Order

```
1.  Navbar (refined)
2.  Hero (2-col split: text left, new demo video right, stats below)
3.  Comparison (moved up — the "problem" framing)
4.  Features (bento grid — the "solution")
5.  Use Cases (polished)
6.  Architecture (nested concentric diagram)
7.  Security (6 layers — added to page, wasn't rendered before)
8.  Quickstart (polished)
9.  FAQ (new — SEO featured snippets)
10. CTA (stronger close)
11. Footer (refined)
```

## Section Details

### Hero (2-column split)

- Keep existing layout: text left, video right
- Replace `/public/demo.mp4` with new video from GitHub user-attachments URL
- Same content: badge, h1, subtitle, dual CTAs, star count
- Stats row below both columns (unchanged)
- Video auto-plays on scroll, respects prefers-reduced-motion

### Comparison (moved from position 5 → 3)

- Same content: alert box + comparison table
- Position change creates "problem first" funnel psychology
- No structural changes needed, just import reorder in `page.tsx`

### Features (bento grid)

- Consolidate "Six Security Layers" + "Container Isolation" into one large card
- 10 cards total with varied sizes (large, medium, standard)
- Layout: CSS grid with `grid-template-areas` for the bento effect
- Bottom full-width card for "Agents That Work While You Sleep"
- Mobile: stack to single column

### Use Cases

- Same 4-card grid
- Visual polish: slightly larger cards, refined hover states

### Architecture (nested diagram)

- Replace 3 side-by-side cards with concentric nested boxes
- User Zone (outer) → Mesh Host (middle) → Agent Containers (inner)
- Color-coded borders matching current scheme (blue/green/red)
- Shows "defense in depth" visually
- Items listed inside each layer

### Security (new on page)

- Component exists but wasn't rendered in `page.tsx`
- Add between Architecture and Quickstart
- 6 numbered layers in a vertical stack / timeline layout

### FAQ (new section)

- 4-6 questions targeting search queries:
  - "What is OpenLegion?"
  - "How is OpenLegion different from OpenClaw?"
  - "Is OpenLegion open source?"
  - "What LLM providers does OpenLegion support?"
  - "How does OpenLegion handle API key security?"
- Accordion/disclosure pattern
- JSON-LD FAQ structured data for featured snippets

### CTA (stronger close)

- Larger headline
- Repeat key stats for reinforcement
- Subtle background glow animation
- Both CTAs with stronger visual contrast

### Footer

- Same structure, minor polish

## Visual Improvements (cross-cutting)

- Increase section spacing for more breathing room
- Refine scroll-triggered animations (faster, crisper)
- Add subtle section background variety (alternating slight tint)
- Ensure bento grid graceful mobile stacking
- Improved hover states on all interactive elements

## SEO Additions

- FAQ section with JSON-LD `FAQPage` structured data
- Ensure semantic heading hierarchy preserved
- Meta description update if needed

## Files Changed

- `src/app/page.tsx` — section reorder, add Security + FAQ
- `src/components/hero.tsx` — minor polish (video src unchanged, file replaced)
- `src/components/features.tsx` — bento grid layout rewrite
- `src/components/architecture.tsx` — nested diagram rewrite
- `src/components/security.tsx` — already exists, may need polish
- `src/components/faq.tsx` — new component
- `src/lib/constants.ts` — add FAQ data, consolidate features
- `src/app/globals.css` — bento grid styles, section variety
- `src/app/layout.tsx` — add FAQ JSON-LD structured data
- `public/demo.mp4` — replaced with new video
