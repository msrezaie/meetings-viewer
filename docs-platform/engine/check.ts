/**
 * Drift check: compare every claim's restatements against its master source.
 *
 *   node docs-platform/engine/check.ts           report mode (always exits 0)
 *   node docs-platform/engine/check.ts --fail    exits 1 if any blocking finding
 *
 * Outputs: console table, docs-platform/drift/findings.json (agent-readable),
 * docs-platform/drift/report.md (PR-comment-ready, grouped by owner).
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { claims } from "../drift/claims.ts";
import {
  applyMutes,
  checkMirrorFreshness,
  evaluateClaims,
  ROOT,
} from "./evaluate.ts";
import type { Finding } from "./types.ts";

const FAIL = process.argv.includes("--fail");

const { findings, overlap } = evaluateClaims(claims);
findings.push(...checkMirrorFreshness());
const muted = applyMutes(findings);
const active = findings.filter((f) => !f.muted);
const mutedFindings = findings.filter((f) => f.muted);

// ---- report -------------------------------------------------------------

const label = (f: Finding) =>
  f.confidence === "certain"
    ? "CONFLICT"
    : f.confidence === "likely"
      ? "LIKELY "
      : "PROMPT ";

console.log(`\nDRIFT CHECK - ${claims.length} claims checked\n`);
for (const f of active) {
  const e = f.evidence[0];
  console.log(`[${label(f)}] ${f.subject}  [${f.fingerprint}]`);
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
  console.log(`  action:  ${f.action}`);
  console.log();
}
if (mutedFindings.length) {
  console.log(`MUTED - accepted disagreements\n`);
  for (const f of mutedFindings) {
    const m = muted.get(f.fingerprint);
    console.log(
      `  [${f.fingerprint}] ${f.subject} in ${f.evidence[0].ref} - ${m?.reason}`
    );
  }
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

const outDir = resolve(ROOT, "docs-platform", "drift");
writeFileSync(
  resolve(outDir, "findings.json"),
  JSON.stringify(
    { generated_at: new Date().toISOString(), findings, overlap },
    null,
    2
  )
);

const byOwner = new Map<string, Finding[]>();
for (const f of active) {
  byOwner.set(f.owner, [...(byOwner.get(f.owner) ?? []), f]);
}
let md = `# Docs drift report\n\n${active.length} finding(s) across ${claims.length} claims`;
if (mutedFindings.length) md += ` (${mutedFindings.length} muted)`;
md += `.\n\nStanding view: [/docs/conflicts](/docs/conflicts). Machine-readable: [docs-platform/drift/findings.json](findings.json).\n\n`;
for (const [owner, fs] of byOwner) {
  md += `## ${owner}\n\n`;
  for (const f of fs) {
    md += `- **${f.subject}** (${f.confidence}${f.blocking ? ", blocking" : ""}) \`[${f.fingerprint}]\`\n`;
    md += `  - master: \`${f.master.ref}\` = ${JSON.stringify(f.master.value)}\n`;
    for (const e of f.evidence) {
      md += `  - source: \`${e.ref}\`${e.page ? ` (${e.page})` : ""} = ${JSON.stringify(e.value)}\n`;
      if (e.missing?.length) md += `    - missing: ${e.missing.join(", ")}\n`;
      if (e.extra?.length) md += `    - extra: ${e.extra.join(", ")}\n`;
      if (e.note) md += `    - ${e.note}\n`;
    }
    md += `  - action: ${f.action}\n`;
  }
  md += "\n";
}
if (mutedFindings.length) {
  md += `## Muted\n\n`;
  for (const f of mutedFindings) {
    const m = muted.get(f.fingerprint);
    md += `- \`[${f.fingerprint}]\` **${f.subject}** in \`${f.evidence[0].ref}\` - ${m?.reason}\n`;
  }
  md += "\n";
}
md += `---\nTo accept a finding as known-correct, add its fingerprint to \`docs-platform/drift/mutes.json\` with a reason. Mutes expire automatically when the disagreeing values change.\n`;
writeFileSync(resolve(outDir, "report.md"), md);
console.log(
  `wrote docs-platform/drift/findings.json and docs-platform/drift/report.md`
);

if (FAIL && active.some((f) => f.blocking)) process.exit(1);
