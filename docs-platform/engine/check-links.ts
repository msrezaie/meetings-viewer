/**
 * Internal link and anchor checker for the docs platform. Walks every .mdx
 * file under content/docs recursively - no fumadocs runtime needed - so it can
 * run in CI before or after a build. A link either resolves against a real
 * page and heading or it doesn't, so this gate blocks from day one.
 *
 * Checked:
 *   - markdown links [text](href) and JSX href="..." pointing at /docs/...
 *   - #anchor fragments against the target page's heading slugs
 *   - site-internal links outside /docs against the known app routes
 *
 * Exit 1 on any broken link. Usage:
 *   node docs-platform/engine/check-links.ts
 */

import { readFileSync, readdirSync } from "node:fs";
import { resolve, relative } from "node:path";
import { DOC_LINKS } from "../links.ts";

const ROOT = resolve(import.meta.dirname, "..", "..");
const DOCS_DIR = resolve(ROOT, "content/docs");

// Routes this app serves outside /docs. /scrapers/<slug> is dynamic - any
// slug under it resolves to a real page.
const APP_ROUTES = [
  /^\/$/,
  /^\/scrapers(\/.*)?$/,
  /^\/keystatic(\/.*)?$/,
  /^\/llms(-full)?\.txt$/,
];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith(".mdx")) out.push(full);
  }
  return out;
}

/** content/docs/qa/schema.mdx -> /docs/qa/schema ; content/docs/index.mdx -> /docs */
function pageUrl(file: string): string {
  const rel = relative(DOCS_DIR, file)
    .replace(/\\/g, "/")
    .replace(/\.mdx$/, "");
  if (rel === "index") return "/docs";
  return `/docs/${rel.endsWith("/index") ? rel.slice(0, -"/index".length) : rel}`;
}

/** github-slugger-compatible heading slug (what fumadocs TOC/anchors use). */
function slugify(heading: string): string {
  return heading
    .trim()
    .toLowerCase()
    .replace(/`/g, "")
    .replace(/[^\p{L}\p{N} _-]/gu, "")
    .replace(/\s+/g, "-");
}

function headings(file: string): Set<string> {
  const text = readFileSync(file, "utf8");
  const slugs = new Set<string>();
  for (const m of text.matchAll(/^#{1,6}\s+(.+?)\s*$/gm)) {
    slugs.add(slugify(m[1].replace(/\{#[^}]+\}\s*$/, "").trim()));
    const custom = m[1].match(/\{#([^}]+)\}\s*$/);
    if (custom) slugs.add(custom[1]);
  }
  // <LinkIndex /> renders one anchor per registry category - same slugify
  // rule as components/docs/link-index.tsx's categoryAnchor.
  if (pageUrl(file) === "/docs/reference/links") {
    for (const group of DOC_LINKS) slugs.add(slugify(group.category));
  }
  return slugs;
}

/** Extract link targets from markdown links and JSX href attributes. */
function linksIn(file: string): { raw: string; line: number }[] {
  const text = readFileSync(file, "utf8");
  const out: { raw: string; line: number }[] = [];
  const patterns = [
    /\[[^\]]*\]\(([^)\s]+)\)/g, // [text](href)
    /href=["']([^"']+)["']/g, // href="..."
  ];
  for (const re of patterns) {
    for (const m of text.matchAll(re)) {
      const line = text.slice(0, m.index).split("\n").length;
      out.push({ raw: m[1], line });
    }
  }
  return out;
}

const files = walk(DOCS_DIR);
const urlToFile = new Map<string, string>();
for (const f of files) urlToFile.set(pageUrl(f), f);

const anchorCache = new Map<string, Set<string>>();
const anchorsFor = (file: string) => {
  if (!anchorCache.has(file)) anchorCache.set(file, headings(file));
  return anchorCache.get(file)!;
};

const problems: string[] = [];

for (const file of files) {
  const self = pageUrl(file);
  for (const { raw, line } of linksIn(file)) {
    if (/^(https?:|mailto:|#?\s*$)/.test(raw)) {
      if (!raw.startsWith("#")) continue; // external: lychee's job
    }
    const [path, fragment] = raw.startsWith("#")
      ? [self, raw.slice(1)]
      : raw.split("#");

    if (path === "") {
      // bare #fragment against this page - handled above via self
    } else if (path.startsWith("/docs")) {
      const target = path === "/docs/" ? "/docs" : path.replace(/\/$/, "");
      if (!urlToFile.has(target)) {
        problems.push(
          `${relative(ROOT, file)}:${line} -> ${raw} (no page for ${target})`
        );
        continue;
      }
      if (fragment) {
        const anchors = anchorsFor(urlToFile.get(target)!);
        if (!anchors.has(fragment)) {
          problems.push(
            `${relative(ROOT, file)}:${line} -> ${raw} (no anchor #${fragment} on ${target}; have: ${[...anchors].join(", ")})`
          );
        }
      }
      continue;
    } else if (path.startsWith("/")) {
      if (!APP_ROUTES.some((re) => re.test(path))) {
        problems.push(
          `${relative(ROOT, file)}:${line} -> ${raw} (not a known app route)`
        );
      }
      continue;
    } else {
      // relative link like ./foo or ../qa - resolve against this page's dir
      const target = new URL(raw, `http://x${self}/`).pathname;
      const normalized =
        target === "/docs/" ? "/docs" : target.replace(/\/$/, "");
      if (!urlToFile.has(normalized)) {
        problems.push(
          `${relative(ROOT, file)}:${line} -> ${raw} (resolves to ${normalized}, no such page)`
        );
      }
      continue;
    }

    // self-page anchor
    if (fragment) {
      const anchors = anchorsFor(file);
      if (!anchors.has(fragment)) {
        problems.push(
          `${relative(ROOT, file)}:${line} -> ${raw} (no anchor #${fragment} on this page)`
        );
      }
    }
  }
}

if (problems.length) {
  console.error(`docs link check: ${problems.length} broken link(s)`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log(
  `docs link check: ${files.length} pages, all internal links resolve`
);
