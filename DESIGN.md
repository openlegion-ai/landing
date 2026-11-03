---
name: OpenLegion Landing
description: The category standard played straight — polished light enterprise SaaS at Stripe/Linear/Notion craft, with dark product frames as the produced moments.
colors:
  ground-white: "#ffffff"
  navy-ink: "#0a2540"
  slate-muted: "#425466"
  cool-hairline: "#e6ebf1"
  cool-band: "#f6f9fc"
  confident-blue: "#2563eb"
  link-blue: "#1d4ed8"
  icon-blue: "#3b82f6"
  indigo-ramp-end: "#4f46e5"
  blue-wash: "rgba(37, 99, 235, 0.08)"
  blue-wash-strong: "rgba(37, 99, 235, 0.16)"
  success-green: "#047857"
  danger-red: "#b91c1c"
  frame-navy: "#0d1526"
  frame-ink: "#e2e8f0"
  frame-muted: "#8b8fa3"
  frame-border: "#1e2030"
  frame-navy-2: "#101a30"
  frame-chrome: "#0d0e14"
  frame-well: "#0a0b10"
  frame-card: "#12131d"
  frame-card-hover: "#181a28"
  frame-foreground: "#f0f0f3"
  frame-accent-light: "#60a5fa"
  frame-accent-bright: "#93a3bf"
  scrollbar-thumb: "#cbd5e1"
  scrollbar-thumb-hover: "#94a3b8"
typography:
  display-xl:
    fontFamily: "Geist, Noto Sans SC, PingFang SC, system-ui, sans-serif"
    fontSize: "3.25rem"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.025em"
  display-lg:
    fontSize: "3rem"
    fontWeight: 800
  display-60:
    fontSize: "60px"
    fontWeight: 800
  display-og:
    fontSize: "52px"
    fontWeight: 800
  display-md:
    fontSize: "48px"
    fontWeight: 800
  display-sm:
    fontSize: "2rem"
    fontWeight: 800
  headline-lg:
    fontSize: "36px"
    fontWeight: 700
    letterSpacing: "-0.025em"
  headline:
    fontSize: "30px"
    fontWeight: 700
    letterSpacing: "-0.025em"
  headline-og-brand:
    fontSize: "28px"
    fontWeight: 700
  prose-h1:
    fontSize: "2.25rem"
    fontWeight: 800
  prose-h1-md:
    fontSize: "2.75rem"
    fontWeight: 800
  prose-h2:
    fontSize: "1.5rem"
    fontWeight: 700
  title-lg:
    fontSize: "1.25rem"
    fontWeight: 600
  title:
    fontSize: "24px"
    fontWeight: 600
  title-og-tagline:
    fontSize: "22px"
  title-sm:
    fontSize: "20px"
    fontWeight: 600
  prose-h3:
    fontSize: "1.2rem"
    fontWeight: 600
  prose-h4:
    fontSize: "1.1rem"
    fontWeight: 600
  prose-item:
    fontSize: "1.05rem"
    fontWeight: 600
  lede:
    fontSize: "18px"
  body-lg:
    fontSize: "17px"
  body:
    fontSize: "16px"
  reading:
    fontSize: "15px"
  ui:
    fontSize: "14px"
  caption:
    fontSize: "13px"
  label:
    fontSize: "12px"
  margin-note:
    fontSize: "0.8125rem"
  chip:
    fontSize: "11px"
  chip-sm:
    fontSize: "10px"
  mono:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "14px"
rounded:
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  section-sm: "64px"
  section-md: "80px"
  section-lg: "128px"
components:
  button-primary:
    backgroundColor: "{colors.confident-blue}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "10px 24px"
  button-primary-hover:
    backgroundColor: "{colors.link-blue}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
  button-secondary:
    backgroundColor: "{colors.ground-white}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.md}"
    padding: "10px 24px"
  card:
    backgroundColor: "{colors.ground-white}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.lg}"
    padding: "20px 24px"
  chip:
    backgroundColor: "{colors.ground-white}"
    textColor: "{colors.slate-muted}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  nav-link:
    backgroundColor: "transparent"
    textColor: "{colors.slate-muted}"
---

# Design System: OpenLegion Landing

## Overview

**Creative North Star: "The Enterprise Standard, Played Straight"**

This is the polished light enterprise SaaS page done without irony or concept: white ground, deep navy ink, one confident blue, alternating cool bands, and hairline rules everywhere structure is needed. The craft bar is Stripe, Linear, Notion, and Datadog/Vanta — the page earns credibility with an ops buyer reading it in office light, mid-workday. The one theatrical inheritance from the prior dark site is deliberate: the product itself appears in **dark produced frames** (terminal mock, live dashboard window) that sit on the light page like screenshots of a real tool, because they are.

The build's history matters to its grammar: it is a restyle of a dark "tech startup" site whose class names and copy were preserved byte-identical (13 locales, SEO asset). Legacy effect hooks — particles, orbs, glass shine, badge shimmer, dot grids, conic gradient borders — still exist in markup but are **neutralized in CSS** (`content: none` / `display: none`). Restraint here is not absence of capability; it is recorded refusal.

**Key Characteristics:**
- White ground + `#0a2540` navy ink + one blue accent; color never carries decoration, only meaning
- Alternating `#f6f9fc` cool bands with 1px top hairlines set the section rhythm
- Dark `#0d1526` product frames are the only dark surfaces on the page
- Gradient text (blue→indigo) is the single color flourish, reserved for headline highlights
- Content is visible by default — no scroll-entrance animation anywhere
- Section labels exist in the DOM but are `sr-only`: locked SEO copy, invisible kickers

## Colors

A one-accent light system: navy ink on white, a single confident blue doing every accent job, and cool gray-blue neutrals for everything structural.

### Primary
- **Confident Blue** (`#2563eb`): the only accent. Solid CTA fills, focus outlines, list markers, hover border tints, selection background. Large accents and icons step up to **Icon Blue** (`#3b82f6`); links and small text step down to **Link Blue** (`#1d4ed8`) for AA contrast on white. **Indigo** (`#4f46e5`) exists only as the far end of the gradient-text ramp, never alone.

### Neutral
- **Navy Ink** (`#0a2540`): all headings and primary text; also the tint base for every shadow.
- **Slate Muted** (`#425466`): secondary/body text, nav links, captions.
- **Cool Hairline** (`#e6ebf1`): every border, divider, and section rule. One hairline weight, everywhere.
- **Cool Band** (`#f6f9fc`): alternating section backgrounds, footer, table headers, CTA blocks, hover fills.
- **Ground White** (`#ffffff`): page and card ground.

### Functional
- **Success Green** (`#047857`) and **Danger Red** (`#b91c1c`): comparison-table verdicts and the security zone diagram only. At 4% alpha they tint the nested architecture zones (`zone-middle`, `zone-inner`).

### Dark Frame Palette (scoped)
`.terminal` and `.dashboard-frame` re-declare the legacy dark tokens **inside themselves**: `#0d1526` ground, `#e2e8f0`/`#f0f0f3` ink, `#8b8fa3` muted, `#1e2030` borders, `#60a5fa` links. This palette never leaks outside a product frame.

### Named Rules
**The One Blue Rule.** Every accent on the light page is the same blue family (`#1d4ed8` / `#2563eb` / `#3b82f6` by size and role). No second accent hue exists outside the gradient ramp and the functional green/red.

**The Framed Dark Rule.** Dark surfaces appear only as produced product windows (`.terminal`, `.dashboard-frame`, `.prose pre`). The page itself is never dark; the frames are never light.

**The Tinted Wash Rule.** Colored backgrounds on the light page are always low-alpha washes of a token color (4–16% alpha: `rgba(37,99,235,0.04–0.16)`), never new solid tints.

## Typography

**Display Font:** Geist Sans (via next/font, with Noto Sans SC → PingFang SC → system-ui for CJK/fallback)
**Body Font:** Geist Sans (same family; hierarchy is carried by weight and size, not by a second face)
**Label/Mono Font:** Geist Mono (terminal mock, code, `.prose pre/code`)

**Character:** One neutral grotesk doing everything — dense, technical, unshowy. Headlines are heavy (700–800) and tight (`tracking-tight`, ≈ -0.02em to -0.025em); everything below title level is regular-to-semibold at generous line-height. The stack must hold up in 13 locales including CJK, Thai, Devanagari, and RTL Arabic.

### Hierarchy
The ramp as literally shipped (enumerate, don't compress):
- **Display** (800, `2rem` → sm `3rem`/48px → md 60px → lg `3rem` → xl `3.25rem`, line-height 1.08, tracking-tight): hero H1 only; the gradient-text highlight lives here.
- **Headline** (700, 30px → md 36px → lg 48px, `tracking-tight`): section H2s (`text-3xl md:text-4xl lg:text-5xl`; pricing uses 36px → 48px).
- **Title** (600–700, 18px / 20px / 24px): card titles, tier names, FAQ questions (prose H3 ≈ 1.2rem, H4 ≈ 1.05rem).
- **Body** (400, 16px, line-height 1.75): prose and lead paragraphs; hero subhead steps up to 17–18px (`text-lg`, one literal `text-[17px]`).
- **Reading-small** (400–500, literal steps **13px, 14px (`text-sm`), 15px**): the workhorse sizes — feature arguments, table cells, nav links, FAQ answers, footer links. `text-sm` (14px) is the most-used size on the site (57 uses).
- **Label** (600, 12px `text-xs`, uppercase variants at `tracking-wider`/`tracking-[0.08em]`): table headers, footer column heads, quiet eyebrow-position metadata.
- **Chip/badge** (500–600, literal **10px and 11px** — `text-[10px]`, `text-[11px]`): pricing badges, tier chips, terminal metadata, fine print.
- **Mono** (400, 12–14px): terminal lines, code blocks.

### Named Rules
**The Full Ladder Rule.** The shipped size ladder is 10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 24, 30, 36, 48(=3rem), 52(=3.25rem), 60px. New surfaces pick from these literal steps; do not invent intermediate sizes or collapse the 13/14/15px reading tier into one.

**The Weight-Carries-Hierarchy Rule.** One family; hierarchy comes from weight (400 → 500 → 600 → 700 → 800) and size, never from a second typeface or from color alone.

## Layout

Centered single-column sections on a `max-w-6xl` (occasionally `max-w-5xl`, one `max-w-7xl`) container with `px-4`/`px-6`/`px-8` gutters; content pages use an 880px `.content-page` column. Section vertical rhythm is generous: `py-16` → `py-20`/`py-24`, hero at `py-32`. Every section opens with a 1px top hairline (`.section-fade::before`); even-numbered sections take the `#f6f9fc` band — the alternation is the page's macro rhythm.

Within sections the recurring pattern is the **asymmetric split**: text column beside evidence (hero text + dark demo frame; use-case rows alternating text-left/text-right beside tinted panels; features as ruled title/argument list). SocialProof is a quiet ruled stat row (`border-y` with internal hairline dividers). Component-level spacing runs on the Tailwind 4px grid; common paddings are 8/12/16/20/24px, card interiors 20–24px. The layout is logical-property/RTL-safe (Arabic is first-class) and `scroll-padding-top: 110px` accounts for the fixed banner + navbar.

## Elevation & Depth

Layered soft shadows, always tinted with the navy ink (`rgba(10,37,64,…)`), never colored halos or glows. Depth is quiet and structural: cards rest at `--shadow-sm`, lift to `--shadow-md` on hover; the dark product frames carry `--shadow-lg` as the page's deepest moments. Everything else is flat and hairline-bordered.

### Shadow Vocabulary
- **shadow-sm** (`0 1px 2px rgba(10,37,64,0.06), 0 1px 3px rgba(10,37,64,0.08)`): resting cards, buttons, chips.
- **shadow-md** (`0 2px 4px rgba(10,37,64,0.05), 0 6px 16px rgba(10,37,64,0.08)`): hover state for cards, buttons, FAQ items.
- **shadow-lg** (`0 6px 12px rgba(10,37,64,0.06), 0 20px 44px rgba(10,37,64,0.12)`): dark product frames (terminal, dashboard) only.

### Named Rules
**The Ink Shadow Rule.** Every shadow is a low-alpha layer of the navy ink. No colored/glowing shadows; the sole exception is the `agent-pulse` ring inside the dark dashboard mock, which is product-fixture behavior, not page chrome.

## Shapes

Soft-rectangle form language on a small radius ladder: **4px** (inline code), **6px** (`rounded-md`: buttons in tables, small controls), **8px** (`rounded-lg`: buttons, inputs, FAQ/related cards, blockquotes, code blocks — the default), **12px** (`rounded-xl`: cards, terminal, CTA blocks — the most-used card radius), **16px** (`rounded-2xl`: large panels, dashboard frame), and **full** for chips, badges, avatars, and dots. Borders are always the 1px cool hairline; hover shifts border color toward the blue at ~30–35% alpha (`rgba(37,99,235,0.3–0.35)`) rather than thickening. No hard corners, no offset shadows, no clipping tricks; `overflow: hidden` appears only on the produced frames.

## Components

### Buttons
- **Character:** solid, confident, no glow theater.
- **Shape:** softly rounded (8px).
- **Primary** (`.btn-gradient` — legacy name, now solid): Confident Blue fill, white text, 600 weight, ~10px 24px padding, `--shadow-sm`.
- **Hover / Focus:** fill deepens to `#1d4ed8`, shadow steps to `--shadow-md`; 0.15s ease. Active nudges down 1px. Focus is the global 2px blue outline, offset 2px.
- **Secondary:** white ground, hairline border, navy text; hover tints border to accent and ground to `#f6f9fc`.

### Chips
- **Style:** pill (full radius), white or wash background, hairline border, 10–11px semibold text in muted slate (e.g. pricing credit badges: `rounded-full border-border bg-background px-2 py-0.5 text-[10px] font-semibold`).
- **State:** `pill-interactive` hover lifts 1px, tints border blue at 35% alpha, washes background at 4% alpha. No shimmer, no glow badges.

### Cards / Containers
- **Corner Style:** 12px standard (8px for compact list cards, 16px for large panels).
- **Background:** white on white or band ground; tinted panels use 4% alpha washes.
- **Shadow Strategy:** `--shadow-sm` at rest, `--shadow-md` + blue-tinted border + 2px lift on hover (`.card-hover`).
- **Border:** 1px `#e6ebf1` always.
- **Internal Padding:** 20–24px.

### Navigation
- **Style:** white bar over hairline rule; links in 14px muted slate. Hover reveals a 1px blue underline growing from center (`.nav-link::after`, 0.25s). Breadcrumbs in 14px muted with `#cbd5e1` separators. Skip-nav appears on keyboard focus as a solid blue pill.

### FAQ Accordion
- **Style:** native `<details>` cards — hairline border, 8px radius, `--shadow-sm`; open state tints the border blue and lifts to `--shadow-md`; answer enters with a 0.25s opacity/4px-translate reveal (reduced-motion guarded).

### Dark Product Frame (signature)
The terminal and dashboard windows: `#0d1526` ground (dashboard adds a `145deg` gradient to `#101a30`), 12px radius, near-navy 1px border, `--shadow-lg`, macOS traffic-light dots, mono type. The dashboard sits in a `perspective: 2000px` wrapper with a 2° X-tilt that flattens on hover; terminal lines animate in with a 0.2s fade-rise; the agent status dot pulses. These are the only animated, only dark, and only deeply shadowed objects on the page — their scarcity is what makes them read as the product.

### Gradient Headline Highlight (signature)
`105deg` blue→indigo ramp (`#1d4ed8 → #2563eb → #4f46e5`) clipped to text, on hero/headline key phrases only. The animated variant shimmers over 8s (reduced-motion guarded). This is the page's single color flourish, adopted from the prior site and owner-confirmed.

## Do's and Don'ts

### Do:
- **Do** keep all copy byte-identical to `messages/<locale>.json` — visible strings are a preserved SEO asset across 13 locales; redesigns restyle, only the launch truth pass rewrites.
- **Do** render content visible by default. Surviving motion is limited to: hero gradient shimmer, terminal line entrances, dashboard tilt/live mock, and hover/focus transitions — all behind `prefers-reduced-motion` guards.
- **Do** open every section with the 1px hairline and alternate `#f6f9fc` bands for rhythm.
- **Do** tint shadows with navy ink (`rgba(10,37,64,…)`) and hovers with the blue at ≤35% alpha.
- **Do** keep section labels in the DOM as `sr-only` — they are locked copy, not visible kickers.
- **Do** preserve the accessibility floor: skip-nav, global `:focus-visible` outline, reduced-motion guards, semantic prose/tables, RTL/logical properties.

### Don't:
- **Don't** reactivate the neutralized legacy effects (particles, orbs, glass shine, badge shimmer, dot grid, conic borders, glow pulses on page chrome) — they are `content: none`/`display: none` by decision, not omission.
- **Don't** introduce dark surfaces outside the product frames, or light chrome inside them.
- **Don't** add visible kickers/eyebrows above headings; the pattern on this site is sr-only labels.
- **Don't** use colored glows or halos as elevation; the only glow-like effect permitted is the `agent-pulse` fixture inside the dark mock.
- **Don't** add scroll-entrance animation, a second accent hue, or a second typeface.
- **Don't** invent pricing numbers, badges with glow treatments, or synthetic proof (testimonial avatars are flagged non-real in PRODUCT.md and are not on the shipped homepage).
