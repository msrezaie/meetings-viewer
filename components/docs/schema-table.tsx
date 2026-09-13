import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import schema from "@/docs-platform/generated/meeting-schema.json";

/**
 * The meeting-record field table, generated from lib/scraper-data.ts
 * (MeetingRecord) via docs-platform/engine/generate-schema.ts. Every field
 * row carries an anchor id matching the field name so rubric entries can
 * deep-link: /docs/qa/schema#links.
 *
 * The JSON is generated, so this table is always in sync with the type - do
 * not hand-edit.
 */
export function SchemaTable() {
  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{ mb: 3, fontSize: "0.875rem" }}
    >
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Field</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Required</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {schema.fields.map((f) => (
            <TableRow key={f.name} id={f.name}>
              <TableCell>
                <code className="font-mono text-[0.85em]">{f.name}</code>
              </TableCell>
              <TableCell>
                <code className="font-mono text-[0.8em] break-all">
                  {f.type}
                </code>
              </TableCell>
              <TableCell>
                {f.required ? (
                  "yes"
                ) : (
                  <Chip label="optional" size="small" variant="outlined" />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

/** The status vocabulary, straight from city-scrapers-core constants. */
export function StatusVocabulary() {
  return (
    <span>
      {schema.statuses.map((s, i) => (
        <span key={s}>
          {i > 0 && ", "}
          <code className="font-mono text-[0.85em]">{s}</code>
        </span>
      ))}
    </span>
  );
}

/** The classification vocabulary, straight from city-scrapers-core. */
export function ClassificationVocabulary() {
  return (
    <span>
      {schema.classifications.map((s, i) => (
        <span key={s}>
          {i > 0 && ", "}
          <code className="font-mono text-[0.85em]">{s}</code>
        </span>
      ))}
    </span>
  );
}
