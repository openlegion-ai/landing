import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";

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
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ContentPage {
  frontmatter: ContentFrontmatter;
  html: string;
  faqs: FAQItem[];
}

// ── Content directory ───────────────────────────────────────────────────────

const CONTENT_DIR = path.join(process.cwd(), "src", "content");

const SLUG_TO_FILE: Record<string, string> = {
  "/ai-agent-platform": "ai-agent-platform.md",
  "/ai-agent-orchestration": "ai-agent-orchestration.md",
  "/ai-agent-frameworks": "ai-agent-frameworks.md",
  "/ai-agent-security": "ai-agent-security.md",
  "/comparison": "comparison-all-competitors.md",
  "/comparison/openclaw": "comparison-openclaw.md",
  "/comparison/dify": "comparison-dify.md",
  "/comparison/openai-agents-sdk": "comparison-openai-agents-sdk.md",
  "/comparison/semantic-kernel": "comparison-semantic-kernel.md",
  "/comparison/autogen": "comparison-autogen.md",
  "/comparison/crewai": "comparison-crewai.md",
  "/comparison/langgraph": "comparison-langgraph.md",
  "/comparison/manus-ai": "comparison-manus-ai.md",
  "/comparison/aws-strands": "comparison-aws-strands.md",
  "/comparison/google-adk": "comparison-google-adk.md",
  "/comparison/zeroclaw": "comparison-zeroclaw.md",
  "/comparison/nanoclaw": "comparison-nanoclaw.md",
  "/comparison/nanobot": "comparison-nanobot.md",
  "/comparison/picoclaw": "comparison-picoclaw.md",
  "/comparison/openfang": "comparison-openfang.md",
  "/comparison/memu": "comparison-memu.md",
  "/openclaw-alternative": "openclaw-alternative.md",
};

// ── Load + parse content ────────────────────────────────────────────────────

export async function getContentPage(slug: string): Promise<ContentPage> {
  const filename = SLUG_TO_FILE[slug];
  if (!filename) throw new Error(`No content file for slug: ${slug}`);

  const filePath = path.join(CONTENT_DIR, filename);
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const frontmatter = data as ContentFrontmatter;

  // Extract FAQs before processing (from raw markdown)
  const faqs = extractFAQs(content);

  // Process markdown to HTML
  const html = await renderMarkdown(content);

  return { frontmatter, html, faqs };
}

export function getAllContentPages(): ContentFrontmatter[] {
  return Object.entries(SLUG_TO_FILE).map(([slug, filename]) => {
    const filePath = path.join(CONTENT_DIR, filename);
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data } = matter(raw);
    return { ...(data as ContentFrontmatter), slug };
  });
}

// ── FAQ extraction (for JSON-LD) ────────────────────────────────────────────

function extractFAQs(content: string): FAQItem[] {
  const faqs: FAQItem[] = [];

  const faqMarker = content.indexOf("<!-- SCHEMA: FAQPage -->");
  if (faqMarker === -1) return faqs;

  const faqContent = content.slice(faqMarker);

  // Stop at "## Internal Links" / "## Related Comparisons" or end of content
  const internalLinksIdx = faqContent.search(/## (?:Internal Links|Related Comparisons)/);
  const faqSection =
    internalLinksIdx !== -1
      ? faqContent.slice(0, internalLinksIdx)
      : faqContent;

  // Extract H3 questions and their answers
  const h3Regex = /### (.+)\n\n([\s\S]*?)(?=\n### |\n---|\n## |$)/g;
  let match;
  while ((match = h3Regex.exec(faqSection)) !== null) {
    const question = match[1].trim();
    const answer = match[2]
      .trim()
      // Strip markdown links → plain text for JSON-LD
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Strip bold markers
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      // Strip inline code
      .replace(/`([^`]+)`/g, "$1")
      // Strip italic markers
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/_([^_]+)_/g, "$1");
    faqs.push({ question, answer });
  }

  return faqs;
}

// ── Markdown rendering ──────────────────────────────────────────────────────

async function renderMarkdown(content: string): Promise<string> {
  let processed = content;

  // ── Pre-processing (before remark) ────────────────────────────────────

  // 1. Convert definition blocks to semantic HTML
  processed = processed.replace(
    /<!-- SCHEMA: DefinitionBlock -->\n\n> \*\*(.+?)\*\*\n> (.+)/g,
    '<section class="definition-block" itemscope itemtype="https://schema.org/DefinedTerm">\n<h2 class="definition-term" itemprop="name">$1</h2>\n<p itemprop="description">$2</p>\n</section>'
  );

  // 2. Remove the "## CTA" heading (keep the content below it)
  processed = processed.replace(/\n## CTA\n/g, "\n");

  // 3. Remove "## Internal Links" or "## Related Comparisons" section and everything after it
  const internalLinksIdx = processed.search(/## (?:Internal Links|Related Comparisons)/);
  if (internalLinksIdx !== -1) {
    processed = processed.slice(0, internalLinksIdx);
  }

  // 4. Remove trailing --- separators
  processed = processed.replace(/\n---\s*$/g, "");
  processed = processed.replace(/\n---\n\n<!-- SCHEMA: FAQPage -->/g, "\n<!-- SCHEMA: FAQPage -->");

  // 5. Strip the FAQPage comment marker (remark doesn't need it; we handle FAQ in post-processing)
  processed = processed.replace(/<!-- SCHEMA: FAQPage -->\n\n/g, "");

  // ── Run remark pipeline ───────────────────────────────────────────────
  // This processes ALL markdown including FAQ content, so links, bold,
  // code, etc. are properly converted to HTML.

  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeStringify)
    .process(processed);

  let html = String(result);

  // ── Post-processing (after remark) ────────────────────────────────────

  // 1. Wrap tables in scrollable figures
  html = html.replace(
    /<table>/g,
    '<figure class="table-wrapper"><div class="table-scroll"><table>'
  );
  html = html.replace(/<\/table>/g, "</table></div></figure>");

  // 2. Add scope="col" to th elements in thead
  html = html.replace(/(<thead>[\s\S]*?<\/thead>)/g, (theadBlock) =>
    theadBlock.replace(/<th>/g, '<th scope="col">')
  );

  // 2b. Convert first cell in each tbody row to th (comparison tables)
  html = html.replace(/(<tbody>[\s\S]*?<\/tbody>)/g, (tbodyBlock) =>
    tbodyBlock.replace(/<tr><td>([\s\S]*?)<\/td>/g, '<tr><th scope="row">$1</th>')
  );

  // 3. Wrap CTA blocks as styled buttons
  // The bold text + links are in a single paragraph (single newline = same paragraph in markdown)
  // Handles both 2-link (Star + Waitlist) and 3-link (Star + Docs + Comparisons) formats
  html = html.replace(
    /<p><strong>([^<]+)<\/strong>\n?((?:<a href="[^"]+?">[^<]+?<\/a>(?:\s*\|\s*)?)+)<\/p>/g,
    (_, heading, links) => {
      const cleanLinks = links.replace(/\s*\|\s*/g, "");
      return `<div class="cta-block"><p class="cta-heading">${heading}</p><div class="cta-buttons">${cleanLinks}</div></div>`;
    }
  );

  // 4. Wrap FAQ section with semantic microdata
  html = wrapFaqSection(html);

  return html;
}

// ── FAQ post-processor ──────────────────────────────────────────────────────
// Finds the "Frequently Asked Questions" h2 and wraps each h3+content pair
// in Schema.org Question/Answer microdata. Operates on final HTML so all
// inline markdown (links, bold, code) is already rendered.

function wrapFaqSection(html: string): string {
  const faqHeadingRegex =
    /<h2>Frequently Asked Questions<\/h2>/;
  const faqMatch = faqHeadingRegex.exec(html);
  if (!faqMatch) return html;

  const faqStart = faqMatch.index;
  const beforeFaq = html.slice(0, faqStart);
  const faqAndAfter = html.slice(faqStart);

  // Split the FAQ section at each <h3> to get question/answer blocks.
  // We need to find each <h3>...</h3> followed by content until the next <h3> or end.
  const h3Pattern = /<h3>([\s\S]*?)<\/h3>/g;
  const h3Matches: { question: string; startIdx: number; endIdx: number }[] =
    [];
  let h3Match;
  while ((h3Match = h3Pattern.exec(faqAndAfter)) !== null) {
    h3Matches.push({
      question: h3Match[1],
      startIdx: h3Match.index,
      endIdx: h3Match.index + h3Match[0].length,
    });
  }

  if (h3Matches.length === 0) return html;

  // Build the FAQ section with semantic wrappers
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

  // Replace everything from the FAQ heading to the end with our wrapped version
  return beforeFaq + faqHtml;
}
