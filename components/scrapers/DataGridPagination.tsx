import Pagination from "@mui/material/Pagination";
import type { TablePaginationProps } from "@mui/material/TablePagination";
import {
  gridPageCountSelector,
  useGridApiContext,
  useGridSelector,
} from "@mui/x-data-grid";

/** Replaces TablePagination's default prev/next arrows with numbered page buttons. */
function PageActions({
  page,
  onPageChange,
  className,
}: Pick<TablePaginationProps, "page" | "onPageChange" | "className">) {
  const apiRef = useGridApiContext();
  const pageCount = useGridSelector(apiRef, gridPageCountSelector);
  if (pageCount <= 1) return null;

  return (
    <Pagination
      className={className}
      color="primary"
      size="small"
      count={pageCount}
      page={page + 1}
      onChange={(_, value) => onPageChange(null, value - 1)}
      showFirstButton
      showLastButton
      siblingCount={1}
      sx={{
        "& .MuiPagination-ul": { justifyContent: "flex-end", rowGap: 0.5 },
      }}
    />
  );
}

/**
 * Pass to DataGrid's `slotProps` to swap the default footer's prev/next
 * arrows for numbered page buttons (MUI's documented recipe: reuse the
 * built-in GridPagination/TablePagination and only override ActionsComponent
 * rather than reimplementing the footer). Also makes it wrap onto its own
 * line on narrow screens instead of overflowing.
 */
export const dataGridPaginationSlotProps = {
  basePagination: {
    material: {
      ActionsComponent: PageActions,
      sx: {
        width: "100%",
        "& .MuiTablePagination-toolbar": {
          flexWrap: "wrap",
          justifyContent: { xs: "center", sm: "flex-end" },
          rowGap: 1,
          columnGap: 2,
          p: 2,
          "&::before": {
            content: '""',
            height: 0,
            "@media (max-width:600px)": { flexBasis: "100%", order: 1 },
          },
        },
        "& .MuiTablePagination-spacer": { display: "none" },
        // MUI hides rows-per-page controls below 600px; force visible.
        // Zero margins so columnGap controls spacing uniformly.
        // On xs, wrap rows-per-page + displayed rows to line 2 (below arrows).
        "& .MuiTablePagination-selectLabel": {
          display: "block",
          margin: 0,
          "@media (max-width:600px)": { order: 2 },
        },
        "& .MuiTablePagination-select": {
          display: "inline-flex",
          margin: 0,
          "@media (max-width:600px)": { order: 2 },
        },
        "& .MuiTablePagination-displayedRows": {
          margin: 0,
          "@media (max-width:600px)": { order: 2 },
        },
        "& .MuiTablePagination-toolbar .MuiTablePagination-actions": {
          margin: 0,
        },
      },
    },
  },
};
