/**
 * Drift evaluation: run a set of claims and produce findings + the overlap
 * map. Pure with respect to the CLI - check.ts owns printing and file writes,
 * check.test.ts drives this with a fixture corpus.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { extract } from "./extract.ts";
import { ownerOf } from "./owners.ts";
import type { Claim, Confidence, Finding, Mute, SourceSpec } from "./types.ts";

export const ROOT = resolve(import.meta.dirname, "..", "..");

/**
 * Whether `certain` findings block a merge. Promoted per playbook section
 * 2.5 after the advisory window: a `certain` finding now fails `check.ts
 * --fail`, and docs-drift.yml turns that into a failing PR check.
 */
export const BLOCKING_GATE_ENABLED = true;

const normValue = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

function confidenceFor(master: SourceSpec): Confidence {
  return master.class === "executable" || master.class === "structured"
    ? "certain"
    : "likely";
}

function fingerprint(f: Omit<Finding, "fingerprint">): string {
  const payload = [
    f.claim,
    ...f.evidence.map((e) =>
      [e.ref, JSON.stringify(e.value), e.note ?? ""].join("|")
    ),
    JSON.stringify(f.master.value),
  ].join("\n");
  return createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

/** The next step an agent or maintainer should take for this finding. */
function actionFor(claim: Claim, src: SourceSpec): string {
  if (claim.kind === "repo-fact")
    return `Fix ${src.page ?? src.ref}: the assertion is false against this repo.`;
  if (claim.kind === "repo-paths")
    return `Edit ${src.ref}: update the listing - the missing paths were renamed or removed (or restore them in the repo).`;
  if (src.page)
    return `Edit ${src.ref} so it agrees with ${claim.master?.ref}.`;
  if (src.ref.startsWith("docs-platform/sources/"))
    return `Do not edit the mirror. Check whether upstream ${claim.master?.ref} changed; if the mirror is stale, re-sync it and update sources.json.`;
  return `Review ${src.ref} against ${claim.master?.ref}.`;
}

/** Assemble a finding, attach owner/action/fingerprint, return it complete. */
function makeFinding(
  claim: Claim,
  src: SourceSpec,
  masterValue: Finding["master"]["value"],
  evidence: Finding["evidence"],
  confidence?: Confidence
): Finding {
  const conf =
    confidence ?? (claim.master ? confidenceFor(claim.master) : "certain");
  const f: Omit<Finding, "fingerprint"> = {
    id: `${claim.id}::${src.ref}`,
    claim: claim.id,
    subject: claim.subject,
    confidence: conf,
    // Promotion gate (playbook section 2.5): `certain` findings block once
    // BLOCKING_GATE_ENABLED is set - see docs-drift.yml for the CI half.
    blocking: conf === "certain" && BLOCKING_GATE_ENABLED,
    owner: ownerOf(src.ref),
    action: actionFor(claim, src),
    master: {
      ref: claim.master?.ref ?? "repo working tree",
      value: masterValue,
    },
    evidence,
  };
  return { ...f, fingerprint: fingerprint(f) };
}

function unreadable(claim: Claim, src: SourceSpec): Finding {
  const f: Omit<Finding, "fingerprint"> = {
    id: `${claim.id}::${src.ref}`,
    claim: claim.id,
    subject: claim.subject,
    confidence: "prompt",
    blocking: false,
    owner: ownerOf(src.ref),
    action: `Check the extractor pattern in docs-platform/drift/claims.ts against ${src.ref}.`,
    master: { ref: claim.master?.ref ?? "repo working tree", value: null },
    evidence: [
      {
        ref: src.ref,
        page: src.page,
        value: null,
        note: "extractor pattern did not match - the source moved or was reworded",
      },
    ],
  };
  return { ...f, fingerprint: fingerprint(f) };
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
        findings.push(
          makeFinding(claim, src, masterValues, [
            {
              ref: src.ref,
              page: src.page,
              value: res.tokens,
              note: `order differs: expected [${expected.join(", ")}], found [${actual.join(", ")}]`,
            },
          ])
        );
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
      findings.push(
        makeFinding(claim, src, masterDisplay, [
          {
            ref: src.ref,
            page: src.page,
            value: res.tokens,
            missing: src.exhaustive ? missing : undefined,
            extra: extra.length ? extra : undefined,
          },
        ])
      );
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
      findings.push(
        makeFinding(claim, src, mres.choice, [
          { ref: src.ref, page: src.page, value: res.choice },
        ])
      );
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
      makeFinding(
        claim,
        claim.page,
        false,
        [
          {
            ref: claim.page.ref,
            page: claim.page.page,
            value: claim.assertion,
          },
        ],
        "certain"
      ),
    ],
    statuses,
  };
}

/**
 * Repo-paths: a page lists repo paths (a project-structure block). The repo
 * working tree is the master; every listed path must exist. A missing path
 * means the doc outlived a rename or removal - verifiable, so "certain".
 */
function checkRepoPaths(claim: Extract<Claim, { kind: "repo-paths" }>): {
  findings: Finding[];
  statuses: Map<string, string>;
} {
  const findings: Finding[] = [];
  const statuses = new Map<string, string>();
  statuses.set("(repo working tree)", "master");

  for (const src of claim.assertedBy) {
    const res = extract(src.extract, src.ref);
    if (!res || !res.tokens) {
      findings.push(unreadable(claim, src));
      statuses.set(src.ref, "unreadable");
      continue;
    }
    const missing = res.tokens.filter((p) => !existsSync(resolve(ROOT, p)));
    if (missing.length) {
      findings.push(
        makeFinding(claim, src, null, [
          {
            ref: src.ref,
            page: src.page,
            value: res.tokens,
            missing,
            note: "listed paths that do not exist in the repo",
          },
        ])
      );
      statuses.set(src.ref, "conflicts");
    } else {
      statuses.set(src.ref, "agrees");
    }
  }
  return { findings, statuses };
}

/** Mirrors past their TTL produce prompt findings - never block. */
export function checkMirrorFreshness(): Finding[] {
  const p = resolve(ROOT, "docs-platform/sources/sources.json");
  try {
    const { sources } = JSON.parse(readFileSync(p, "utf8")) as {
      sources: { ref: string; synced_at: string; ttl_days: number }[];
    };
    const now = Date.now();
    return sources
      .filter(
        (s) => now > new Date(s.synced_at).getTime() + s.ttl_days * 86_400_000
      )
      .map((s) => {
        const f: Omit<Finding, "fingerprint"> = {
          id: `stale-mirror::${s.ref}`,
          claim: "stale-mirror",
          subject: `mirrored source freshness: ${s.ref}`,
          confidence: "prompt" as const,
          blocking: false,
          owner: ownerOf(s.ref),
          action: `Re-sync ${s.ref} from its upstream origin and bump synced_at in sources.json.`,
          master: { ref: s.ref, value: null },
          evidence: [
            {
              ref: s.ref,
              value: null,
              note: `snapshot from ${s.synced_at} is older than ${s.ttl_days} days - re-sync from origin`,
            },
          ],
        };
        return { ...f, fingerprint: fingerprint(f) };
      });
  } catch {
    return [];
  }
}

export interface Overlap {
  subject: string;
  claim: string;
  restated: { ref: string; page?: string; status: string }[];
}

export function evaluateClaims(claimList: Claim[]): {
  findings: Finding[];
  overlap: Overlap[];
} {
  const findings: Finding[] = [];
  const overlap: Overlap[] = [];

  for (const claim of claimList) {
    const { findings: f, statuses } =
      claim.kind === "vocabulary"
        ? checkVocabulary(claim)
        : claim.kind === "proposition"
          ? checkProposition(claim)
          : claim.kind === "repo-fact"
            ? checkRepoFact(claim)
            : checkRepoPaths(claim);
    findings.push(...f);
    const restated = [...statuses.entries()].map(([ref, status]) => {
      const spec =
        claim.master?.ref === ref
          ? claim.master
          : claim.kind === "repo-fact"
            ? claim.page
            : claim.assertedBy.find((s) => s.ref === ref);
      return { ref, page: spec?.page, status };
    });
    overlap.push({ subject: claim.subject, claim: claim.id, restated });
  }
  return { findings, overlap };
}

/**
 * Apply docs-platform/drift/mutes.json to findings. A mute keys on the
 * finding's fingerprint, so it silently expires when the disagreement's
 * values change. Expired mutes are ignored on purpose - the finding
 * resurfaces and gets reviewed again.
 */
export function applyMutes(findings: Finding[]): Map<string, Mute> {
  const muted = new Map<string, Mute>();
  try {
    const { mutes } = JSON.parse(
      readFileSync(resolve(ROOT, "docs-platform/drift/mutes.json"), "utf8")
    ) as { mutes: Mute[] };
    const today = new Date().toISOString().slice(0, 10);
    for (const m of mutes) {
      if (m.expires && m.expires < today) continue;
      muted.set(m.fingerprint, m);
    }
  } catch {
    // no mutes file - nothing is suppressed
  }
  for (const f of findings) {
    if (muted.has(f.fingerprint)) {
      f.muted = true;
      f.blocking = false;
    }
  }
  return muted;
}
