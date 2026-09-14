/**
 * Manual mirror re-sync: re-fetch sources that have a fetchable origin and
 * update sources.json. Runs only when invoked - no schedule, no CI hook.
 *
 *   node docs-platform/engine/sync-sources.ts          (npm run docs:sync)
 *
 * Fetchable today means a github.com/.../blob/... URL, rewritten to its
 * raw.githubusercontent.com equivalent. Everything else - Google Docs,
 * rendered sites, mirrors with no URL - prints "manual" with the origin to
 * copy from. A successful fetch bumps synced_at whether or not the bytes
 * changed: it is a freshness claim, not a diff claim. Re-run
 * `npm run docs:drift` afterwards so findings reflect the new snapshots.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..", "..");
const SOURCES_JSON = resolve(ROOT, "docs-platform/sources/sources.json");

interface SourceEntry {
  ref: string;
  origin: string;
  origin_path?: string;
  url?: string;
  synced_at: string;
  ttl_days: number;
}

/** github.com/<org>/<repo>/blob/<branch>/<path> -> raw.githubusercontent URL. */
function rawUrl(url: string): string | null {
  const m = url.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/
  );
  if (!m) return null;
  const [, org, repo, branch, path] = m;
  return `https://raw.githubusercontent.com/${org}/${repo}/${branch}/${path}`;
}

async function main() {
  const doc = JSON.parse(readFileSync(SOURCES_JSON, "utf8")) as {
    $comment?: string;
    sources: SourceEntry[];
  };
  const today = new Date().toISOString().slice(0, 10);
  let changed = false;

  for (const src of doc.sources) {
    const remote = src.url ? rawUrl(src.url) : null;
    if (!remote) {
      console.log(`manual    ${src.ref}`);
      console.log(
        `          origin: ${src.origin}${src.url ? ` - ${src.url}` : ""}`
      );
      continue;
    }
    let body: string;
    try {
      const res = await fetch(remote);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      body = await res.text();
    } catch (err) {
      console.log(`failed    ${src.ref} - ${(err as Error).message}`);
      continue;
    }
    const local = resolve(ROOT, src.ref);
    const current = readFileSync(local, "utf8");
    if (current === body) {
      console.log(`current   ${src.ref} (verified ${today})`);
    } else {
      writeFileSync(local, body);
      console.log(`updated   ${src.ref} (was synced ${src.synced_at})`);
      changed = true;
    }
    src.synced_at = today;
  }

  writeFileSync(SOURCES_JSON, JSON.stringify(doc, null, 2) + "\n");
  console.log(
    changed
      ? "\nwrote updates. Run `npm run docs:drift` to re-evaluate findings."
      : "\nsynced_at bumped for fetched sources. `npm run docs:drift` if you want fresh findings."
  );
}

main();
