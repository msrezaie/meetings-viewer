"use client";

import type { Ref } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { MeetingRecord } from "@/lib/scraper-data";
import FilterButton from "@/components/scrapers/FilterButton";
import MeetingStats from "@/components/scrapers/MeetingStats";
import { SECTION_GAP } from "@/lib/ui-constants";

interface MeetingsToolbarProps {
  records: MeetingRecord[];
  /** Filtered record count, for the "Showing X of Y" summary. */
  filteredCount: number;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  /** id of the panel this button controls, for aria-controls. */
  panelId: string;
  /** Ref forwarded to the filter toggle button. */
  ref?: Ref<HTMLButtonElement>;
}

export default function MeetingsToolbar({
  records,
  filteredCount,
  filtersOpen,
  onToggleFilters,
  panelId,
  ref,
}: MeetingsToolbarProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        gap: SECTION_GAP,
        alignItems: { xs: "stretch", sm: "center" },
      }}
    >
      <FilterButton
        ref={ref}
        open={filtersOpen}
        onToggle={onToggleFilters}
        panelId={panelId}
      />
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          alignSelf: "center",
          textAlign: { xs: "center", sm: "left" },
          mr: { sm: "auto" },
        }}
      >
        Showing {filteredCount} of {records.length} meetings
      </Typography>
      <MeetingStats records={records} />
    </Box>
  );
}
