#!/usr/bin/env node
/**
 * IndexNow submitter — pings participating search engines (Bing, Yandex,
 * Seznam, Naver, Yep, …) that our URLs changed so they recrawl sooner than a
 * passive sitemap poll would trigger.
 *
 * Ownership is proven by a key file hosted at the site root:
 *   public/<key>.txt   (contents === <key>)
 * The IndexNow endpoint fetches https://www.openlegion.ai/<key>.txt and checks
 * it matches the `key` in the POST body. This script discovers that file
 * automatically, so the key lives in exactly one place (the filename).
 *
 * URL set mirrors src/app/sitemap.ts:
 *   - nav pages  × every SUPPORTED_LOCALES entry
 *   - content    × each page's availableLocales (from public/content-manifest.json)
 *   - llms.txt + llms-full.txt
 * Building from the committed manifest (not the live sitemap) avoids racing the
 * Vercel deploy: we submit exactly what this commit ships.
 *
 * Usage:
 *   node scripts/indexnow-submit.mjs                 # submit the full site
 *   node scripts/indexnow-submit.mjs <url> [url...]  # submit specific URLs
 *   node scripts/indexnow-submit.mjs --dry-run       # print, don't POST
 */
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, "public");
const MANIFEST = path.join(PUBLIC_DIR, "content-manifest.json");
const BASE = "https://www.openlegion.ai";
const HOST = "www.openlegion.ai";
const ENDPOINT = "https://api.indexnow.org/indexnow";
const BATCH_SIZE = 10000; // IndexNow hard limit per request

// Mirror of SUPPORTED_LOCALES from src/lib/constants.ts. Keep in sync.
const SUPPORTED_LOCALES = [
  "en", "zh", "zh-TW", "ja", "ko", "es", "fr", "de", "pt", "ar", "hi", "ru", "th",
];

// Mirror of the nav-driven paths in src/app/sitemap.ts ("/" === home).
const NAV_PATHS = [
  "/", "/pricing", "/faq", "/learn", "/money-back-guarantee", "/terms", "/privacy",
];

/** Locate the key file in public/: an 8–128 hex-char name whose body matches. */
function discoverKey() {
  if (process.env.INDEXNOW_KEY) return process.env.INDEXNOW_KEY.trim();
  const candidates = fs
    .readdirSync(PUBLIC_DIR)
    .filter((f) => /^[a-f0-9]{8,128}\.txt$/i.test(f));
  for (const file of candidates) {
    const key = path.basename(file, ".txt");
    const body = fs.readFileSync(path.join(PUBLIC_DIR, file), "utf8").trim();
    if (body === key) return key;
  }
  throw new Error(
    "No IndexNow key file found in public/ (expected <key>.txt whose contents equal <key>), and INDEXNOW_KEY is unset.",
  );
}

/** Full site URL set, mirroring sitemap.ts. */
function buildSiteUrls() {
  const urls = new Set();

  for (const navPath of NAV_PATHS) {
    for (const locale of SUPPORTED_LOCALES) {
      urls.add(navPath === "/" ? `${BASE}/${locale}` : `${BASE}/${locale}${navPath}`);
    }
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  for (const page of manifest.pages) {
    // availableLocales already includes "en" (the canonical).
    for (const locale of page.availableLocales) {
      urls.add(`${BASE}/${locale}${page.slug}`);
    }
  }

  urls.add(`${BASE}/llms.txt`);
  urls.add(`${BASE}/llms-full.txt`);

  return [...urls];
}

async function submitBatch(key, urlList) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: HOST,
      key,
      keyLocation: `${BASE}/${key}.txt`,
      urlList,
    }),
  });
  const text = await res.text();
  return { status: res.status, body: text.trim() };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const explicit = args.filter((a) => a.startsWith("http"));

  const key = discoverKey();
  const urls = explicit.length ? explicit : buildSiteUrls();

  console.log(`IndexNow: ${urls.length} URL(s), key ${key}`);
  if (dryRun) {
    for (const u of urls) console.log(`  ${u}`);
    console.log("--dry-run: nothing submitted.");
    return;
  }

  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);
    const { status, body } = await submitBatch(key, batch);
    // IndexNow returns 200 (accepted) or 202 (accepted, key validation pending).
    const ok = status === 200 || status === 202;
    console.log(`  batch ${i / BATCH_SIZE + 1}: HTTP ${status}${body ? ` — ${body}` : ""}`);
    if (!ok) {
      process.exitCode = 1;
      console.error(`  submission failed (HTTP ${status}).`);
    }
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
