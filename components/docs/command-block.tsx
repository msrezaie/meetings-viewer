"use client";

import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";

/**
 * A copyable command with fill-in placeholders. Write the command with
 * {placeholder} markers; the block renders one input per marker and the
 * copy button puts the resolved command on the clipboard.
 *
 *   <CommandBlock command="scrapy crawl {spider} -O {output}.json" />
 */
export function CommandBlock({
  command,
  defaults = {},
}: {
  command: string;
  defaults?: Record<string, string>;
}) {
  const placeholders = useMemo(
    () => [
      ...new Set([...command.matchAll(/\{([a-zA-Z_]+)\}/g)].map((m) => m[1])),
    ],
    [command]
  );
  const [values, setValues] = useState<Record<string, string>>(defaults);
  const [copied, setCopied] = useState(false);

  const resolved = placeholders.reduce(
    (cmd, p) => cmd.replaceAll(`{${p}}`, values[p] || `{${p}}`),
    command
  );
  const ready = placeholders.every((p) => (values[p] ?? "").length > 0);

  const copy = async () => {
    await navigator.clipboard.writeText(resolved);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Paper variant="outlined" sx={{ mb: 3, overflow: "hidden" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1.5,
          py: 1,
          bgcolor: "action.hover",
          fontFamily: "monospace",
          fontSize: "0.8rem",
          overflowX: "auto",
        }}
      >
        <Box component="code" sx={{ flex: 1, whiteSpace: "pre" }}>
          {resolved}
        </Box>
        <Tooltip
          title={copied ? "Copied" : ready ? "Copy" : "Fill placeholders first"}
        >
          <span>
            <IconButton size="small" onClick={copy} disabled={!ready}>
              {copied ? (
                <CheckIcon fontSize="small" color="success" />
              ) : (
                <ContentCopyIcon fontSize="small" />
              )}
            </IconButton>
          </span>
        </Tooltip>
      </Box>
      {placeholders.length > 0 && (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1.5,
            px: 1.5,
            py: 1.5,
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          {placeholders.map((p) => (
            <TextField
              key={p}
              label={p}
              size="small"
              value={values[p] ?? ""}
              onChange={(e) =>
                setValues((v) => ({ ...v, [p]: e.target.value }))
              }
              sx={{ minWidth: 160 }}
              slotProps={{
                input: { sx: { fontFamily: "monospace", fontSize: 12 } },
              }}
            />
          ))}
        </Box>
      )}
    </Paper>
  );
}
