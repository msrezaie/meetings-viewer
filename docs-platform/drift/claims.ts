/**
 * Claim registry: what the docs platform asserts, and where else the same
 * subject is restated. Each claim names the master source (the authority)
 * and every known restatement, with an extractor telling the checker how to
 * read that source's asserted value.
 *
 * Adding a docs page that restates a fact already covered here? Add the page
 * to `assertedBy` on the matching claim instead of writing a new check.
 */

import type { Claim } from "../engine/types.ts";

export const claims: Claim[] = [
  {
    kind: "vocabulary",
    id: "status-vocabulary",
    subject: "meeting.status vocabulary",
    master: {
      ref: "docs-platform/sources/city-scrapers-core/constants.py",
      class: "executable",
      extract: { type: "python-constants", tuple: "STATUSES" },
    },
    assertedBy: [
      {
        ref: "content/docs/qa/schema.mdx",
        class: "git-prose",
        page: "/docs/qa/schema",
        form: "values",
        exhaustive: true,
        extract: {
          type: "token-list",
          pattern: "One of ([^.]+)\\.",
          style: "backticked",
        },
      },
      {
        ref: "content/docs/scrapers/writing-a-spider.mdx",
        class: "git-prose",
        page: "/docs/scrapers/writing-a-spider",
        form: "values",
        exhaustive: true,
        extract: {
          type: "token-list",
          pattern: "One of ([^.]+)\\.",
          style: "backticked",
        },
      },
      {
        ref: "content/docs/qa/rubric.mdx",
        class: "git-prose",
        page: "/docs/qa/rubric",
        form: "values",
        exhaustive: true,
        extract: {
          type: "token-list",
          pattern:
            "## status[\\s\\S]+?\\*\\*Pass\\*\\*:([\\s\\S]+?)\\n- \\*\\*Fail",
          style: "backticked",
        },
      },
      {
        ref: "content/docs/viewer/index.mdx",
        class: "git-prose",
        page: "/docs/viewer",
        form: "values",
        exhaustive: true,
        extract: {
          type: "token-list",
          pattern: "status values\\.([\\s\\S]+?)<Callout",
          style: "quoted",
        },
      },
      {
        ref: "docs-platform/sources/city-scraper-project-tech-guide.md",
        class: "external",
        form: "names",
        exhaustive: false,
        extract: {
          type: "token-list",
          pattern: "status \\(string\\)\\*\\*([\\s\\S]+?)\\*\\*start",
          style: "upper-words",
        },
      },
      {
        ref: "docs-platform/sources/city-scrapers-development-guide.md",
        class: "external",
        form: "values",
        exhaustive: true,
        extract: {
          type: "token-list",
          pattern: "\\| status +\\| *([^|]+) *\\|",
          style: "quoted",
        },
      },
      {
        ref: "docs-platform/sources/skills/spider-review/SKILL.md",
        class: "external",
        form: "values",
        exhaustive: true,
        extract: {
          type: "token-list",
          pattern: "One of: ([^|]+)",
          style: "backticked",
        },
      },
      {
        ref: "data/scrapers/test_spider1.json",
        class: "structured",
        form: "values",
        exhaustive: false,
        extract: { type: "json-field", field: "status" },
      },
      {
        ref: "data/scrapers/test_spider2.json",
        class: "structured",
        form: "values",
        exhaustive: false,
        extract: { type: "json-field", field: "status" },
      },
      {
        ref: "data/scrapers/test_spider3_duplicates.json",
        class: "structured",
        form: "values",
        exhaustive: false,
        extract: { type: "json-field", field: "status" },
      },
    ],
  },
  {
    kind: "vocabulary",
    id: "classification-vocabulary",
    subject: "meeting.classification vocabulary",
    master: {
      ref: "docs-platform/sources/city-scrapers-core/constants.py",
      class: "executable",
      extract: { type: "python-constants", tuple: "CLASSIFICATIONS" },
    },
    assertedBy: [
      {
        ref: "content/docs/qa/schema.mdx",
        class: "git-prose",
        page: "/docs/qa/schema",
        form: "values",
        exhaustive: false,
        extract: {
          type: "token-list",
          pattern: "The meeting type, e\\.g\\. ([^.]+)\\.",
          style: "quoted",
        },
      },
      {
        ref: "docs-platform/sources/city-scraper-project-tech-guide.md",
        class: "external",
        form: "names",
        exhaustive: false,
        extract: {
          type: "token-list",
          pattern: "classification \\(string\\)\\*\\*([\\s\\S]+?)\\*\\*status",
          style: "upper-words",
        },
      },
      {
        ref: "docs-platform/sources/city-scrapers-development-guide.md",
        class: "external",
        form: "names",
        exhaustive: false,
        extract: {
          type: "token-list",
          pattern: "\\| classification +\\| *([^|]+) *\\|",
          style: "upper-words",
        },
      },
      {
        ref: "docs-platform/sources/skills/spider-review/SKILL.md",
        class: "external",
        form: "names",
        exhaustive: false,
        extract: {
          type: "token-list",
          pattern: "\\| `classification` +\\| ([^|]+)\\|",
          style: "upper-words",
        },
      },
      {
        ref: "data/scrapers/test_spider1.json",
        class: "structured",
        form: "values",
        exhaustive: false,
        extract: { type: "json-field", field: "classification" },
      },
      {
        ref: "data/scrapers/test_spider2.json",
        class: "structured",
        form: "values",
        exhaustive: false,
        extract: { type: "json-field", field: "classification" },
      },
      {
        ref: "data/scrapers/test_spider3_duplicates.json",
        class: "structured",
        form: "values",
        exhaustive: false,
        extract: { type: "json-field", field: "classification" },
      },
    ],
  },
  {
    kind: "proposition",
    id: "start-timezone",
    subject: "meeting.start / meeting.end timezone convention",
    master: {
      ref: "docs-platform/sources/city-scrapers-development-guide.md",
      class: "git-prose",
      extract: {
        type: "keyword-choice",
        pattern: "Start Datetime([\\s\\S]+?)(?=\\n####|\\n## )",
        options: ["naive", "aware"],
      },
    },
    assertedBy: [
      {
        ref: "content/docs/qa/schema.mdx",
        class: "git-prose",
        page: "/docs/qa/schema",
        extract: {
          type: "keyword-choice",
          pattern: "### start([\\s\\S]+?)(?=\\n### )",
          options: ["naive", "aware"],
        },
      },
      {
        ref: "docs-platform/sources/city-scraper-project-tech-guide.md",
        class: "external",
        extract: {
          type: "keyword-choice",
          pattern: "start \\(datetime\\)([\\s\\S]+?)\\*\\*end",
          options: ["naive", "aware"],
        },
      },
      {
        ref: "data/scrapers/test_spider1.json",
        class: "structured",
        extract: { type: "datetime-tz", pattern: '"start":\\s*"([^"]+)"' },
      },
    ],
  },
  {
    kind: "vocabulary",
    id: "links-priority",
    subject: "meeting.links priority order",
    master: {
      ref: "docs-platform/sources/city-scrapers-development-guide.md",
      class: "git-prose",
      extract: {
        type: "token-list",
        pattern: "Priority order: ([^.]+)\\.",
        ordered: true,
      },
    },
    assertedBy: [
      {
        ref: "content/docs/qa/schema.mdx",
        class: "git-prose",
        page: "/docs/qa/schema",
        form: "values",
        exhaustive: true,
        extract: {
          type: "token-list",
          pattern: "priority order:([\\s\\S]+?)(?=\\n### )",
          ordered: true,
        },
      },
    ],
  },
  {
    kind: "proposition",
    id: "viewer-storage-model",
    subject: "viewer storage model (no database, no API server)",
    master: {
      ref: "docs-platform/sources/meetings-viewer-technical-specification.md",
      class: "external",
      extract: {
        type: "keyword-choice",
        pattern: "Architectural invariants([\\s\\S]+?)(?=\\n###)",
        options: ["no database", "a database"],
      },
    },
    assertedBy: [
      {
        ref: "content/docs/viewer/architecture.mdx",
        class: "git-prose",
        page: "/docs/viewer/architecture",
        extract: {
          type: "keyword-choice",
          pattern: "## Two modes([\\s\\S]+?)(?=\\n## )",
          options: ["no database", "a database"],
        },
      },
    ],
  },
  {
    kind: "repo-paths",
    id: "project-structure-paths",
    subject: "contributing page project-structure listing",
    assertedBy: [
      {
        ref: "content/docs/contributing/index.mdx",
        class: "git-prose",
        page: "/docs/contributing",
        extract: {
          type: "path-listing",
          pattern: "### Project structure\\s*```\\n([\\s\\S]+?)```",
        },
      },
    ],
  },
  {
    kind: "repo-fact",
    id: "architecture-data-module",
    subject: "viewer/architecture.mdx data-source module",
    assertion:
      "Page cites lib/scraper-data.ts as the MeetingRecord type and data-source module.",
    master: {
      ref: "lib/scraper-data.ts",
      class: "executable",
      extract: { type: "file-exists" },
    },
    page: {
      ref: "content/docs/viewer/architecture.mdx",
      class: "git-prose",
      page: "/docs/viewer/architecture",
      extract: { type: "file-exists" },
    },
  },
  {
    kind: "repo-fact",
    id: "architecture-dedup-module",
    subject: "viewer/architecture.mdx duplicate-detection module",
    assertion:
      "Page cites lib/duplicate-detection.ts for same-start record grouping.",
    master: {
      ref: "lib/duplicate-detection.ts",
      class: "executable",
      extract: { type: "file-exists" },
    },
    page: {
      ref: "content/docs/viewer/architecture.mdx",
      class: "git-prose",
      page: "/docs/viewer/architecture",
      extract: { type: "file-exists" },
    },
  },
  {
    kind: "repo-fact",
    id: "schema-page-generated",
    subject: "qa/schema.mdx generation claim",
    assertion:
      "Page asserts it is generated from lib/scraper-data.ts via docs-platform/engine/generate-schema.ts into docs-platform/generated/meeting-schema.json.",
    master: {
      ref: "docs-platform/generated/meeting-schema.json",
      class: "executable",
      extract: { type: "file-exists" },
    },
    page: {
      ref: "content/docs/qa/schema.mdx",
      class: "git-prose",
      page: "/docs/qa/schema",
      extract: { type: "file-exists" },
    },
  },
];
