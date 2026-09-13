"use client";

import { useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import schema from "@/docs-platform/generated/meeting-schema.json";
import { buildDuplicateGroups } from "@/lib/duplicate-detection";
import { normalizeStatus } from "@/lib/meeting-utils";
import type { MeetingRecord } from "@/lib/scraper-data";

interface Check {
  name: string;
  anchor: string;
  status: "pass" | "warn" | "fail";
  detail: string;
}

const NAIVE_DATETIME = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?$/;
const LINK_PRIORITY = ["agenda", "minutes", "video", "other"];

function linkKind(title: string): number {
  const t = title.toLowerCase();
  if (t.includes("agenda")) return 0;
  if (t.includes("minutes")) return 1;
  if (t.includes("video") || t.includes("recording")) return 2;
  return 3;
}

function evaluate(records: MeetingRecord[]): Check[] {
  const checks: Check[] = [];

  // Required fields present on every record
  const missingFields = new Map<string, number>();
  for (const f of schema.fields) {
    const n = records.filter(
      (r) => (r as unknown as Record<string, unknown>)[f.name] === undefined
    ).length;
    if (n) missingFields.set(f.name, n);
  }
  checks.push({
    name: "required fields",
    anchor: "#fields",
    status: missingFields.size === 0 ? "pass" : "fail",
    detail:
      missingFields.size === 0
        ? `all ${schema.fields.length} fields present on every record`
        : [...missingFields.entries()]
            .map(([f, n]) => `${f} missing on ${n}`)
            .join("; "),
  });

  // Naive datetimes
  const aware = records.filter(
    (r) =>
      typeof r.start === "string" &&
      (r.start.includes("+") || /Z$|[+-]\d{2}:\d{2}$/.test(r.start))
  ).length;
  const badFormat = records.filter(
    (r) => typeof r.start === "string" && !NAIVE_DATETIME.test(r.start)
  ).length;
  checks.push({
    name: "start/end naive datetimes",
    anchor: "#start",
    status: aware === 0 && badFormat === 0 ? "pass" : "fail",
    detail:
      aware === 0 && badFormat === 0
        ? "all start values are naive YYYY-MM-DD HH:mm:ss"
        : `${aware} tz-aware, ${badFormat} malformed start values`,
  });

  // Status vocabulary
  const allowed = new Set(schema.statuses);
  const badStatus = new Map<string, number>();
  for (const r of records) {
    const s = normalizeStatus(r.status);
    if (!allowed.has(s)) badStatus.set(s, (badStatus.get(s) ?? 0) + 1);
  }
  checks.push({
    name: "status vocabulary",
    anchor: "#status",
    status: badStatus.size === 0 ? "pass" : "fail",
    detail:
      badStatus.size === 0
        ? `all statuses in {${schema.statuses.join(", ")}}`
        : [...badStatus.entries()].map(([s, n]) => `"${s}" x${n}`).join(", "),
  });

  // Classification vocabulary
  const allowedClass = new Set(schema.classifications);
  const badClass = new Map<string, number>();
  for (const r of records) {
    if (r.classification && !allowedClass.has(r.classification))
      badClass.set(r.classification, (badClass.get(r.classification) ?? 0) + 1);
  }
  checks.push({
    name: "classification vocabulary",
    anchor: "#classification",
    status: badClass.size === 0 ? "pass" : "warn",
    detail:
      badClass.size === 0
        ? "all classifications match city-scrapers-core constants"
        : [...badClass.entries()].map(([s, n]) => `"${s}" x${n}`).join(", "),
  });

  // Link priority order
  let orderViolations = 0;
  for (const r of records) {
    const kinds = (r.links ?? []).map((l) => linkKind(l.title ?? ""));
    for (let i = 1; i < kinds.length; i++)
      if (kinds[i] < kinds[i - 1]) orderViolations++;
  }
  checks.push({
    name: "links priority order",
    anchor: "#links",
    status: orderViolations === 0 ? "pass" : "warn",
    detail:
      orderViolations === 0
        ? `order follows ${LINK_PRIORITY.join(" > ")}`
        : `${orderViolations} records have links out of priority order`,
  });

  // Source present
  const noSource = records.filter(
    (r) => typeof r.source !== "string" || !r.source.startsWith("http")
  ).length;
  checks.push({
    name: "source URL",
    anchor: "#source",
    status: noSource === 0 ? "pass" : "warn",
    detail:
      noSource === 0
        ? "every record carries a source URL"
        : `${noSource} records lack a valid source URL`,
  });

  // Duplicates via the same union-find the viewer table uses
  const dupInfo = buildDuplicateGroups(records);
  const dupGroups = new Set(
    dupInfo.filter((d) => d.isDuplicate).map((d) => d.groupIndex)
  ).size;
  checks.push({
    name: "duplicate meetings",
    anchor: "",
    status: dupGroups === 0 ? "pass" : "warn",
    detail:
      dupGroups === 0
        ? "no near-duplicate records (same start + similar title)"
        : `${dupGroups} suspected duplicate group(s)`,
  });

  return checks;
}

/**
 * Paste a spider's JSON output and get the same checks the QA rubric applies.
 * Reuses the viewer's duplicate detection and the generated schema so the
 * report cannot drift from what the app itself enforces.
 */
export function RubricReport() {
  const [input, setInput] = useState("");
  const { checks, error, count } = useMemo(() => {
    if (!input.trim()) return { checks: [], error: null, count: 0 };
    try {
      const parsed = JSON.parse(input) as unknown;
      if (!Array.isArray(parsed))
        return { checks: [], error: "expected a JSON array", count: 0 };
      return {
        checks: evaluate(parsed as MeetingRecord[]),
        error: null,
        count: parsed.length,
      };
    } catch (e) {
      return {
        checks: [],
        error: `invalid JSON: ${(e as Error).message.slice(0, 120)}`,
        count: 0,
      };
    }
  }, [input]);

  const fails = checks.filter((c) => c.status === "fail").length;
  const warns = checks.filter((c) => c.status === "warn").length;

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
      <TextField
        label="Paste scraper output (JSON array)"
        multiline
        minRows={6}
        fullWidth
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder='[{"id": "…", "title": "…", "start": "2026-03-10 18:00:00", …}]'
        slotProps={{ input: { sx: { fontFamily: "monospace", fontSize: 12 } } }}
      />
      {error && (
        <Alert severity="error" sx={{ mt: 1.5 }}>
          {error}
        </Alert>
      )}
      {checks.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: "flex", gap: 1, mb: 1.5, alignItems: "center" }}>
            <Typography variant="body2" color="text.secondary">
              {count} records:
            </Typography>
            <Chip
              size="small"
              label={`${checks.length - fails - warns} passed`}
              color="success"
              variant="outlined"
            />
            {warns > 0 && (
              <Chip
                size="small"
                label={`${warns} warning${warns > 1 ? "s" : ""}`}
                color="warning"
                variant="outlined"
              />
            )}
            {fails > 0 && (
              <Chip
                size="small"
                label={`${fails} failed`}
                color="error"
                variant="outlined"
              />
            )}
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Check</TableCell>
                  <TableCell>Result</TableCell>
                  <TableCell>Detail</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {checks.map((c) => (
                  <TableRow key={c.name}>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {c.anchor ? (
                        <a href={`/docs/qa/schema${c.anchor}`}>{c.name}</a>
                      ) : (
                        c.name
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={c.status}
                        color={
                          c.status === "pass"
                            ? "success"
                            : c.status === "warn"
                              ? "warning"
                              : "error"
                        }
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.8rem" }}>
                      {c.detail}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Paper>
  );
}
