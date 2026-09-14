/**
 * Source extractors: read a source file and return what it asserts.
 *
 * Every extractor returns a normalized result the comparator can diff:
 *   - vocabulary claims  -> { names?: string[], values?: string[], tokens: string[] }
 *   - proposition claims -> { choice: string }
 *   - repo-fact claims   -> { exists: boolean }
 *
 * An extractor must never invent data: if the pattern does not match, the
 * result is null and the claim reports "source unreadable" instead of a diff.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ExtractSpec } from "./types.ts";

const ROOT = resolve(import.meta.dirname, "..", "..");

export function readSource(ref: string): string | null {
  const p = resolve(ROOT, ref);
  return existsSync(p) ? readFileSync(p, "utf8") : null;
}

/** Words that glue vocabulary lists together; never part of the vocabulary. */
const STOPWORDS = new Set([
  "e.g",
  "eg",
  "etc",
  "i.e",
  "or",
  "and",
  "one",
  "of",
  "the",
  "a",
  "an",
  "is",
  "are",
  "use",
  "for",
  "as",
  "if",
  "be",
  "can",
  "based",
  "on",
  "predefined",
  "constants",
  "typically",
  "set",
  "by",
]);

/** Apply `pattern` to text and return capture group 1 (or the match). */
function capture(text: string, pattern: string): string | null {
  const m = text.match(new RegExp(pattern, "s"));
  return m ? (m[1] ?? m[0]) : null;
}

/**
 * Split a captured list region into tokens. Handles backticked tokens,
 * double/single-quoted tokens, and bare comma-separated words.
 * Markdown escapes (NOT\_CLASSIFIED) are unescaped.
 */
function tokenize(
  region: string,
  style: "backticked" | "quoted" | "upper-words" | "bare"
): string[] {
  // Markdown escapes (\_, \>) are noise for comparison purposes.
  const clean = region.replace(/\\(.)/g, "$1");
  let tokens: string[] = [];
  if (style === "backticked") {
    tokens = [...clean.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
  } else if (style === "quoted") {
    tokens = [...clean.matchAll(/["']([^"']+)["']/g)].map((m) => m[1]);
  } else if (style === "upper-words") {
    // Constant names embedded in prose: runs of 3+ uppercase/underscore chars.
    tokens = [...clean.matchAll(/[A-Z][A-Z_]{2,}/g)].map((m) => m[0]);
  } else {
    tokens = clean.split(/[,;\n>]|\bor\b|\band\b/);
  }
  return tokens
    .map((t) => t.replace(/[`'"().]/g, "").trim())
    .map((t) => t.replace(/^(e\.?g\.?|i\.?e\.?|etc\.?)\s*/i, "").trim())
    .filter((t) => t.length > 0 && !STOPWORDS.has(t.toLowerCase()));
}

/** Ordered list labels -> first significant word ("Minutes PDF" -> "minutes"). */
function labelize(tokens: string[]): string[] {
  return tokens
    .map((t) => {
      const w = t.toLowerCase().match(/[a-z]+/);
      return w ? w[0] : "";
    })
    .filter(Boolean);
}

export interface ExtractResult {
  /** Constant-name set (python-constants) or asserted token set. */
  names?: string[];
  /** Resolved value set (python-constants). */
  values?: string[];
  /** Raw asserted tokens, ordered if the source asserted an order. */
  tokens?: string[];
  choice?: string;
  exists?: boolean;
}

export function extract(spec: ExtractSpec, ref: string): ExtractResult | null {
  switch (spec.type) {
    case "file-exists":
      return { exists: existsSync(resolve(ROOT, ref)) };

    case "python-constants": {
      const text = readSource(ref);
      if (!text) return null;
      const constants = new Map<string, string>();
      for (const m of text.matchAll(/^([A-Z_]+)\s*=\s*"([^"]+)"/gm)) {
        constants.set(m[1], m[2]);
      }
      const tupleRe = new RegExp(`^${spec.tuple}\\s*=\\s*\\(([^)]*)\\)`, "m");
      const tm = text.match(tupleRe);
      if (!tm) return null;
      const names = tm[1]
        .split(",")
        .map((s) => s.trim())
        .filter((s) => /^[A-Z_]+$/.test(s));
      const values = names
        .map((n) => constants.get(n))
        .filter((v): v is string => v !== undefined);
      return { names, values };
    }

    case "token-list": {
      const text = readSource(ref);
      if (!text) return null;
      const region = capture(text, spec.pattern);
      if (!region) return null;
      const style = spec.style ?? "bare";
      const tokens = tokenize(region, style);
      return { tokens: spec.ordered ? labelize(tokens) : tokens };
    }

    case "regex-set": {
      const text = readSource(ref);
      if (!text) return null;
      const tokens = [...text.matchAll(new RegExp(spec.pattern, "g"))].map(
        (m) => m[1] ?? m[0]
      );
      return tokens.length ? { tokens } : null;
    }

    case "json-field": {
      const text = readSource(ref);
      if (!text) return null;
      let doc: unknown;
      try {
        doc = JSON.parse(text);
      } catch {
        return null;
      }
      const found = new Set<string>();
      const walk = (node: unknown): void => {
        if (Array.isArray(node)) return node.forEach(walk);
        if (node && typeof node === "object") {
          for (const [k, v] of Object.entries(node)) {
            if (k === spec.field && typeof v === "string") found.add(v);
            else walk(v);
          }
        }
      };
      walk(doc);
      return { tokens: [...found] };
    }

    case "path-listing": {
      const text = readSource(ref);
      if (!text) return null;
      const region = capture(text, spec.pattern);
      if (!region) return null;
      // Reconstruct repo-relative paths from indentation: a line nested
      // under `app/` asserts `app/<name>`, and so on.
      const stack: { indent: number; seg: string }[] = [];
      const paths: string[] = [];
      for (const line of region.split("\n")) {
        const m = line.match(/^(\s*)(\S+)/);
        if (!m) continue;
        const indent = m[1].length;
        const seg = m[2].replace(/\/+$/, "");
        while (stack.length && stack[stack.length - 1].indent >= indent)
          stack.pop();
        paths.push([...stack.map((s) => s.seg), seg].join("/"));
        stack.push({ indent, seg });
      }
      return paths.length ? { tokens: paths } : null;
    }

    case "keyword-choice": {
      const text = readSource(ref);
      if (!text) return null;
      const region = capture(text, spec.pattern) ?? text;
      for (const opt of spec.options) {
        if (new RegExp(`\\b${opt}\\b`, "i").test(region))
          return { choice: opt };
      }
      return null;
    }

    case "datetime-tz": {
      const text = readSource(ref);
      if (!text) return null;
      const region = capture(text, spec.pattern);
      if (!region) return null;
      // tz-aware if the timestamp carries an offset or Z suffix.
      const aware =
        /([+-]\d{2}:?\d{2}|Z)\s*["'`]?$/m.test(region) ||
        /T\d{2}:\d{2}:\d{2}([+-]\d{2}|Z)/.test(region);
      return { choice: aware ? "aware" : "naive" };
    }
  }
}
