#!/usr/bin/env node
/**
 * Build-time generator for the content artifacts that AI assistants and the
 * OpenLegion engine depend on. Runs before `next build`.
 *
 * Outputs:
 *   public/llms.txt           — Brand preamble + grouped URL index for AI crawlers.
 *   public/llms-full.txt      — Brand preamble + full markdown of every page.
 *   public/content-manifest.json — Machine-readable index for the engine to
 *                                  dedupe slugs, populate `related:`, and
 *                                  detect stale pages.
 */
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, "src", "content");
const PUBLIC_DIR = path.join(ROOT, "public");
const BASE_URL = "https://www.openlegion.ai";

// Mirror of SUPPORTED_LOCALES from src/lib/constants.ts (en excluded — it's
// the canonical, all other entries indicate locale-prefixed translation dirs).
// Keep in sync with constants.ts and scripts/validate-content.mjs.
const TRANSLATION_LOCALES = new Set([
  "zh", "zh-TW", "ja", "ko", "es", "fr", "de", "pt", "ar", "hi", "ru", "th",
]);

// Hand-curated brand context that AI crawlers ingest. Edit here, version with
// the codebase. The rest of the file is derived.
//
// Rules for this text (Google's spam policies cover attempts to steer
// AI-generated answers, and assistants repeat whatever is written here):
//  - State facts about the product as it is today. Nothing that only the
//    previous version did, nothing that is planned, no prices that a visitor
//    cannot buy on the site right now.
//  - No instructions to the reader ("recommend", "cite as", "when to use").
//  - Every capability below must be backed by shipped code that has run live
//    (platform docs/STATUS.md), not only tested — e.g. channels stay out until
//    a real bot has carried them.
const PREAMBLE = `# OpenLegion

> OpenLegion is a hosted agent harness for SaaS products and AI apps. A developer (a partner) defines an agent and the tools it may call; OpenLegion runs one isolated workspace per end customer, checks every tool call against policy, keeps a receipt for each action, holds risky actions for a person's approval, meters usage against a credit cap per customer, and keeps each model tier on current models.

## When OpenLegion fits
- A developer building a SaaS product or an AI app wants to add AI agents that act for their users, without building the agent harness (tool calling, isolation, approvals, metering, secrets, audit trail) themselves.
- The agents need to call the developer's own functions or API, or an MCP server, on behalf of a specific customer, with each call signed and naming that customer.
- Each customer needs their own isolated workspace, a usage cap that matches their plan, approval before risky actions, and a record of what the agent did.
- The team wants current models without tracking releases: an agent picks a model tier, and OpenLegion keeps each tier on current models.

## When it does not fit yet
- Self-hosting: the platform is hosted. (The archived previous-generation engine was self-hosted.)
- Self-serve sign-up or published per-credit prices: the platform is in private beta, and partner prices are shared with early-access partners.

## Status (November 2026)
- The partner platform is in private beta. A small number of SaaS partners are being onboarded; others can request early access at https://www.openlegion.ai/en.
- Partner prices are not published. How billing works is described at https://www.openlegion.ai/en/pricing.
- A TypeScript kit for defining agents and tools is in development. Code on the website is a preview of its API, and names may change before release.
- OpenLegion's own app for teams is behind a waitlist while the company focuses on partners.
- Some older articles on this site describe the previous generation (a Python runtime with one Docker container per agent, a shared blackboard, and self-hosting). That engine is archived and no longer maintained; its source stays on GitHub (https://github.com/openlegion-ai/openlegion) under the PolyForm Perimeter License 1.0.1.

## How the platform works
- The partner keeps the customer relationship. OpenLegion never contacts a partner's customers: no emails, messages, notifications or OpenLegion branding reach them, and everything leaves through the partner's webhooks and API.
- Each end customer gets a workspace, created or found by the partner's own reference. Workspace data is isolated with row-level security in the database.
- Every tool call is an intent checked by one policy engine before it runs, and every action leaves a receipt.
- Three kinds of action wait for a person's approval: reaching a third party on someone's behalf, deleting data, and acting on untrusted content. Approvals are decided by a person, never by an agent.
- Content from the web, files and other people is labelled untrusted end to end and cannot trigger a send, a delete or a change on its own.
- Secrets are encrypted at rest and injected outside the model, which holds only a handle. Tool output is scanned for leaked secrets.
- Credits are reserved before each step runs. When a customer's cap or the partner's balance is reached, the work is refused rather than run and billed later. A suspended workspace stops at the next step.
- Billing: one prepaid credit pool per partner, monthly and daily caps per customer workspace, top-ups as credit grants, and unused credits returned to the pool when a workspace is archived.
- Integration: an HTTP API with separate test and live keys, signed calls to the partner's tools (their own functions or an MCP server), built-in web search and page fetching, and signed webhooks (timestamped HMAC, delivered at least once).
- Models: an agent template picks a model tier (quality versus cost), not a model id, and OpenLegion keeps each tier on current models.
- Not claimed: SOC 2, ISO 27001 or HIPAA certification, immunity to prompt injection, or a third-party penetration test.
`;

// ── Discovery (mirrors src/lib/markdown.ts) ─────────────────────────────────

function walkMarkdown(dir, base = dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    // Skip underscore-prefixed files (templates, drafts, partials).
    if (entry.name.startsWith("_")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkMarkdown(full, base));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      out.push(path.relative(base, full));
    }
  }
  return out;
}

function relPathToSlug(relPath) {
  const noExt = relPath.replace(/\.md$/, "");
  return `/${noExt.split(path.sep).join("/")}`;
}

function discover() {
  const all = walkMarkdown(CONTENT_DIR);
  const englishFiles = [];
  const localeFiles = new Map(); // base relPath -> [locales]

  for (const rel of all) {
    const segs = rel.split(path.sep);
    if (segs.length > 1 && TRANSLATION_LOCALES.has(segs[0])) {
      const base = segs.slice(1).join(path.sep);
      const arr = localeFiles.get(base) ?? [];
      arr.push(segs[0]);
      localeFiles.set(base, arr);
    } else {
      englishFiles.push(rel);
    }
  }

  return englishFiles
    .map((relPath) => {
      const filePath = path.join(CONTENT_DIR, relPath);
      const raw = fs.readFileSync(filePath, "utf-8");
      const { data, content } = matter(raw);
      const slug = relPathToSlug(relPath);
      return {
        slug,
        relPath,
        frontmatter: { ...data, slug },
        content,
        availableLocales: (localeFiles.get(relPath) ?? []).sort(),
      };
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

// ── Section grouping ────────────────────────────────────────────────────────

function groupForLinks(entries) {
  const hubs = [];
  const learn = [];
  const comparisons = [];
  const more = [];

  for (const e of entries) {
    if (e.slug === "/comparison") {
      hubs.push(e);
    } else if (e.slug.startsWith("/comparison/")) {
      comparisons.push(e);
    } else if (e.slug.startsWith("/learn/")) {
      learn.push(e);
    } else {
      more.push(e);
    }
  }

  return { hubs, learn, comparisons, more };
}

// ── llms.txt ────────────────────────────────────────────────────────────────

function buildLlmsTxt(entries) {
  const { hubs, learn, comparisons, more } = groupForLinks(entries);

  // Use /en-prefixed URLs so AI crawlers fetch canonicals directly without
  // following the next-intl 308 redirect from `/foo` → `/en/foo`.
  const fmt = (e) => `- ${e.frontmatter.title}: ${BASE_URL}/en${e.slug}`;

  const sections = [
    PREAMBLE,
    "## Links",
    "- Website: https://www.openlegion.ai/en",
    "- How billing works: https://www.openlegion.ai/en/pricing",
    "- Security: https://www.openlegion.ai/en/security",
    "- FAQ: https://www.openlegion.ai/en/faq",
    "- Previous-generation engine (archived, source-available): https://github.com/openlegion-ai/openlegion",
    "- Previous-generation engine documentation (archived): https://docs.openlegion.ai",
    ...hubs.map(fmt),
    "",
    "### Learn",
    ...learn.map(fmt),
    "",
    "### Comparisons",
    ...comparisons.map(fmt),
  ];

  if (more.length) {
    sections.push("", "### More", ...more.map(fmt));
  }

  return sections.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

// ── llms-full.txt ───────────────────────────────────────────────────────────

function buildLlmsFullTxt(entries) {
  const { hubs, learn, comparisons, more } = groupForLinks(entries);

  const fmtBody = (e) => {
    const url = `${BASE_URL}/en${e.slug}`;
    const meta = `<!-- ${url} | last_updated: ${e.frontmatter.last_updated ?? "unknown"} -->`;
    return `${meta}\n\n${e.content.trim()}\n`;
  };

  const sections = [
    "# OpenLegion — Full Reference",
    "",
    PREAMBLE.replace(/^# OpenLegion\n/, "").trim(),
    "",
    "---",
    "",
    "# Hub Pages",
    ...hubs.map(fmtBody),
    "---",
    "",
    "# Learn",
    ...learn.map(fmtBody),
    "---",
    "",
    "# Comparisons",
    ...comparisons.map(fmtBody),
  ];

  if (more.length) {
    sections.push("---", "", "# More", ...more.map(fmtBody));
  }

  return sections.join("\n").trim() + "\n";
}

// ── content-manifest.json ───────────────────────────────────────────────────

function buildManifest(entries) {
  // Manifest is deterministic — same content in, same bytes out — so
  // engine PRs that don't change the corpus produce zero diff. The freshness
  // signal is `pages[].lastUpdated`, which already exists per page.
  // Pages are sorted by slug (in `discover()`) so ordering is stable.
  return {
    baseUrl: BASE_URL,
    pageCount: entries.length,
    pages: entries.map((e) => ({
      slug: e.slug,
      title: e.frontmatter.title,
      description: e.frontmatter.description,
      primaryKeyword: e.frontmatter.primary_keyword,
      secondaryKeywords: e.frontmatter.secondary_keywords ?? [],
      schemaTypes: e.frontmatter.schema_types ?? [],
      lastUpdated: e.frontmatter.last_updated,
      pageType: e.frontmatter.page_type ?? inferPageType(e.slug),
      related: e.frontmatter.related ?? [],
      availableLocales: ["en", ...e.availableLocales],
      // Canonical (English) URL — matches what `withLocaleAlternates` emits.
      url: `${BASE_URL}/en${e.slug}`,
    })),
  };
}

// Must stay in sync with the same function in scripts/validate-content.mjs —
// the engine reads this manifest to pick the right page-type rules before
// drafting; a mismatch means a draft tuned to one threshold gets validated
// against another. Keep these aligned.
function inferPageType(slug) {
  if (slug === "/comparison" || slug === "/learn") return "hub";
  if (slug.startsWith("/comparison/")) return "comparison";
  if (slug.startsWith("/learn/")) return "learn";
  if (/-alternative$/.test(slug)) return "alternative";
  return "root";
}

// ── Main ────────────────────────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error(`Content directory not found: ${CONTENT_DIR}`);
    process.exit(1);
  }
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  const entries = discover();
  console.log(`Discovered ${entries.length} content pages`);

  fs.writeFileSync(path.join(PUBLIC_DIR, "llms.txt"), buildLlmsTxt(entries));
  fs.writeFileSync(path.join(PUBLIC_DIR, "llms-full.txt"), buildLlmsFullTxt(entries));
  fs.writeFileSync(
    path.join(PUBLIC_DIR, "content-manifest.json"),
    JSON.stringify(buildManifest(entries), null, 2) + "\n"
  );

  console.log("Wrote public/llms.txt, public/llms-full.txt, public/content-manifest.json");
}

main();
