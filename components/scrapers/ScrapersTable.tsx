"use client";

import type { GridColDef } from "@mui/x-data-grid";
import Box from "@mui/material/Box";
import MuiLink from "@mui/material/Link";
import NextLink from "@/components/ui/NextLink";
import type { SpiderEntry } from "@/lib/scraper-data";
import AppDataGrid from "@/components/scrapers/AppDataGrid";
import TruncatedText from "@/components/ui/TruncatedText";
import { MAX_TEXT_LINES } from "@/lib/ui-constants";

const PLACEHOLDER = "—";

function placeholderValue(value?: string) {
  return value && value.length > 0 ? value : PLACEHOLDER;
}

const columns: GridColDef[] = [
  {
    field: "slug",
    headerName: "Slug / Spider Name",
    flex: 1.5,
    minWidth: 160,
    renderCell: ({ value }) => (
      <Box
        sx={{ whiteSpace: "normal", wordBreak: "break-word", width: "100%" }}
      >
        <MuiLink
          component={NextLink}
          href={`/scrapers/${value}`}
          underline="hover"
        >
          {value}
        </MuiLink>
      </Box>
    ),
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
  },
  {
    field: "last_run",
    headerName: "Last Run",
    width: 170,
    valueFormatter: (value?: string) => placeholderValue(value),
  },
];

export default function ScrapersTable({ spiders }: { spiders: SpiderEntry[] }) {
  const rows = spiders.map((spider) => ({ id: spider.slug, ...spider }));

  return (
    <AppDataGrid rows={rows} columns={columns} aria-label="scrapers table" />
  );
}
