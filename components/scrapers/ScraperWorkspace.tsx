"use client";

import { useCallback, useRef, useState } from "react";
import Box from "@mui/material/Box";
import type { MeetingRecord } from "@/lib/scraper-data";
import MeetingsToolbar from "@/components/scrapers/MeetingsToolbar";
import FiltersPanel from "@/components/scrapers/FiltersPanel";
import MeetingFilters from "@/components/scrapers/MeetingFilters";
import MeetingsLayout from "@/components/scrapers/MeetingsLayout";
import { useMeetingFilters } from "@/hooks/useMeetingFilters";
import { SECTION_GAP } from "@/lib/ui-constants";
import { ColumnVisibilityProvider } from "@/contexts/ColumnVisibilityContext";

const FILTERS_PANEL_ID = "meetings-filters-panel";

export default function ScraperWorkspace({
  records,
}: {
  records: MeetingRecord[];
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const filters = useMeetingFilters(records);
  const openFiltersPanel = useCallback(() => setFiltersOpen(true), []);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: SECTION_GAP }}>
      <MeetingsToolbar
        ref={filterButtonRef}
        records={records}
        filteredCount={filters.filteredRecords.length}
        filtersOpen={filtersOpen}
        onToggleFilters={() => setFiltersOpen((open) => !open)}
        panelId={FILTERS_PANEL_ID}
      />

      <ColumnVisibilityProvider onOpenFilters={openFiltersPanel}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: filtersOpen ? SECTION_GAP : 0,
            alignItems: { xs: "stretch", sm: "flex-start" },
          }}
        >
          <FiltersPanel
            id={FILTERS_PANEL_ID}
            open={filtersOpen}
            onClose={() => setFiltersOpen(false)}
            triggerRef={filterButtonRef}
          >
            <MeetingFilters filters={filters} open={filtersOpen} />
          </FiltersPanel>

          {/* Only this region is pushed when the panel opens. */}
          <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>
            <MeetingsLayout
              records={filters.filteredRecords}
              search={filters.search}
              searchScope={filters.searchScope}
              duplicateInfoMap={filters.duplicateInfoMap}
            />
          </Box>
        </Box>
      </ColumnVisibilityProvider>
    </Box>
  );
}
