#!/usr/bin/env node
/**
 * Content quality gate. Runs in CI on every PR that touches src/content/**.
 *
 * Hard-fails on any check that would produce thin, duplicate, broken, or
 * AI-slop content. The OpenLegion engine merges content PRs based solely on
 * this validator passing — keep it strict.
 *
 * Usage:
 *   node scripts/validate-content.mjs              # validate all pages
 *   node scripts/validate-content.mjs --calibrate  # print similarity baseline + word-count stats
 *
 * Page-type rules are derived from the slug (or `page_type` frontmatter).
 */
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, "src", "content");
const SCHEMA_PATH = path.join(ROOT, "content-schema.json");

// Mirror of SUPPORTED_LOCALES from src/lib/constants.ts (en excluded).
const TRANSLATION_LOCALES = new Set([
  "zh", "zh-TW", "ja", "ko", "es", "fr", "de", "pt", "ar", "hi", "ru",
]);

const SCHEMA = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf-8"));

// ── Page-type rule sets ────────────────────────────────────────────────────

const PAGE_TYPE_RULES = {
  comparison: { minWords: 800, requireFaq: true, requireOpenLegionTake: true },
  learn:      { minWords: 600, requireFaq: true, requireOpenLegionTake: true },
  alternative:{ minWords: 800, requireFaq: true, requireOpenLegionTake: true },
  root:       { minWords: 600, requireFaq: true, requireOpenLegionTake: true },
  hub:        { minWords: 400, requireFaq: true, requireOpenLegionTake: false },
};

const SIMILARITY_MARGIN = 0.05;
const FRESHNESS_WARN_MONTHS = 12;
const LEDE_MIN_WORDS = 35;
const LEDE_MAX_WORDS = 90;
const FAQ_MIN_QUESTIONS = 5;
// Section names that satisfy the "unique POV" requirement. The engine should
// prefer "OpenLegion's Take", but TL;DR / Bottom Line / Verdict / In Practice
// also count when they contain opinionated, non-generic claims.
const POV_SECTION_PATTERNS = [
  /^##\s+OpenLegion'?s\s+Take/im,
  /^##\s+Our\s+Take/im,
  /^##\s+Bottom\s+Line/im,
  /^##\s+The\s+Verdict/im,
  /^##\s+In\s+Practice/im,
  /^##\s+TL;?DR/im,
];
const PLACEHOLDER_STRINGS = [
  "lorem ipsum",
  "todo:",
  "<!-- todo",
  "[insert",
  "{{ ",
  "as an ai",
  "as a language model",
  "i am an ai",
  "i'm an ai",
];
const GENERIC_ALT_TEXT = new Set([
  "image", "screenshot", "chart", "graph", "logo", "diagram", "picture",
  "photo", "img", "alt text",
]);
const STOPWORDS = new Set([
  "a","an","and","are","as","at","be","by","for","from","has","have","he","i",
  "in","is","it","its","of","on","or","that","the","to","was","were","will",
  "with","you","your","this","these","they","them","their","but","not","do",
  "does","did","so","if","than","then","when","what","which","who","whom",
  "whose","why","how","there","here","also","more","most","such","one","two",
  "can","may","just","also","only","very","much","into","over","up","out",
  "we","us","our","ours","you've","we've","i've","it's","that's","openlegion",
]);

// ── Helpers ─────────────────────────────────────────────────────────────────

function relPathToSlug(relPath) {
  const noExt = relPath.replace(/\.md$/, "");
  return `/${noExt.split(path.sep).join("/")}`;
}

function inferPageType(slug) {
  if (slug === "/comparison" || slug === "/learn") return "hub";
  if (slug.startsWith("/comparison/")) return "comparison";
  if (slug.startsWith("/learn/")) return "learn";
  if (/-alternative$/.test(slug)) return "alternative";
  return "root";
}

function walkMarkdown(dir, base = dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkMarkdown(full, base));
    else if (entry.isFile() && entry.name.endsWith(".md") && !entry.name.startsWith("_")) {
      out.push(path.relative(base, full));
    }
  }
  return out;
}

function isTranslationPath(relPath) {
  const segs = relPath.split(path.sep);
  return segs.length > 1 && TRANSLATION_LOCALES.has(segs[0]);
}

// Tokenize for TF-IDF + word counting.
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t && t.length > 2 && !STOPWORDS.has(t));
}

// Strip markdown to plain prose for word count + lede extraction + tokenization.
function stripMarkdown(md) {
  return md
    .replace(/```[\s\S]*?```/g, " ") // code blocks
    .replace(/`[^`]+`/g, " ")       // inline code
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ") // images
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links → text
    .replace(/<!--[\s\S]*?-->/g, " ") // html comments
    .replace(/<[^>]+>/g, " ")       // html tags
    .replace(/[#*_>|~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordCount(text) {
  return stripMarkdown(text).split(/\s+/).filter(Boolean).length;
}

// ── Frontmatter validation (lightweight; mirrors content-schema.json) ───────

function validateFrontmatter(fm, expectedSlug) {
  const errors = [];
  const required = SCHEMA.required;
  for (const key of required) {
    if (fm[key] === undefined || fm[key] === null || fm[key] === "") {
      errors.push(`missing required frontmatter: ${key}`);
    }
  }
  // String length + pattern checks for the high-impact fields.
  const props = SCHEMA.properties;
  for (const [key, value] of Object.entries(fm)) {
    const def = props[key];
    if (!def) {
      errors.push(`unknown frontmatter key: ${key}`);
      continue;
    }
    if (def.type === "string") {
      if (typeof value !== "string") {
        errors.push(`${key} must be a string`);
        continue;
      }
      if (def.minLength && value.length < def.minLength) {
        errors.push(`${key}: too short (${value.length} < ${def.minLength})`);
      }
      if (def.maxLength && value.length > def.maxLength) {
        errors.push(`${key}: too long (${value.length} > ${def.maxLength})`);
      }
      if (def.pattern && !new RegExp(def.pattern).test(value)) {
        errors.push(`${key}: doesn't match required pattern ${def.pattern}`);
      }
      if (def.enum && !def.enum.includes(value)) {
        errors.push(`${key}: must be one of ${def.enum.join("|")}`);
      }
    }
    if (def.type === "array") {
      if (!Array.isArray(value)) {
        errors.push(`${key} must be an array`);
        continue;
      }
      if (def.items?.enum) {
        for (const item of value) {
          if (!def.items.enum.includes(item)) {
            errors.push(`${key}: contains invalid value "${item}"`);
          }
        }
      }
    }
  }
  if (fm.slug !== expectedSlug) {
    errors.push(
      `slug mismatch: frontmatter "${fm.slug}" but file path implies "${expectedSlug}"`
    );
  }
  return errors;
}

// ── Content checks ──────────────────────────────────────────────────────────

function extractH1(content) {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

function extractAllHeadings(content) {
  const out = [];
  const lines = content.split("\n");
  let inCode = false;
  for (const line of lines) {
    if (line.startsWith("```")) inCode = !inCode;
    if (inCode) continue;
    const m = line.match(/^(#{1,6})\s+(.+)$/);
    if (m) out.push({ level: m[1].length, text: m[2].trim() });
  }
  return out;
}

function checkHeadingHierarchy(content) {
  const headings = extractAllHeadings(content);
  const errors = [];
  const h1Count = headings.filter((h) => h.level === 1).length;
  if (h1Count === 0) errors.push("missing H1");
  if (h1Count > 1) errors.push(`multiple H1s (${h1Count})`);
  let prevLevel = 0;
  for (const h of headings) {
    if (prevLevel > 0 && h.level > prevLevel + 1) {
      errors.push(`heading skip: level ${prevLevel} → ${h.level} ("${h.text}")`);
    }
    prevLevel = h.level;
  }
  return errors;
}

function extractLede(content) {
  // First non-frontmatter prose paragraph after the H1.
  const afterH1 = content.split(/\n#\s+.+\n/)[1];
  if (!afterH1) return null;
  const paragraphs = afterH1.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  for (const p of paragraphs) {
    if (p.startsWith("#") || p.startsWith("<!--") || p.startsWith(">") || p.startsWith("-") || p.startsWith("|")) continue;
    return p;
  }
  return null;
}

function countFaqQuestions(content) {
  const marker = content.indexOf("<!-- SCHEMA: FAQPage -->");
  if (marker === -1) return 0;
  const afterMarker = content.slice(marker);
  const stopAt = afterMarker.search(/\n## (?!Frequently)/m); // next H2 ends FAQ
  const section = stopAt !== -1 ? afterMarker.slice(0, stopAt) : afterMarker;
  return (section.match(/\n### /g) || []).length;
}

function checkPlaceholders(content) {
  const lower = content.toLowerCase();
  const found = [];
  for (const needle of PLACEHOLDER_STRINGS) {
    if (lower.includes(needle)) found.push(needle);
  }
  return found;
}

function checkImages(content) {
  const errors = [];
  const re = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const alt = m[1].trim();
    const src = m[2];
    if (!alt) {
      errors.push(`image missing alt text: ${src}`);
    } else if (GENERIC_ALT_TEXT.has(alt.toLowerCase())) {
      errors.push(`image generic alt "${alt}": ${src}`);
    }
  }
  return errors;
}

function checkInternalLinks(content, knownSlugs) {
  const errors = [];
  const re = /\]\((\/[a-z0-9/-]+)(?:#[^)]*)?\)/gi;
  let m;
  while ((m = re.exec(content)) !== null) {
    const url = m[1];
    if (knownSlugs.has(url)) continue;
    // Allow well-known nav routes that aren't markdown-driven.
    if (["/", "/pricing", "/faq", "/terms", "/privacy", "/money-back-guarantee"].includes(url)) continue;
    if (url.startsWith("/comparison/") || url.startsWith("/learn/") || url.startsWith("/")) {
      errors.push(`internal link 404: ${url}`);
    }
  }
  return errors;
}

function checkRelatedSlugs(related, knownSlugs, currentSlug) {
  const errors = [];
  if (!related) return errors;
  for (const slug of related) {
    if (slug === currentSlug) {
      errors.push(`related: includes self "${slug}"`);
    } else if (!knownSlugs.has(slug)) {
      errors.push(`related: "${slug}" does not resolve to a page`);
    }
  }
  return errors;
}

function checkFreshness(lastUpdated) {
  const errors = [];
  const normalized = /^\d{4}-\d{2}$/.test(lastUpdated)
    ? `${lastUpdated}-01`
    : lastUpdated;
  const d = new Date(normalized);
  if (isNaN(d.getTime())) {
    errors.push(`last_updated: invalid date "${lastUpdated}"`);
    return errors;
  }
  const monthsAgo = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 30);
  if (monthsAgo > FRESHNESS_WARN_MONTHS) {
    errors.push(
      `last_updated: ${monthsAgo.toFixed(0)} months old — refresh before merging`
    );
  }
  return errors;
}

function checkPovSection(content) {
  return POV_SECTION_PATTERNS.some((re) => re.test(content));
}

/** Primary keyword satisfied if every word in it appears in the title. */
function titleContainsKeyword(title, keyword) {
  const titleLower = title.toLowerCase();
  const words = keyword.toLowerCase().split(/\s+/).filter(Boolean);
  return words.every((w) => titleLower.includes(w));
}

function h1ContainsKeyword(h1, keyword) {
  const h1Lower = h1.toLowerCase();
  const words = keyword.toLowerCase().split(/\s+/).filter(Boolean);
  return words.every((w) => h1Lower.includes(w));
}

// ── TF-IDF similarity ──────────────────────────────────────────────────────

function buildTfidfVectors(docs) {
  // docs: [{slug, tokens: [string]}]
  const N = docs.length;
  const df = new Map();
  for (const doc of docs) {
    const seen = new Set(doc.tokens);
    for (const t of seen) df.set(t, (df.get(t) || 0) + 1);
  }
  return docs.map((doc) => {
    const tf = new Map();
    for (const t of doc.tokens) tf.set(t, (tf.get(t) || 0) + 1);
    const vec = new Map();
    for (const [t, count] of tf) {
      const idf = Math.log(N / (df.get(t) || 1));
      vec.set(t, count * idf);
    }
    return { slug: doc.slug, vec };
  });
}

function cosine(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const v of a.values()) normA += v * v;
  for (const v of b.values()) normB += v * v;
  for (const [t, va] of a) {
    const vb = b.get(t);
    if (vb !== undefined) dot += va * vb;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function ledePlusH2s(content) {
  const h1 = extractH1(content) || "";
  const lede = extractLede(content) || "";
  const h2s = extractAllHeadings(content)
    .filter((h) => h.level === 2)
    .map((h) => h.text)
    .join(" ");
  return `${h1} ${lede} ${h2s}`;
}

// ── Main ────────────────────────────────────────────────────────────────────

function loadCanonicalPages() {
  const all = walkMarkdown(CONTENT_DIR);
  const pages = [];
  for (const relPath of all) {
    if (isTranslationPath(relPath)) continue;
    const filePath = path.join(CONTENT_DIR, relPath);
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = matter(raw);
    pages.push({
      relPath,
      slug: relPathToSlug(relPath),
      frontmatter: parsed.data,
      content: parsed.content,
    });
  }
  return pages;
}

function validatePage(page, knownSlugs, baseline, baselineByOthers) {
  const errors = [];
  const fm = page.frontmatter;

  errors.push(...validateFrontmatter(fm, page.slug).map((e) => `frontmatter: ${e}`));

  const pageType = fm.page_type ?? inferPageType(page.slug);
  const rules = PAGE_TYPE_RULES[pageType];
  if (!rules) {
    errors.push(`unknown page_type: ${pageType}`);
    return errors;
  }

  // Word count.
  const wc = wordCount(page.content);
  if (wc < rules.minWords) {
    errors.push(`thin content: ${wc} words (min ${rules.minWords} for ${pageType})`);
  }

  // Primary keyword presence — require every word of the keyword to appear,
  // not the exact substring. "ai agent framework comparison 2026" should pass
  // for "AI Agent Framework Comparison Hub 2026".
  const h1 = extractH1(page.content);
  if (!h1) {
    errors.push("missing H1");
  } else if (fm.primary_keyword && !h1ContainsKeyword(h1, fm.primary_keyword)) {
    errors.push(`primary_keyword "${fm.primary_keyword}" words not all in H1: "${h1}"`);
  }
  if (fm.primary_keyword && fm.title && !titleContainsKeyword(fm.title, fm.primary_keyword)) {
    errors.push(`primary_keyword "${fm.primary_keyword}" words not all in title: "${fm.title}"`);
  }

  // Lede paragraph.
  const lede = extractLede(page.content);
  if (!lede) {
    errors.push("missing lede paragraph after H1");
  } else {
    const ledeWc = wordCount(lede);
    if (ledeWc < LEDE_MIN_WORDS || ledeWc > LEDE_MAX_WORDS) {
      errors.push(`lede paragraph length ${ledeWc} outside ${LEDE_MIN_WORDS}-${LEDE_MAX_WORDS} words`);
    }
  }

  // Heading hierarchy.
  errors.push(...checkHeadingHierarchy(page.content).map((e) => `headings: ${e}`));

  // FAQ count.
  if (rules.requireFaq) {
    const faqCount = countFaqQuestions(page.content);
    if (faqCount < FAQ_MIN_QUESTIONS) {
      errors.push(`FAQ: only ${faqCount} H3 questions (min ${FAQ_MIN_QUESTIONS})`);
    }
  }

  // Unique POV section. Accepts "OpenLegion's Take" (preferred) or any of the
  // alternative section names listed in POV_SECTION_PATTERNS.
  if (rules.requireOpenLegionTake && !checkPovSection(page.content)) {
    errors.push(
      "missing unique-POV section (one of: OpenLegion's Take, Our Take, Bottom Line, The Verdict, In Practice, TL;DR)"
    );
  }

  // Placeholders.
  const placeholders = checkPlaceholders(page.content);
  if (placeholders.length) {
    errors.push(`placeholder strings present: ${placeholders.join(", ")}`);
  }

  // Images.
  errors.push(...checkImages(page.content));

  // Internal links resolve.
  errors.push(...checkInternalLinks(page.content, knownSlugs));

  // Related slugs resolve.
  errors.push(...checkRelatedSlugs(fm.related, knownSlugs, page.slug));

  // Freshness.
  if (fm.last_updated) {
    errors.push(...checkFreshness(fm.last_updated));
  }

  // Similarity.
  const myMaxSimilarity = baselineByOthers.get(page.slug);
  if (myMaxSimilarity !== undefined && myMaxSimilarity > baseline + SIMILARITY_MARGIN) {
    errors.push(
      `near-duplicate: TF-IDF similarity ${myMaxSimilarity.toFixed(3)} exceeds baseline ${baseline.toFixed(3)} + ${SIMILARITY_MARGIN}`
    );
  }

  return errors;
}

function main() {
  const args = process.argv.slice(2);
  const calibrate = args.includes("--calibrate");

  const pages = loadCanonicalPages();
  const knownSlugs = new Set(pages.map((p) => p.slug));

  // Build TF-IDF on (H1 + lede + H2s) — what AI assistants actually sample.
  const docs = pages.map((p) => ({
    slug: p.slug,
    tokens: tokenize(ledePlusH2s(p.content)),
  }));
  const vectors = buildTfidfVectors(docs);

  // Compute pairwise similarity matrix once.
  const sims = new Map(); // slug -> max similarity to any other page
  for (let i = 0; i < vectors.length; i++) {
    let max = 0;
    for (let j = 0; j < vectors.length; j++) {
      if (i === j) continue;
      const s = cosine(vectors[i].vec, vectors[j].vec);
      if (s > max) max = s;
    }
    sims.set(vectors[i].slug, max);
  }
  const overallMax = Math.max(...sims.values());
  const baseline = overallMax; // pairs already include each page; new pages get + margin

  if (calibrate) {
    console.log("\n=== Calibration report ===\n");
    console.log(`Pages: ${pages.length}`);
    const wcs = pages.map((p) => ({ slug: p.slug, wc: wordCount(p.content) }));
    wcs.sort((a, b) => a.wc - b.wc);
    console.log(`\nWord counts:`);
    for (const { slug, wc } of wcs) console.log(`  ${wc.toString().padStart(5)} ${slug}`);
    console.log(`\nMax pairwise TF-IDF similarity: ${overallMax.toFixed(3)}`);
    const top = [...sims.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    console.log(`Top 5 pages by max sim to any other:`);
    for (const [slug, s] of top) console.log(`  ${s.toFixed(3)} ${slug}`);
    console.log(`\nSuggested similarity threshold: ${(overallMax + SIMILARITY_MARGIN).toFixed(3)}`);
    return;
  }

  console.log(`Validating ${pages.length} pages…`);
  console.log(`Similarity baseline: ${baseline.toFixed(3)} (margin +${SIMILARITY_MARGIN})\n`);

  let totalErrors = 0;
  let failedPages = 0;
  for (const page of pages) {
    const errors = validatePage(page, knownSlugs, baseline, sims);
    if (errors.length) {
      failedPages += 1;
      totalErrors += errors.length;
      console.log(`✗ ${page.slug}`);
      for (const e of errors) console.log(`    ${e}`);
    } else {
      console.log(`✓ ${page.slug}`);
    }
  }

  console.log("");
  if (totalErrors > 0) {
    console.error(`FAIL: ${failedPages} pages failed with ${totalErrors} total errors`);
    process.exit(1);
  }
  console.log(`PASS: ${pages.length} pages validated cleanly`);
}

main();
