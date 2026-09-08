"use client";

import dynamic from "next/dynamic";
import type { GridColDef } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then((mod) => mod.DataGrid),
  { ssr: false }
);
import MuiLink from "@mui/material/Link";
import NextLink from "@/components/ui/NextLink";
import type { SpiderEntry } from "@/lib/scraper-data";
import { dataGridPaginationSlotProps } from "@/components/scrapers/DataGridPagination";
import TruncatedText from "@/components/ui/TruncatedText";
import {
  MAX_TEXT_LINES,
  DATAGRID_PAGE_SIZE_OPTIONS,
  DATAGRID_DEFAULT_PAGE_SIZE,
  DATAGRID_DENSITY,
  DATAGRID_CELL_PADDING,
  dataGridRowSx,
} from "@/lib/ui-constants";

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
    <Paper variant="outlined">
      <DataGrid
        rows={rows}
        columns={columns}
        disableColumnMenu
        autoHeight
        getRowHeight={() => "auto"}
        density={DATAGRID_DENSITY}
        pageSizeOptions={DATAGRID_PAGE_SIZE_OPTIONS}
        initialState={{
          pagination: {
            paginationModel: { pageSize: DATAGRID_DEFAULT_PAGE_SIZE },
          },
        }}
        slotProps={dataGridPaginationSlotProps}
        aria-label="scrapers table"
        sx={(theme) => ({
          border: "none",
          ...dataGridRowSx(),
          "& .MuiDataGrid-cell": {
            display: "flex",
            alignItems: "center",
            padding: `${theme.spacing(DATAGRID_CELL_PADDING)} !important`,
          },
        })}
      />
    </Paper>
  );
}
