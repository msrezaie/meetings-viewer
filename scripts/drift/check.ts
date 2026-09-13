/**
 * Drift check: compare every claim's restatements against its master source.
 *
 *   node scripts/drift/check.ts           report mode (always exits 0)
 *   node scripts/drift/check.ts --fail    exits 1 if any blocking finding
 *
 * Outputs: console table, drift/findings.json (agent-readable),
 * drift/report.md (PR-comment-ready, grouped by owner).
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { claims } from "../../drift/claims.ts";
import { extract } from "./extract.ts";
import { ownerOf } from "./owners.ts";
import type { Claim, Confidence, Finding, SourceSpec } from "./types.ts";

const ROOT = resolve(import.meta.dirname, "..", "..");
const FAIL = process.argv.includes("--fail");

const normValue = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

function confidenceFor(master: SourceSpec): Confidence {
  return master.class === "executable" || master.class === "structured"
    ? "certain"
    : "likely";
}

function unreadable(claim: Claim, src: SourceSpec): Finding {
  return {
    id: `${claim.id}::${src.ref}`,
    claim: claim.id,
    subject: claim.subject,
    confidence: "prompt",
    blocking: false,
    owner: ownerOf(src.ref),
    master: { ref: claim.master.ref, value: null },
    evidence: [
      {
        ref: src.ref,
        page: src.page,
        value: null,
        note: "extractor pattern did not match - the source moved or was reworded",
      },
    ],
  };
}

function checkVocabulary(claim: Extract<Claim, { kind: "vocabulary" }>): {
  findings: Finding[];
  statuses: Map<string, string>;
} {
  const findings: Finding[] = [];
  const statuses = new Map<string, string>();
  const mres = extract(claim.master.extract, claim.master.ref);
  if (!mres) {
    findings.push(unreadable(claim, claim.master));
    return { findings, statuses };
  }

  const ordered =
    claim.master.extract.type === "token-list" && claim.master.extract.ordered;
  const masterNames = mres.names ?? [];
  const masterValues = mres.values ?? mres.tokens ?? [];
  const masterDisplay = masterValues.length ? masterValues : masterNames;
  statuses.set(claim.master.ref, "master");

  for (const src of claim.assertedBy) {
    const res = extract(src.extract, src.ref);
    if (!res || !res.tokens) {
      findings.push(unreadable(claim, src));
      statuses.set(src.ref, "unreadable");
      continue;
    }

    if (ordered) {
      const expected = masterValues.map(normValue);
      const actual = res.tokens.map(normValue);
      if (expected.join("|") !== actual.join("|")) {
        findings.push({
          id: `${claim.id}::${src.ref}`,
          claim: claim.id,
          subject: claim.subject,
          confidence: confidenceFor(claim.master),
          blocking: confidenceFor(claim.master) === "certain",
          owner: ownerOf(src.ref),
          master: { ref: claim.master.ref, value: masterValues },
          evidence: [
            {
              ref: src.ref,
              page: src.page,
              value: res.tokens,
              note: `order differs: expected [${expected.join(", ")}], found [${actual.join(", ")}]`,
            },
          ],
        });
        statuses.set(src.ref, "conflicts");
      } else {
        statuses.set(src.ref, "agrees");
      }
      continue;
    }

    const expected =
      src.form === "names" ? masterNames : masterValues.map(normValue);
    const actual =
      src.form === "names" ? res.tokens : res.tokens.map(normValue);
    const expectedSet = new Set(expected);
    const actualSet = new Set(actual);
    const missing = expected.filter((t) => !actualSet.has(t));
    const extra = actual.filter((t) => !expectedSet.has(t));

    const conflicts =
      extra.length > 0 || (src.exhaustive && missing.length > 0);
    if (conflicts) {
      findings.push({
        id: `${claim.id}::${src.ref}`,
        claim: claim.id,
        subject: claim.subject,
        confidence: confidenceFor(claim.master),
        blocking: confidenceFor(claim.master) === "certain",
        owner: ownerOf(src.ref),
        master: { ref: claim.master.ref, value: masterDisplay },
        evidence: [
          {
            ref: src.ref,
            page: src.page,
            value: res.tokens,
            missing: src.exhaustive ? missing : undefined,
            extra: extra.length ? extra : undefined,
          },
        ],
      });
      statuses.set(src.ref, "conflicts");
    } else {
      statuses.set(src.ref, "agrees");
    }
  }
  return { findings, statuses };
}

function checkProposition(claim: Extract<Claim, { kind: "proposition" }>): {
  findings: Finding[];
  statuses: Map<string, string>;
} {
  const findings: Finding[] = [];
  const statuses = new Map<string, string>();
  const mres = extract(claim.master.extract, claim.master.ref);
  if (!mres || mres.choice === undefined) {
    findings.push(unreadable(claim, claim.master));
    return { findings, statuses };
  }
  statuses.set(claim.master.ref, "master");

  for (const src of claim.assertedBy) {
    const res = extract(src.extract, src.ref);
    if (!res || res.choice === undefined) {
      findings.push(unreadable(claim, src));
      statuses.set(src.ref, "unreadable");
      continue;
    }
    if (res.choice !== mres.choice) {
      findings.push({
        id: `${claim.id}::${src.ref}`,
        claim: claim.id,
        subject: claim.subject,
        confidence: confidenceFor(claim.master),
        blocking: confidenceFor(claim.master) === "certain",
        owner: ownerOf(src.ref),
        master: { ref: claim.master.ref, value: mres.choice },
        evidence: [{ ref: src.ref, page: src.page, value: res.choice }],
      });
      statuses.set(src.ref, "conflicts");
    } else {
      statuses.set(src.ref, "agrees");
    }
  }
  return { findings, statuses };
}

function checkRepoFact(claim: Extract<Claim, { kind: "repo-fact" }>): {
  findings: Finding[];
  statuses: Map<string, string>;
} {
  const statuses = new Map<string, string>();
  const res = extract(claim.master.extract, claim.master.ref);
  if (res?.exists) {
    statuses.set(claim.page.ref, "agrees");
    return { findings: [], statuses };
  }
  statuses.set(claim.page.ref, "conflicts");
  return {
    findings: [
      {
        id: `${claim.id}::${claim.page.ref}`,
        claim: claim.id,
        subject: claim.subject,
        confidence: "certain",
        blocking: true,
        owner: ownerOf(claim.page.ref),
        master: { ref: claim.master.ref, value: false },
        evidence: [
          {
            ref: claim.page.ref,
            page: claim.page.page,
            value: claim.assertion,
          },
        ],
      },
    ],
    statuses,
  };
}

/** Mirrors past their TTL produce prompt findings - never block. */
function checkMirrorFreshness(): Finding[] {
  const p = resolve(ROOT, "drift/sources.json");
  try {
    const { sources } = JSON.parse(readFileSync(p, "utf8")) as {
      sources: { ref: string; synced_at: string; ttl_days: number }[];
    };
    const now = Date.now();
    return sources
      .filter(
        (s) => now > new Date(s.synced_at).getTime() + s.ttl_days * 86_400_000
      )
      .map((s) => ({
        id: `stale-mirror::${s.ref}`,
        claim: "stale-mirror",
        subject: `mirrored source freshness: ${s.ref}`,
        confidence: "prompt" as const,
        blocking: false,
        owner: ownerOf(s.ref),
        master: { ref: s.ref, value: null },
        evidence: [
          {
            ref: s.ref,
            value: null,
            note: `snapshot from ${s.synced_at} is older than ${s.ttl_days} days - re-sync from origin`,
          },
        ],
      }));
  } catch {
    return [];
  }
}

// ---- run ----------------------------------------------------------------

const findings: Finding[] = [];
const overlap: {
  subject: string;
  claim: string;
  restated: { ref: string; page?: string; status: string }[];
}[] = [];

for (const claim of claims) {
  const { findings: f, statuses } =
    claim.kind === "vocabulary"
      ? checkVocabulary(claim)
      : claim.kind === "proposition"
        ? checkProposition(claim)
        : checkRepoFact(claim);
  findings.push(...f);
  const restated = [...statuses.entries()].map(([ref, status]) => {
    const spec =
      claim.master.ref === ref
        ? claim.master
        : claim.kind === "repo-fact"
          ? claim.page
          : claim.assertedBy.find((s) => s.ref === ref);
    return { ref, page: spec?.page, status };
  });
  overlap.push({ subject: claim.subject, claim: claim.id, restated });
}
findings.push(...checkMirrorFreshness());

// ---- report -------------------------------------------------------------

const label = (f: Finding) =>
  f.confidence === "certain"
    ? "CONFLICT"
    : f.confidence === "likely"
      ? "LIKELY "
      : "PROMPT ";

console.log(`\nDRIFT CHECK - ${claims.length} claims checked\n`);
for (const f of findings) {
  const e = f.evidence[0];
  console.log(`[${label(f)}] ${f.subject}`);
  console.log(`  master:  ${f.master.ref}`);
  if (f.master.value != null)
    console.log(`           ${JSON.stringify(f.master.value)}`);
  console.log(`  source:  ${e.ref}${e.page ? ` (${e.page})` : ""}`);
  if (e.value != null) console.log(`           ${JSON.stringify(e.value)}`);
  if (e.missing?.length)
    console.log(`           missing: ${e.missing.join(", ")}`);
  if (e.extra?.length) console.log(`           extra:   ${e.extra.join(", ")}`);
  if (e.note) console.log(`           ${e.note}`);
  console.log(
    `  owner:   ${f.owner}  |  blocking: ${f.blocking ? "yes" : "no"}`
  );
  console.log();
}

console.log("OVERLAP MAP - where each subject is restated\n");
for (const o of overlap) {
  const n = o.restated.filter((r) => r.status === "conflicts").length;
  console.log(`  ${o.subject}`);
  console.log(`    restated in ${o.restated.length} sources, ${n} disagree`);
  for (const r of o.restated) {
    console.log(
      `    ${r.status.padEnd(10)} ${r.ref}${r.page ? ` (${r.page})` : ""}`
    );
  }
}
console.log();

const outDir = resolve(ROOT, "drift");
writeFileSync(
  resolve(outDir, "findings.json"),
  JSON.stringify(
    { generated_at: new Date().toISOString(), findings, overlap },
    null,
    2
  )
);

const byOwner = new Map<string, Finding[]>();
for (const f of findings) {
  byOwner.set(f.owner, [...(byOwner.get(f.owner) ?? []), f]);
}
let md = `# Docs drift report\n\n${findings.length} finding(s) across ${claims.length} claims.\n\n`;
for (const [owner, fs] of byOwner) {
  md += `## ${owner}\n\n`;
  for (const f of fs) {
    md += `- **${f.subject}** (${f.confidence}${f.blocking ? ", blocking" : ""})\n`;
    md += `  - master: \`${f.master.ref}\` = ${JSON.stringify(f.master.value)}\n`;
    for (const e of f.evidence) {
      md += `  - source: \`${e.ref}\`${e.page ? ` (${e.page})` : ""} = ${JSON.stringify(e.value)}\n`;
      if (e.missing?.length) md += `    - missing: ${e.missing.join(", ")}\n`;
      if (e.extra?.length) md += `    - extra: ${e.extra.join(", ")}\n`;
      if (e.note) md += `    - ${e.note}\n`;
    }
  }
  md += "\n";
}
writeFileSync(resolve(outDir, "report.md"), md);
console.log(`wrote drift/findings.json and drift/report.md`);

if (FAIL && findings.some((f) => f.blocking)) process.exit(1);
