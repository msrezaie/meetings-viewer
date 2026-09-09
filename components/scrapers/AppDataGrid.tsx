"use client";

import dynamic from "next/dynamic";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Tooltip, { type TooltipProps } from "@mui/material/Tooltip";
import type { DataGridProps } from "@mui/x-data-grid";
import { dataGridPaginationSlotProps } from "@/components/scrapers/DataGridPagination";
import {
  DATAGRID_CELL_PADDING,
  DATAGRID_DEFAULT_PAGE_SIZE,
  DATAGRID_DENSITY,
  DATAGRID_PAGE_SIZE_OPTIONS,
  DATAGRID_ROW_MAX_HEIGHT,
  DATAGRID_ROW_MIN_HEIGHT,
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

function TopTooltip(props: TooltipProps) {
  return <Tooltip {...props} placement="top" />;
}

const DATA_GRID_ROW_SX = {
  "& .MuiDataGrid-row": {
    minHeight: `${DATAGRID_ROW_MIN_HEIGHT}px !important` as const,
    maxHeight: `${DATAGRID_ROW_MAX_HEIGHT}px !important` as const,
  },
};

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
  slots,
  sx,
  ...props
}: DataGridProps & {
  height?: number | string;
  minHeight?: number | string;
}) {
  const grid = (
    <DataGrid
      {...props}
      slots={{ ...slots, baseTooltip: TopTooltip }}
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
          ...DATA_GRID_ROW_SX,
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
