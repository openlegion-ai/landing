# OpenLegion Landing Page

Marketing site for [OpenLegion](https://github.com/openlegion-ai/openlegion) — the secure, container-isolated AI agent framework.

**Live:** [openlegion.ai](https://openlegion.ai)

## Tech Stack

- **Next.js 16** (App Router, React 19, Turbopack)
- **Tailwind CSS v4**
- **TypeScript**
- **Framer Motion** — scroll-triggered animations
- **Shiki** — server-side syntax highlighting
- **Lucide React** — icons

## Development

```bash
npm install
npm run dev        # http://localhost:3000
```

## Build

```bash
npm run build
npm run start      # serve production build
```

## Lint

```bash
npm run lint
```

## Project Structure

```
src/
  app/
    layout.tsx         — metadata, SEO, JSON-LD
    page.tsx           — section composition
    globals.css        — dark palette, animations, effects
  components/
    navbar.tsx         — sticky nav with mobile menu
    hero.tsx           — headline, stats, CTAs
    features.tsx       — 8-feature bento grid
    comparison.tsx     — vs traditional frameworks table
    architecture.tsx   — trust zone diagram
    use-cases.tsx      — team template cards
    quickstart.tsx     — tabbed install (macOS/Linux + Windows)
    security.tsx       — 5 defense layers
    cta.tsx            — bottom call to action
    footer.tsx         — links + license
    ui/                — shared components (animate-in, badge, code-block, counter, section-wrapper)
  lib/
    constants.ts       — all page content and data
```

## License

MIT
