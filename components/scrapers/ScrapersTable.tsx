"use client";

import type { GridColDef } from "@mui/x-data-grid";
import MuiLink from "@mui/material/Link";
import NextLink from "@/components/ui/NextLink";
import type { SpiderEntry } from "@/lib/scraper-data";
import AppDataGrid from "@/components/scrapers/AppDataGrid";
import OverflowTooltip from "@/components/ui/OverflowTooltip";
import TruncatedText from "@/components/ui/TruncatedText";
import { MAX_TEXT_LINES } from "@/lib/ui-constants";

const PLACEHOLDER = "—";

function placeholderValue(value?: string) {
  return value && value.length > 0 ? value : PLACEHOLDER;
}

function TableText({ value }: { value?: string }) {
  const displayValue = placeholderValue(value);

  return (
    <OverflowTooltip title={displayValue} contentKey={displayValue}>
      {displayValue}
    </OverflowTooltip>
  );
}

const columns: GridColDef[] = [
  {
    field: "slug",
    headerName: "Slug / Spider Name",
    flex: 1.5,
    minWidth: 160,
    renderCell: ({ value }) => {
      const displayValue = String(value ?? PLACEHOLDER);
      return (
        <OverflowTooltip
          title={displayValue}
          wrap
          maxLines={MAX_TEXT_LINES}
          contentKey={displayValue}
        >
          <MuiLink
            component={NextLink}
            href={`/scrapers/${value}`}
            underline="hover"
          >
            {displayValue}
          </MuiLink>
        </OverflowTooltip>
      );
    },
  },
  {
    field: "agency",
    headerName: "Agency",
    flex: 2,
    minWidth: 200,
    renderCell: ({ value }) => (
      <TruncatedText text={value} wrap maxLines={MAX_TEXT_LINES} />
    ),
  },
  {
    field: "last_run_status",
    headerName: "Status",
    width: 110,
    valueFormatter: (value?: string) => placeholderValue(value),
    renderCell: ({ value }) => <TableText value={value} />,
  },
  {
    field: "last_run",
    headerName: "Last Run",
    width: 170,
    valueFormatter: (value?: string) => placeholderValue(value),
    renderCell: ({ value }) => <TableText value={value} />,
  },
];

export default function ScrapersTable({ spiders }: { spiders: SpiderEntry[] }) {
  const rows = spiders.map((spider) => ({ id: spider.slug, ...spider }));

  return (
    <AppDataGrid rows={rows} columns={columns} aria-label="scrapers table" />
  );
}
