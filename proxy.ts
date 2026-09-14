import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Fumadocs markdown content negotiation: a docs page requested with a .md
// suffix is rewritten to the markdown route handler, so every page answers
// both /docs/<page> (HTML) and /docs/<page>.md (Markdown).
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/docs/") && pathname.endsWith(".md")) {
    const slug = pathname.slice("/docs/".length, -".md".length);
    return NextResponse.rewrite(new URL(`/api/docs-md/${slug}`, request.url));
  }
  return NextResponse.next();
}
