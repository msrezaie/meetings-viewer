"use client";

import dynamic from "next/dynamic";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import type { DataGridProps } from "@mui/x-data-grid";
import { dataGridPaginationSlotProps } from "@/components/scrapers/DataGridPagination";
import {
  DATAGRID_CELL_PADDING,
  DATAGRID_DEFAULT_PAGE_SIZE,
  DATAGRID_DENSITY,
  DATAGRID_PAGE_SIZE_OPTIONS,
  dataGridRowSx,
} from "@/lib/ui-constants";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then((mod) => mod.DataGrid),
  { ssr: false }
);

const DEFAULT_INITIAL_STATE: NonNullable<DataGridProps["initialState"]> = {
  pagination: {
    paginationModel: { pageSize: DATAGRID_DEFAULT_PAGE_SIZE },
  },
};

function mergeInitialState(
  initialState: DataGridProps["initialState"]
): NonNullable<DataGridProps["initialState"]> {
  return {
    ...DEFAULT_INITIAL_STATE,
    ...initialState,
    pagination: {
      ...DEFAULT_INITIAL_STATE.pagination,
      ...initialState?.pagination,
      paginationModel: {
        ...DEFAULT_INITIAL_STATE.pagination?.paginationModel,
        ...initialState?.pagination?.paginationModel,
      },
    },
  };
}

export default function AppDataGrid({
  autoHeight = true,
  disableColumnMenu = true,
  density = DATAGRID_DENSITY,
  getRowHeight = () => "auto",
  height,
  initialState,
  minHeight,
  pageSizeOptions = DATAGRID_PAGE_SIZE_OPTIONS,
  slotProps,
  sx,
  ...props
}: DataGridProps & {
  height?: number | string;
  minHeight?: number | string;
}) {
  const grid = (
    <DataGrid
      {...props}
      autoHeight={autoHeight}
      disableColumnMenu={disableColumnMenu}
      density={density}
      getRowHeight={getRowHeight}
      pageSizeOptions={pageSizeOptions}
      initialState={mergeInitialState(initialState)}
      slotProps={{
        ...slotProps,
        basePagination: dataGridPaginationSlotProps.basePagination,
      }}
      sx={[
        (theme) => ({
          border: "none",
          ...dataGridRowSx(),
          "& .MuiDataGrid-cell": {
            display: "flex",
            alignItems: "center",
            padding: `${theme.spacing(DATAGRID_CELL_PADDING)} !important`,
          },
          "& .MuiDataGrid-selectedRowCount": {
            whiteSpace: "nowrap",
          },
          "& .MuiTablePagination-toolbar": {
            containerType: "inline-size",
            "@container (max-width: 600px)": {
              "&::before": {
                content: '""',
                height: 0,
                flexBasis: "100%",
                order: 1,
              },
              "& .MuiTablePagination-actions": {
                order: 0,
              },
              "& .MuiTablePagination-selectLabel, & .MuiTablePagination-select, & .MuiTablePagination-displayedRows":
                {
                  order: 2,
                },
            },
          },
        }),
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    />
  );

  return (
    <Paper variant="outlined" sx={{ width: "100%", overflow: "hidden" }}>
      {height !== undefined || minHeight !== undefined ? (
        <Box
          sx={{
            height,
            minHeight,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {grid}
        </Box>
      ) : (
        grid
      )}
    </Paper>
  );
}
