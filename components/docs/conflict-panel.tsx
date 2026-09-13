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
import Typography from "@mui/material/Typography";
import report from "@/docs-platform/drift/findings.json";

interface Evidence {
  ref: string;
  page?: string;
  value: unknown;
  missing?: string[];
  extra?: string[];
}

interface Finding {
  id: string;
  claim: string;
  subject: string;
  confidence: "certain" | "likely" | "prompt";
  blocking: boolean;
  owner: string;
  action: string;
  fingerprint: string;
  master: { ref: string; value: unknown };
  evidence: Evidence[];
}

const CONFIDENCE_COLOR = {
  certain: "error",
  likely: "warning",
  prompt: "info",
} as const;

function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object" && value !== null) return JSON.stringify(value);
  return String(value);
}

/**
 * Standing view of the drift report - renders the same findings.json record
 * that PR comments and agents read, so all three surfaces never disagree.
 * Server component: reads the committed JSON at build time.
 */
export function ConflictPanel() {
  // findings.json carries muted entries inside `findings` with `muted: true`
  // - the active list is what the report renders as open findings.
  const all = report.findings as (Finding & { muted?: boolean })[];
  const findings = all.filter((f) => !f.muted);
  const muted = all.filter((f) => f.muted);

  if (findings.length === 0 && muted.length === 0) {
    return (
      <Alert severity="success" sx={{ my: 2 }}>
        No drift findings. Every documented claim agrees with its master source.
      </Alert>
    );
  }

  const byOwner = new Map<string, Finding[]>();
  for (const finding of findings) {
    const list = byOwner.get(finding.owner) ?? [];
    list.push(finding);
    byOwner.set(finding.owner, list);
  }

  return (
    <Box sx={{ my: 2 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {findings.length} open finding(s)
        {muted.length > 0 ? `, ${muted.length} muted` : ""} - generated{" "}
        {new Date(report.generated_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
        .
      </Typography>
      {[...byOwner.entries()].map(([owner, ownerFindings]) => (
        <Box key={owner} sx={{ mb: 4 }}>
          <Typography variant="h6" component="h3" sx={{ mb: 1 }}>
            {owner}
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Finding</TableCell>
                  <TableCell>Confidence</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ownerFindings.map((finding) => (
                  <TableRow key={finding.fingerprint}>
                    <TableCell sx={{ minWidth: 220 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {finding.subject}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        component="div"
                        sx={{ fontFamily: "monospace" }}
                      >
                        {finding.fingerprint}
                        {finding.blocking ? " | blocking" : ""}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={finding.confidence}
                        color={CONFIDENCE_COLOR[finding.confidence]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ minWidth: 260 }}>
                      {finding.evidence.map((ev) => (
                        <Box key={ev.ref} sx={{ mb: 0.5 }}>
                          <Typography
                            variant="caption"
                            component="div"
                            sx={{ fontFamily: "monospace" }}
                          >
                            {ev.ref}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatValue(ev.value)}
                            {ev.missing?.length
                              ? ` (missing: ${ev.missing.join(", ")})`
                              : ""}
                            {ev.extra?.length
                              ? ` (extra: ${ev.extra.join(", ")})`
                              : ""}
                          </Typography>
                        </Box>
                      ))}
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        component="div"
                      >
                        master: {finding.master.ref}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ minWidth: 240 }}>
                      <Typography variant="caption">
                        {finding.action}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ))}
      {muted.length > 0 && (
        <Alert severity="info" variant="outlined">
          {muted.length} finding(s) muted via{" "}
          <code>docs-platform/drift/mutes.json</code>:{" "}
          {muted.map((f) => `${f.subject} (${f.fingerprint})`).join("; ")}.
          Mutes expire automatically when the disagreeing values change.
        </Alert>
      )}
    </Box>
  );
}
