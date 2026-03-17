import { NextRequest, NextResponse } from "next/server";
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from "@/lib/constants";

/**
 * Parse the Accept-Language header and return the best matching locale.
 *
 * Example header: "zh-CN,zh;q=0.9,en;q=0.8,ja;q=0.7"
 * → returns "zh" (matches zh-CN prefix against supported "zh")
 */
function matchLocale(acceptLanguage: string): string {
  const entries = acceptLanguage
    .split(",")
    .map((part) => {
      const [lang, qPart] = part.trim().split(";");
      const q = qPart ? parseFloat(qPart.replace("q=", "")) : 1;
      return { lang: lang.trim().toLowerCase(), q: Number.isFinite(q) ? q : 0 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { lang } of entries) {
    // Exact match (e.g. "zh-tw" → "zh-TW")
    const exactMatch = SUPPORTED_LOCALES.find(
      (loc) => loc.toLowerCase() === lang,
    );
    if (exactMatch) return exactMatch;

    // Prefix match (e.g. "zh-cn" → "zh", "en-us" → "en")
    const prefix = lang.split("-")[0];
    const prefixMatch = SUPPORTED_LOCALES.find(
      (loc) => loc.toLowerCase() === prefix,
    );
    if (prefixMatch) return prefixMatch;
  }

  return DEFAULT_LOCALE;
}

export default function proxy(request: NextRequest) {
  // Skip static assets, API routes, and Next.js internals
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/og") ||
    pathname.includes(".") // static files (favicon.ico, logo.png, etc.)
  ) {
    return NextResponse.next();
  }

  // ── 1. Explicit ?lang= override (used by hreflang URLs for SEO crawlers) ──
  const langParam = request.nextUrl.searchParams.get("lang");
  if (langParam && SUPPORTED_LOCALES.includes(langParam)) {
    // Set on the REQUEST so downstream server components see it via cookies()
    request.cookies.set("locale", langParam);
    const response = NextResponse.next();
    // Persist on the RESPONSE so the browser remembers it
    response.cookies.set("locale", langParam, {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });
    return response;
  }

  // ── 2. Cookie already set and valid — pass through ─────────────────────────
  const existingLocale = request.cookies.get("locale")?.value;
  if (existingLocale && SUPPORTED_LOCALES.includes(existingLocale)) {
    return NextResponse.next();
  }

  // ── 3. First visit — detect from Accept-Language header ────────────────────
  const acceptLanguage = request.headers.get("accept-language") || "";
  const detectedLocale = matchLocale(acceptLanguage);

  // Set on REQUEST (visible to layout.tsx cookies() in the same request cycle)
  request.cookies.set("locale", detectedLocale);
  const response = NextResponse.next();
  // Persist on RESPONSE (browser saves it for future visits)
  response.cookies.set("locale", detectedLocale, {
    path: "/",
    maxAge: 31536000, // 1 year
    sameSite: "lax",
  });

  return response;
}

export const config = {
  matcher: [
    // Match all pages except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.).*)",
  ],
};
