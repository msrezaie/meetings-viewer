"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";

export type KpiStatus = "good" | "warn" | "bad" | "neutral";

/**
 * One stat tile for the analytics fleet panel. Status colors come straight
 * from the MUI theme - the same success/warning/error mapping StatusChip
 * uses - never hand-picked hex.
 */
export function KpiTile({
  value,
  label,
  status = "neutral",
}: {
  value: string | number;
  label: string;
  status?: KpiStatus;
}) {
  const theme = useTheme();
  const border =
    status === "good"
      ? theme.palette.success.main
      : status === "warn"
        ? theme.palette.warning.main
        : status === "bad"
          ? theme.palette.error.main
          : theme.palette.divider;

  return (
    <Paper
      variant="outlined"
      sx={{
        px: 3,
        py: 2,
        minWidth: 180,
        borderTopWidth: 3,
        borderTopColor: border,
      }}
    >
      <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Paper>
  );
}

/** Row layout for a group of KpiTiles. */
export function KpiRow({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", my: 2 }}>
      {children}
    </Box>
  );
}
