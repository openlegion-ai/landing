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

> OpenLegion is a hosted platform for AI agents that do ongoing work for a person or a small team. Every run has a budget, every tool call is checked against the agent's permissions and recorded, and risky actions can wait for the owner's approval.

## Status (November 2026)
- The hosted platform has been rebuilt. The new version is in private beta, and new sign-ups join a waitlist.
- Some older articles on this site still describe the previous version (a Python runtime with one Docker container per agent, a shared blackboard, and self-hosting). They are being updated.
- Launch pricing is listed at https://www.openlegion.ai/en/pricing. Plans cannot be bought until sign-up opens.
- The previous-generation engine remains source-available on GitHub (https://github.com/openlegion-ai/openlegion) under the PolyForm Perimeter License 1.0.1.

## How the current platform works
- Sign in with Google. There is nothing to install.
- An agent is a saved record, not a running machine. It runs when there is work for it: a message, a task or a schedule. An idle agent uses no compute.
- A team can be described in one sentence. A supervisor agent sets it up and keeps work moving, and every change it makes can be undone.
- Budget is reserved before each run, and cost is shown per task and per run.
- Every tool call is checked against the agent's permissions and recorded.
- Actions such as sending a message, deleting data or changing an agent can be held for the owner's approval in the web app.
- Credentials go through a broker: the model works with a handle, not the secret.
- People can see, correct and delete what an agent remembers. Lessons it learns can be undone.
- Not available yet: browser automation, sending email on a user's behalf, and self-hosting the current platform.
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
    "- Previous-generation engine (source-available): https://github.com/openlegion-ai/openlegion",
    "- Previous-generation engine documentation: https://docs.openlegion.ai",
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
