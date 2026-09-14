import { collection, config, fields } from "@keystatic/core";
import { siteConfig } from "./lib/site-config";
import {
  block,
  repeating,
  wrapper,
  type ContentComponent,
} from "@keystatic/core/content-components";

/**
 * Keystatic - the docs platform's terminal-free editing surface, mounted at
 * /keystatic. Scoped to content/docs. Every custom component the MDX pages
 * embed must be declared in `components` below or fields.mdx rejects the
 * page with "Missing component definition".
 *
 * Storage is conditional. Until NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG is set
 * the editor runs `local` mode: no login, saves write straight into the
 * working tree on the machine running `next dev`. Once the GitHub app exists
 * (run /keystatic/setup in dev - it writes the env vars into .env.local)
 * the editor switches to `github` mode: OAuth login required, editors commit
 * to keystatic/* branches (branchPrefix), and the docs-editor-pr workflow
 * opens a PR so every change is reviewed and drift-checked. Pair this with
 * branch protection on the default branch to make the PR step mandatory.
 *
 * The check uses the NEXT_PUBLIC_ var on purpose: this config is bundled
 * into the client too, and only NEXT_PUBLIC_ vars survive into the browser.
 */

/** A presentational component with no editable props, e.g. <SchemaTable />. */
function live(label: string, description: string): ContentComponent {
  return block({ label, description, schema: {} });
}

const components: Record<string, ContentComponent> = {
  // Repo scoping and command snippets
  RepoScope: block({
    label: "Repo scope badge",
    description:
      "Stamps which codebase the page's commands and paths apply to.",
    schema: {
      repo: fields.select({
        label: "Repo",
        options: [
          { label: siteConfig.name, value: "meetings-viewer" },
          { label: "Scrapers (core + consumer repos)", value: "scrapers" },
        ],
        defaultValue: "meetings-viewer",
      }),
    },
  }),
  CommandBlock: block({
    label: "Command block",
    description: "Copyable command; {placeholder} segments get input fields.",
    schema: {
      command: fields.text({ label: "Command" }),
    },
  }),

  // Live/generated components - render only, no editable props
  SchemaTable: live(
    "Schema table",
    "Generated meeting-record field table from lib/scraper-data.ts."
  ),
  StatusVocabulary: live(
    "Status vocabulary",
    "Status values rendered from the generated schema."
  ),
  ClassificationVocabulary: live(
    "Classification vocabulary",
    "Classification values rendered from the generated schema."
  ),
  RubricReport: live(
    "Rubric report",
    "Paste-a-JSON QA check reusing the viewer's duplicate detection."
  ),
  PRLifecycle: live("PR lifecycle", "Six-stage scraper PR lifecycle stepper."),
  LinkIndex: live("Link index", "External link registry table."),
  LighthouseTrend: live(
    "Lighthouse trend",
    "Sparkline of docs-quality Lighthouse runs."
  ),
  ConflictPanel: live(
    "Conflict panel",
    "Drift findings from docs-platform/drift/findings.json."
  ),
  StatusChip: block({
    label: "Status chip",
    schema: {
      status: fields.select({
        label: "Status",
        options: [
          { label: "passed", value: "passed" },
          { label: "tentative", value: "tentative" },
          { label: "cancelled", value: "cancelled" },
          { label: "confirmed", value: "confirmed" },
        ],
        defaultValue: "confirmed",
      }),
    },
  }),

  // KPI tiles (must sit inside a KpiRow)
  KpiRow: repeating({
    label: "KPI row",
    children: "KpiTile",
    schema: {},
  }),
  KpiTile: block({
    label: "KPI tile",
    schema: {
      value: fields.text({ label: "Value" }),
      label: fields.text({ label: "Label" }),
      status: fields.select({
        label: "Status",
        options: [
          { label: "good", value: "good" },
          { label: "warn", value: "warn" },
          { label: "bad", value: "bad" },
          { label: "neutral", value: "neutral" },
        ],
        defaultValue: "neutral",
      }),
    },
  }),

  // Prose layout primitives
  Callout: wrapper({
    label: "Callout",
    schema: {
      type: fields.select({
        label: "Type",
        options: [
          { label: "info", value: "info" },
          { label: "tip", value: "tip" },
          { label: "warn", value: "warn" },
          { label: "error", value: "error" },
        ],
        defaultValue: "info",
      }),
    },
  }),
  Steps: repeating({ label: "Steps", children: "Step", schema: {} }),
  Step: wrapper({ label: "Step", schema: {} }),
  Accordions: repeating({
    label: "Accordions",
    children: "Accordion",
    schema: {},
  }),
  Accordion: wrapper({
    label: "Accordion",
    schema: {
      title: fields.text({ label: "Title" }),
      id: fields.text({ label: "Anchor id" }),
    },
  }),
  Tabs: repeating({
    label: "Tabs",
    children: "Tab",
    schema: {
      items: fields.array(fields.text({ label: "Tab label" }), {
        label: "Items",
      }),
    },
  }),
  Tab: wrapper({
    label: "Tab",
    schema: { value: fields.text({ label: "Value" }) },
  }),
};

const githubMode = Boolean(process.env.NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG);

export default config({
  storage: githubMode
    ? {
        kind: "github",
        repo: "msrezaie/meetings-viewer",
        branchPrefix: "keystatic/",
      }
    : { kind: "local" },
  ui: { brand: { name: siteConfig.docsNavTitle } },
  collections: {
    docs: collection({
      label: "Docs pages",
      slugField: "title",
      // `**` lets an entry slug span directories: slug `qa/rubric` maps to
      // content/docs/qa/rubric.mdx (flat files, not directory entries).
      path: "content/docs/**",
      entryLayout: "content",
      format: { contentField: "content" },
      schema: {
        title: fields.slug({ name: { label: "Title" } }),
        description: fields.text({ label: "Description" }),
        content: fields.mdx({
          label: "Content",
          extension: "mdx",
          components,
        }),
      },
    }),
  },
});
