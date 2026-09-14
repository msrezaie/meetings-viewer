/**
 * Fixture-corpus test for the drift engine.
 *
 * The corpus under docs-platform/fixtures/ contains known agreements and
 * disagreements. This test runs evaluateClaims against fixture claims and
 * measures recall (every planted disagreement is detected) and precision
 * (every emitted finding is a real planted disagreement).
 *
 *   node --test docs-platform/engine/check.test.ts
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluateClaims } from "./evaluate.ts";
import type { Claim } from "./types.ts";

const F = "docs-platform/fixtures";

const vocabPattern = "One of (.*)";
const fixtureClaims: Claim[] = [
  {
    id: "fixture-status-vocab",
    kind: "vocabulary",
    subject: "fixture status vocabulary",
    master: {
      ref: `${F}/fixture-constants.py`,
      class: "executable",
      extract: { type: "python-constants", tuple: "STATUSES" },
    },
    assertedBy: [
      {
        ref: `${F}/fixture-doc-agrees.mdx`,
        class: "git-prose",
        exhaustive: true,
        extract: {
          type: "token-list",
          pattern: vocabPattern,
          style: "backticked",
        },
      },
      {
        ref: `${F}/fixture-doc-missing.mdx`,
        class: "git-prose",
        exhaustive: true,
        extract: {
          type: "token-list",
          pattern: vocabPattern,
          style: "backticked",
        },
      },
      {
        ref: `${F}/fixture-doc-extra.mdx`,
        class: "git-prose",
        exhaustive: true,
        extract: {
          type: "token-list",
          pattern: vocabPattern,
          style: "backticked",
        },
      },
      {
        ref: `${F}/fixture-doc-unreadable.mdx`,
        class: "git-prose",
        exhaustive: true,
        extract: {
          type: "token-list",
          pattern: vocabPattern,
          style: "backticked",
        },
      },
      {
        ref: `${F}/fixture-data.json`,
        class: "structured",
        extract: { type: "json-field", field: "status" },
      },
    ],
  },
  {
    id: "fixture-link-order",
    kind: "vocabulary",
    subject: "fixture link order",
    master: {
      ref: `${F}/fixture-order-master.md`,
      class: "synced",
      extract: {
        type: "token-list",
        pattern: "Priority order: (.*)",
        ordered: true,
      },
    },
    assertedBy: [
      {
        ref: `${F}/fixture-order-wrong.mdx`,
        class: "git-prose",
        extract: {
          type: "token-list",
          pattern: "Priority order: (.*)",
          ordered: true,
        },
      },
    ],
  },
  {
    id: "fixture-tz",
    kind: "proposition",
    subject: "fixture datetime convention",
    master: {
      ref: `${F}/fixture-tz-naive.mdx`,
      class: "synced",
      extract: { type: "datetime-tz", pattern: "Example: `(.*)`" },
    },
    assertedBy: [
      {
        ref: `${F}/fixture-tz-aware.mdx`,
        class: "git-prose",
        extract: { type: "datetime-tz", pattern: "Example: `(.*)`" },
      },
      {
        ref: `${F}/fixture-tz-naive.mdx`,
        class: "git-prose",
        extract: { type: "datetime-tz", pattern: "Example: `(.*)`" },
      },
    ],
  },
  {
    id: "fixture-commands",
    kind: "vocabulary",
    subject: "fixture documented commands",
    master: {
      ref: `${F}/fixture-scripts.json`,
      class: "executable",
      extract: { type: "regex-set", pattern: '"(docs:[a-z:-]+)"\\s*:' },
    },
    assertedBy: [
      {
        ref: `${F}/fixture-commands-missing.mdx`,
        class: "git-prose",
        exhaustive: true,
        extract: {
          type: "regex-set",
          pattern: "npm run (docs:[a-z:-]+)",
        },
      },
    ],
  },
  {
    id: "fixture-structure",
    kind: "repo-paths",
    subject: "fixture project-structure paths",
    assertedBy: [
      {
        ref: `${F}/fixture-tree-ok.mdx`,
        class: "git-prose",
        extract: {
          type: "path-listing",
          pattern: "### Project structure\\s*```\\n([\\s\\S]+?)```",
        },
      },
      {
        ref: `${F}/fixture-tree-broken.mdx`,
        class: "git-prose",
        extract: {
          type: "path-listing",
          pattern: "### Project structure\\s*```\\n([\\s\\S]+?)```",
        },
      },
    ],
  },
];

// What the corpus is planted to produce.
const expectedFindings = new Set([
  "fixture-status-vocab::docs-platform/fixtures/fixture-doc-missing.mdx",
  "fixture-status-vocab::docs-platform/fixtures/fixture-doc-extra.mdx",
  "fixture-status-vocab::docs-platform/fixtures/fixture-doc-unreadable.mdx",
  "fixture-status-vocab::docs-platform/fixtures/fixture-data.json",
  "fixture-link-order::docs-platform/fixtures/fixture-order-wrong.mdx",
  "fixture-tz::docs-platform/fixtures/fixture-tz-aware.mdx",
  "fixture-commands::docs-platform/fixtures/fixture-commands-missing.mdx",
  "fixture-structure::docs-platform/fixtures/fixture-tree-broken.mdx",
]);

test("drift engine recall and precision on the fixture corpus", () => {
  const { findings } = evaluateClaims(fixtureClaims);
  const detected = new Set(findings.map((f) => f.id));

  const missed = [...expectedFindings].filter((id) => !detected.has(id));
  const unexpected = [...detected].filter((id) => !expectedFindings.has(id));

  const recall =
    (expectedFindings.size - missed.length) / expectedFindings.size;
  const precision =
    detected.size === 0
      ? 0
      : (detected.size - unexpected.length) / detected.size;

  console.log(
    `fixture corpus: recall ${recall.toFixed(2)} (${expectedFindings.size - missed.length}/${expectedFindings.size}), ` +
      `precision ${precision.toFixed(2)} (${detected.size - unexpected.length}/${detected.size})`
  );
  if (missed.length) console.log(`  missed: ${missed.join(", ")}`);
  if (unexpected.length) console.log(`  unexpected: ${unexpected.join(", ")}`);

  assert.equal(missed.length, 0, `missed findings: ${missed.join(", ")}`);
  assert.equal(
    unexpected.length,
    0,
    `unexpected findings: ${unexpected.join(", ")}`
  );
});

test("finding details are actionable", () => {
  const { findings } = evaluateClaims(fixtureClaims);
  for (const f of findings) {
    assert.ok(f.fingerprint.length >= 8, "fingerprint present");
    assert.ok(f.owner !== "unowned", `owner resolved for ${f.id}`);
    assert.ok(f.action.length > 0, "action present");
  }
  const missing = findings.find((f) =>
    f.id.includes("fixture-doc-missing.mdx")
  );
  assert.ok(missing?.evidence[0].missing?.includes("confirmed"));
  const extra = findings.find((f) => f.id.includes("fixture-doc-extra.mdx"));
  assert.ok(extra?.evidence[0].extra?.includes("postponed"));
});
