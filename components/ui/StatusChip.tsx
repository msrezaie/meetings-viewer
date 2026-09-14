"use client";

import Chip from "@mui/material/Chip";
import { highlightMatches } from "@/components/ui/HighlightMatches";

export const STATUS_CHIP_COLOR: Record<
  string,
  "success" | "error" | "warning" | "info" | "default"
> = {
  passed: "success",
  cancelled: "error",
  tentative: "warning",
  confirmed: "info",
};

export function StatusChip({
  status,
  highlight,
}: {
  status: string;
  highlight?: string;
}) {
  const label = status || "—";
  const renderedLabel = highlightMatches([label], highlight ?? "");

  return (
    <Chip
      component="span"
      label={renderedLabel}
      size="small"
      color={STATUS_CHIP_COLOR[status] ?? "default"}
      variant="outlined"
    />
  );
}
