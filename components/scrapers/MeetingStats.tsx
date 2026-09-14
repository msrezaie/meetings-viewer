"use client";

import { useMemo } from "react";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import type { MeetingRecord } from "@/lib/scraper-data";
import { normalizeStatus } from "@/lib/meeting-utils";
import { buildDuplicateGroups } from "@/lib/duplicate-detection";

// Numbers use theme status colors and explicit text labels so
// meaning never depends on color alone (WCAG 1.4.1).
type ValueColor =
  | "text.primary"
  | "success.main"
  | "error.main"
  | "warning.main"
  | "secondary.main";

const STAT_ITEMS: { key: string; label: string; color: ValueColor }[] = [
  { key: "total", label: "Total", color: "text.primary" },
  { key: "passed", label: "Passed", color: "success.main" },
  { key: "cancelled", label: "Cancelled", color: "error.main" },
  { key: "tentative", label: "Tentative", color: "warning.main" },
  { key: "duplicates", label: "Duplicates", color: "secondary.main" },
];

function StatItem({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: ValueColor;
}) {
  return (
    // Match the FilterButton height for visual consistency.
    <Chip
      label={
        <>
          <Box component="span" sx={{ color, fontWeight: "bold" }}>
            {value}
          </Box>{" "}
          <Box component="span" sx={{ color: "text.secondary" }}>
            {label}
          </Box>
        </>
      }
      variant="filled"
      size="medium"
      sx={{
        bgcolor: "action.hover",
        borderRadius: 1,
      }}
    />
  );
}

export default function MeetingStats({
  records,
}: {
  records: MeetingRecord[];
}) {
  const counts = useMemo(() => {
    const byStatus: Record<string, number> = {};
    for (const r of records) {
      const s = normalizeStatus(r.status);
      byStatus[s] = (byStatus[s] ?? 0) + 1;
    }
    const duplicates = buildDuplicateGroups(records).filter(
      (d) => d.isDuplicate
    ).length;
    return { total: records.length, byStatus, duplicates };
  }, [records]);

  return (
    <Stack
      direction="row"
      useFlexGap
      spacing={1}
      sx={{
        flexWrap: "wrap",
        width: { xs: "100%", sm: "auto" },
        justifyContent: "center",
      }}
    >
      {STAT_ITEMS.map((item) => (
        <StatItem
          key={item.key}
          label={item.label}
          color={item.color}
          value={
            item.key === "total"
              ? counts.total
              : item.key === "duplicates"
                ? counts.duplicates
                : (counts.byStatus[item.key] ?? 0)
          }
        />
      ))}
    </Stack>
  );
}
