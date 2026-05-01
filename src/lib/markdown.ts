import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import { SUPPORTED_LOCALES } from "@/lib/constants";

// ── Types ───────────────────────────────────────────────────────────────────

export interface ContentFrontmatter {
  title: string;
  description: string;
  slug: string;
  primary_keyword: string;
  secondary_keywords?: string[];
  date_published?: string;
  last_updated: string;
  schema_types: string[];
  howto_total_time?: string;
  howto_tools?: string[];
  /** Page-type tag for validator rule selection ("comparison" | "learn" | "alternative" | "root"). Optional; inferred from slug. */
  page_type?: string;
  /** Optional related-page slugs (full URL paths). Drives the in-page Related links and the internal-link graph. */
  related?: string[];
  /** Optional explicit author for E-E-A-T. Defaults to "OpenLegion" via JSON-LD. */
  author?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface HowToStep {
  name: string;
  text: string;
}

export interface HowToData {
  sectionName: string;
  steps: HowToStep[];
}

export interface ContentPage {
  frontmatter: ContentFrontmatter;
  html: string;
  faqs: FAQItem[];
  howTo: HowToData | null;
}

export interface ContentEntry {
  /** URL-style slug (e.g. "/comparison/openclaw"). */
  slug: string;
  /** Path on disk for the canonical (English) file, relative to CONTENT_DIR. */
  relPath: string;
  frontmatter: ContentFrontmatter;
  /** Locales (other than English) that have a translated copy of this file. */
  availableLocales: string[];
}

// ── Content directory + discovery ───────────────────────────────────────────

const CONTENT_DIR = path.join(process.cwd(), "src", "content");
const LOCALE_DIRS = new Set(SUPPORTED_LOCALES.filter((l) => l !== "en"));

/**
 * Convert a content-relative file path to its URL slug.
 *   "comparison/openclaw.md"          -> "/comparison/openclaw"
 *   "comparison.md"                   -> "/comparison"
 *   "openclaw-alternative.md"         -> "/openclaw-alternative"
 *   "learn/ai-agent-platform.md"      -> "/learn/ai-agent-platform"
 */
function relPathToSlug(relPath: string): string {
  const noExt = relPath.replace(/\.md$/, "");
  return `/${noExt}`;
}

function walkMarkdown(dir: string, base: string = dir): string[] {
  const out: string[] = [];
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

function buildContentMap(): Map<string, ContentEntry> {
  if (!fs.existsSync(CONTENT_DIR)) return new Map();

  const allFiles = walkMarkdown(CONTENT_DIR);

  // Partition: locale-prefixed files vs canonical English files.
  const englishFiles: string[] = [];
  const localeFiles = new Map<string, string[]>(); // relPath (without locale prefix) -> [locales]

  for (const rel of allFiles) {
    const segments = rel.split(path.sep);
    if (segments.length > 1 && LOCALE_DIRS.has(segments[0])) {
      const locale = segments[0];
      const base = segments.slice(1).join(path.sep);
      const arr = localeFiles.get(base) ?? [];
      arr.push(locale);
      localeFiles.set(base, arr);
    } else {
      englishFiles.push(rel);
    }
  }

  const map = new Map<string, ContentEntry>();

  for (const relPath of englishFiles) {
    const filePath = path.join(CONTENT_DIR, relPath);
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data } = matter(raw);
    const frontmatter = data as ContentFrontmatter;

    const expectedSlug = relPathToSlug(relPath);
    if (!frontmatter.slug) {
      throw new Error(`Missing slug frontmatter in src/content/${relPath}`);
    }
    if (frontmatter.slug !== expectedSlug) {
      throw new Error(
        `Slug mismatch in src/content/${relPath}: frontmatter.slug "${frontmatter.slug}" does not match file path (expected "${expectedSlug}"). File path must mirror URL.`
      );
    }
    if (map.has(expectedSlug)) {
      throw new Error(`Duplicate slug "${expectedSlug}" in content map`);
    }

    const availableLocales = (localeFiles.get(relPath) ?? []).sort();

    map.set(expectedSlug, {
      slug: expectedSlug,
      relPath,
      frontmatter: { ...frontmatter, slug: expectedSlug },
      availableLocales,
    });
  }

  return map;
}

// Memoized at module load. Next.js bundles this; in dev the module re-evaluates
// on edit. CONTENT_DIR is a finite tree so the cost is bounded.
const CONTENT_MAP: Map<string, ContentEntry> = buildContentMap();

/** Resolve the actual file to read for (slug, locale). Falls back to English. */
function resolveContentPath(entry: ContentEntry, locale?: string): string {
  if (locale && locale !== "en" && entry.availableLocales.includes(locale)) {
    return path.join(CONTENT_DIR, locale, entry.relPath);
  }
  return path.join(CONTENT_DIR, entry.relPath);
}

// ── Public API ──────────────────────────────────────────────────────────────

export async function getContentPage(slug: string, locale?: string): Promise<ContentPage> {
  const entry = CONTENT_MAP.get(slug);
  if (!entry) throw new Error(`No content for slug: ${slug}`);

  const filePath = resolveContentPath(entry, locale);
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  // Translation files may legitimately omit the slug; pull it from the canonical entry.
  const frontmatter = { ...entry.frontmatter, ...(data as ContentFrontmatter), slug: entry.slug };

  const faqs = extractFAQs(content);
  const howTo = extractHowTo(content);
  const html = await renderMarkdown(content);

  return { frontmatter, html, faqs, howTo };
}

export function getContentEntry(slug: string): ContentEntry | undefined {
  return CONTENT_MAP.get(slug);
}

export function hasContent(slug: string): boolean {
  return CONTENT_MAP.has(slug);
}

export function getAllContentEntries(): ContentEntry[] {
  return Array.from(CONTENT_MAP.values());
}

/** Backwards-compatible accessor for sitemap and similar consumers. */
export function getAllContentPages(): ContentFrontmatter[] {
  return getAllContentEntries().map((e) => e.frontmatter);
}

/** Slugs whose URL starts with the given prefix (e.g., "/comparison/"). */
export function getSlugsByPrefix(prefix: string): string[] {
  return getAllContentEntries()
    .filter((e) => e.slug.startsWith(prefix))
    .map((e) => e.slug);
}

/** Comparison sub-page entries (excludes the /comparison hub itself). */
export function getComparisonSubPageEntries(): ContentEntry[] {
  return getAllContentEntries()
    .filter((e) => e.slug.startsWith("/comparison/"))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

/** Learn sub-page entries. */
export function getLearnEntries(): ContentEntry[] {
  return getAllContentEntries()
    .filter((e) => e.slug.startsWith("/learn/"))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

/** Root-level content entries (slug has exactly one segment, excluding hubs). */
export function getRootContentEntries(): ContentEntry[] {
  return getAllContentEntries().filter((e) => {
    const segs = e.slug.replace(/^\//, "").split("/");
    return segs.length === 1 && !["comparison", "learn"].includes(segs[0]);
  });
}

// ── FAQ extraction (for JSON-LD) ────────────────────────────────────────────

function extractFAQs(content: string): FAQItem[] {
  const faqs: FAQItem[] = [];

  const faqMarker = content.indexOf("<!-- SCHEMA: FAQPage -->");
  if (faqMarker === -1) return faqs;

  const faqContent = content.slice(faqMarker);

  const internalLinksIdx = faqContent.search(/## (?:Internal Links|Related Comparisons|Related Pages)/);
  const faqSection =
    internalLinksIdx !== -1
      ? faqContent.slice(0, internalLinksIdx)
      : faqContent;

  const h3Regex = /### (.+)\n\n([\s\S]*?)(?=\n### |\n---|\n## |$)/g;
  let match;
  while ((match = h3Regex.exec(faqSection)) !== null) {
    const question = match[1].trim();
    const answer = match[2]
      .trim()
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/_([^_]+)_/g, "$1");
    faqs.push({ question, answer });
  }

  return faqs;
}

// ── HowTo extraction (for JSON-LD) ───────────────────────────────────────────

function extractHowTo(content: string): HowToData | null {
  const marker = content.indexOf("<!-- SCHEMA: HowTo -->");
  if (marker === -1) return null;

  const afterMarker = content.slice(marker);

  const h2Match = afterMarker.match(/\n## (.+)\n/);
  if (!h2Match) return null;

  const sectionName = h2Match[1].trim();
  const sectionStart = afterMarker.indexOf(h2Match[0]);
  const sectionContent = afterMarker.slice(sectionStart);

  const nextH2 = sectionContent.slice(1).search(/\n## /);
  const section = nextH2 !== -1 ? sectionContent.slice(0, nextH2 + 1) : sectionContent;

  const stepRegex = /### Step \d+: (.+)\n\n([\s\S]*?)(?=\n### |\n## |$)/g;
  const steps: HowToStep[] = [];
  let match;
  while ((match = stepRegex.exec(section)) !== null) {
    const name = match[1].trim();
    const text = match[2]
      .trim()
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/_([^_]+)_/g, "$1");
    steps.push({ name, text });
  }

  if (steps.length === 0) return null;

  return { sectionName, steps };
}

// ── Markdown rendering ──────────────────────────────────────────────────────

async function renderMarkdown(content: string): Promise<string> {
  let processed = content;

  // 1. Convert definition blocks to semantic HTML
  processed = processed.replace(
    /<!-- SCHEMA: DefinitionBlock -->\n\n> \*\*(.+?)\*\*\n> (.+)/g,
    '<section class="definition-block" itemscope itemtype="https://schema.org/DefinedTerm">\n<h2 class="definition-term" itemprop="name">$1</h2>\n<p itemprop="description">$2</p>\n</section>'
  );

  // 2. Remove the "## CTA" heading (keep content below)
  processed = processed.replace(/\n## CTA\n/g, "\n");

  // 3. Strip "## Internal Links" / "## Related Comparisons" / "## Related Pages" + everything after
  const internalLinksIdx = processed.search(/## (?:Internal Links|Related Comparisons|Related Pages)/);
  if (internalLinksIdx !== -1) {
    processed = processed.slice(0, internalLinksIdx);
  }

  // 4. Strip trailing separators
  processed = processed.replace(/\n---\s*$/g, "");
  processed = processed.replace(/\n---\n\n<!-- SCHEMA: FAQPage -->/g, "\n<!-- SCHEMA: FAQPage -->");

  // 5. Strip schema comment markers
  processed = processed.replace(/<!-- SCHEMA: FAQPage -->\n\n/g, "");
  processed = processed.replace(/<!-- SCHEMA: HowTo -->\n\n/g, "");

  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeStringify)
    .process(processed);

  let html = String(result);

  html = html.replace(
    /<table>/g,
    '<figure class="table-wrapper"><div class="table-scroll"><table>'
  );
  html = html.replace(/<\/table>/g, "</table></div></figure>");

  html = html.replace(/(<thead>[\s\S]*?<\/thead>)/g, (theadBlock) =>
    theadBlock.replace(/<th>/g, '<th scope="col">')
  );

  html = html.replace(/(<tbody>[\s\S]*?<\/tbody>)/g, (tbodyBlock) =>
    tbodyBlock.replace(/<tr><td>([\s\S]*?)<\/td>/g, '<tr><th scope="row">$1</th>')
  );

  html = html.replace(
    /<p><strong>([^<]+)<\/strong>\n?((?:<a href="[^"]+?">[^<]+?<\/a>(?:\s*\|\s*)?)+)<\/p>/g,
    (_, heading, links) => {
      const cleanLinks = links.replace(/\s*\|\s*/g, "");
      return `<div class="cta-block"><p class="cta-heading">${heading}</p><div class="cta-buttons">${cleanLinks}</div></div>`;
    }
  );

  html = wrapFaqSection(html);

  return html;
}

function wrapFaqSection(html: string): string {
  const faqHeadingRegex = /<h2>Frequently Asked Questions<\/h2>/;
  const faqMatch = faqHeadingRegex.exec(html);
  if (!faqMatch) return html;

  const faqStart = faqMatch.index;
  const beforeFaq = html.slice(0, faqStart);
  const faqAndAfter = html.slice(faqStart);

  const h3Pattern = /<h3>([\s\S]*?)<\/h3>/g;
  const h3Matches: { question: string; startIdx: number; endIdx: number }[] = [];
  let h3Match;
  while ((h3Match = h3Pattern.exec(faqAndAfter)) !== null) {
    h3Matches.push({
      question: h3Match[1],
      startIdx: h3Match.index,
      endIdx: h3Match.index + h3Match[0].length,
    });
  }

  if (h3Matches.length === 0) return html;

  const faqHeading = faqMatch[0];
  let faqHtml = `<section class="faq-section" itemscope itemtype="https://schema.org/FAQPage">\n${faqHeading}\n`;

  for (let i = 0; i < h3Matches.length; i++) {
    const current = h3Matches[i];
    const nextStart =
      i + 1 < h3Matches.length ? h3Matches[i + 1].startIdx : faqAndAfter.length;
    const answerHtml = faqAndAfter.slice(current.endIdx, nextStart).trim();

    faqHtml += `<div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">\n`;
    faqHtml += `<h3 itemprop="name">${current.question}</h3>\n`;
    faqHtml += `<div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">\n`;
    faqHtml += `<div itemprop="text">${answerHtml}</div>\n`;
    faqHtml += `</div>\n</div>\n`;
  }

  faqHtml += `</section>`;

  return beforeFaq + faqHtml;
}
