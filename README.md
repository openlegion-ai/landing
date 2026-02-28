# OpenLegion Landing Page

Marketing and landing site for [OpenLegion](https://github.com/openlegion-ai/openlegion) — the container-isolated AI agent framework.

**Live:** [openlegion.ai](https://openlegion.ai)
**Docs:** [docs.openlegion.ai](https://docs.openlegion.ai)
**Engine:** [github.com/openlegion-ai/openlegion](https://github.com/openlegion-ai/openlegion)

## Tech Stack

- **Next.js 16** — App Router, React 19, Turbopack
- **Tailwind CSS v4** — Utility-first styling
- **TypeScript** — Full type safety
- **Framer Motion** — Scroll-triggered animations
- **Shiki** — Server-side syntax highlighting
- **Lucide React** — Icons

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

## Project Structure

```
src/
├── app/
│   ├── layout.tsx         — metadata, SEO, JSON-LD structured data
│   ├── page.tsx           — section composition
│   ├── globals.css        — dark palette, animations, effects
│   ├── sitemap.ts         — dynamic sitemap.xml generation
│   ├── robots.ts          — dynamic robots.txt generation
│   └── not-found.tsx      — custom 404 page
├── components/
│   ├── navbar.tsx         — sticky nav with mobile menu
│   ├── hero.tsx           — headline, animated stats, CTAs
│   ├── features.tsx       — 8-feature bento grid
│   ├── comparison.tsx     — framework comparison table
│   ├── architecture.tsx   — trust zone diagram
│   ├── use-cases.tsx      — team template cards
│   ├── quickstart.tsx     — tabbed install (macOS/Linux + Windows)
│   ├── security.tsx       — 6 defense layers
│   ├── cta.tsx            — bottom call to action
│   ├── footer.tsx         — links + license
│   └── ui/                — shared components
└── lib/
    └── constants.ts       — all page content and data
```

## Contributing

Issues and pull requests welcome. For engine changes, contribute to the [main repo](https://github.com/openlegion-ai/openlegion).

## License

AGPLv3
