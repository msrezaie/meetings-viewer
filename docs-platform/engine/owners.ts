/**
 * Minimal CODEOWNERS resolution: read .github/CODEOWNERS, match a repo path
 * to its owner. GitHub semantics: gitignore-style patterns, last match wins.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..", "..");

interface Rule {
  pattern: string;
  owner: string;
  regex: RegExp;
}

function patternToRegex(pattern: string): RegExp {
  // Normalize: strip leading slash, treat trailing /** as "everything under".
  const p = pattern.replace(/^\//, "");
  let re = "";
  for (let i = 0; i < p.length; i++) {
    const c = p[i];
    if (c === "*") {
      if (p[i + 1] === "*") {
        re += ".*";
        i++;
      } else {
        re += "[^/]*";
      }
    } else if ("\\^$.|?+()[]{}".includes(c)) {
      re += "\\" + c;
    } else {
      re += c;
    }
  }
  // A bare directory or non-glob path also matches everything beneath it.
  if (!/[*]$/.test(p)) re += "(?:/.*)?";
  return new RegExp(`^${re}$`);
}

let rules: Rule[] | null = null;

function load(): Rule[] {
  if (rules) return rules;
  rules = [];
  for (const loc of [".github/CODEOWNERS", "CODEOWNERS", "docs/CODEOWNERS"]) {
    const p = resolve(ROOT, loc);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const [pattern, ...owners] = t.split(/\s+/);
      if (!pattern || owners.length === 0) continue;
      rules.push({ pattern, owner: owners[0], regex: patternToRegex(pattern) });
    }
    break;
  }
  return rules;
}

/** Resolve the owner of a repo-relative path. Returns "unowned" if no match. */
export function ownerOf(path: string): string {
  const matched = load().filter((r) => r.regex.test(path));
  return matched.length > 0 ? matched[matched.length - 1].owner : "unowned";
}
