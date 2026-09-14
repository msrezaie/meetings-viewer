/**
 * Generate docs-platform/generated/meeting-schema.json - the single input the
 * SchemaTable component renders and the qa/schema.mdx page claims to be
 * generated from.
 *
 * Inputs (both already the project's authorities):
 *   - lib/scraper-data.ts                      -> field names, types, required
 *   - docs-platform/sources/city-scrapers-core/constants.py -> vocabularies
 *
 * Fields prefixed with `_` are viewer-internal and excluded.
 *
 *   node docs-platform/engine/generate-schema.ts
 *   node docs-platform/engine/generate-schema.ts --check   (exit 1 if stale)
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { extract } from "./extract.ts";

const ROOT = resolve(import.meta.dirname, "..", "..");
const OUT = resolve(ROOT, "docs-platform/generated/meeting-schema.json");
const INTERFACE_PATH = resolve(ROOT, "lib/scraper-data.ts");
const CONSTANTS_REF = "docs-platform/sources/city-scrapers-core/constants.py";

interface SchemaField {
  name: string;
  type: string;
  required: boolean;
}

function parseInterface(text: string, name: string): SchemaField[] {
  const start = text.indexOf(`export interface ${name} {`);
  if (start < 0)
    throw new Error(`interface ${name} not found in ${INTERFACE_PATH}`);
  const open = text.indexOf("{", start);
  let depth = 0;
  let end = -1;
  for (let i = open; i < text.length; i++) {
    if (text[i] === "{") depth++;
    if (text[i] === "}") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end < 0) throw new Error(`interface ${name} has unbalanced braces`);
  const body = text.slice(open + 1, end);

  const fields: SchemaField[] = [];
  for (const line of body.split("\n")) {
    const fm = line.match(
      /^\s*([A-Za-z_][A-Za-z0-9_]*)(\?)?\s*:\s*(.+?);?\s*$/
    );
    if (!fm) continue;
    const [, fieldName, optional, type] = fm;
    if (fieldName.startsWith("_")) continue;
    fields.push({ name: fieldName, type, required: !optional });
  }
  return fields;
}

function main() {
  const text = readFileSync(INTERFACE_PATH, "utf8");
  const fields = parseInterface(text, "MeetingRecord");

  const statuses =
    extract({ type: "python-constants", tuple: "STATUSES" }, CONSTANTS_REF)
      ?.values ?? [];
  const classifications =
    extract(
      { type: "python-constants", tuple: "CLASSIFICATIONS" },
      CONSTANTS_REF
    )?.values ?? [];
  if (!statuses.length || !classifications.length) {
    throw new Error(`could not read vocabularies from ${CONSTANTS_REF}`);
  }

  const schema = {
    $comment:
      "GENERATED FILE - do not edit. Run `npm run docs:schema` to regenerate. Input: lib/scraper-data.ts MeetingRecord + docs-platform/sources/city-scrapers-core/constants.py.",
    generated_from: ["lib/scraper-data.ts", CONSTANTS_REF],
    fields,
    statuses,
    classifications,
  };
  const out = JSON.stringify(schema, null, 2) + "\n";

  if (process.argv.includes("--check")) {
    const current = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
    if (current !== out) {
      console.error(
        "docs-platform/generated/meeting-schema.json is stale - run `npm run docs:schema`"
      );
      process.exit(1);
    }
    console.log("meeting-schema.json is current");
    return;
  }

  writeFileSync(OUT, out);
  console.log(
    `wrote docs-platform/generated/meeting-schema.json (${fields.length} fields, ${statuses.length} statuses, ${classifications.length} classifications)`
  );
}

main();
