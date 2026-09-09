/* --- Shared spacing constants --- */

/* Padding from screen edges. Used as
 * p on site header, footer, and viewer layout,
 * px on landing sections. */
export const PAGE_PADDING = 2;

/* Spacing between the major blocks that compose a page
 * (toolbar, filter, table, detail, and page header).
 */
export const SECTION_GAP = 2;

/* MUI spacing units for the height shared by compact toolbar controls. */
export const COMPACT_CONTROL_HEIGHT = 4;

/* MUI spacing units for uniform DataGrid cell padding on all sides. */
export const DATAGRID_CELL_PADDING = 2;

/* --- Shared text and tooltip behavior --- */

/* Hover delay (ms) before tooltips appear on truncated text and links. */
export const TOOLTIP_ENTER_DELAY = 200;

/* Max width for the full text shown in truncated-text tooltips. */
export const TRUNCATED_TEXT_TOOLTIP_MAX_WIDTH = 320;

/* Max lines before a table cell's text is clamped with an ellipsis. */
export const MAX_TEXT_LINES = 4;

/* Max lines for each location name or address in the meetings table. */
export const LOCATION_MAX_LINES = 2;

/* --- Shared panel dimensions --- */

export const FILTERS_PANEL_WIDTH = 300;
export const DETAIL_PANEL_WIDTH = 340;
export const NAV_DRAWER_WIDTH = 280;

/* --- Timing constants --- */

/* Open/close animation duration for the filters panel (ms). */
export const FILTERS_TRANSITION_MS = 150;

/* --- Table behavior --- */

/* Max links shown in the Links column before collapsing to "+N more". */
export const MAX_VISIBLE_LINKS = 3;

/* --- Shared by meetings and scrapers tables --- */

export const DATAGRID_PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
export const DATAGRID_DEFAULT_PAGE_SIZE = 25;
export const DATAGRID_DENSITY = "compact" as const;

/* Row height bounds (px). Cells taller than max trigger truncation. */
export const DATAGRID_ROW_MIN_HEIGHT = 52;
export const DATAGRID_ROW_MAX_HEIGHT = 96;

/* Shared sx for DataGrid row height enforcement. Pass extra row
 * properties (e.g. { cursor: "pointer" }) to extend without losing defaults. */
export function dataGridRowSx(extra: Record<string, unknown> = {}) {
  return {
    "& .MuiDataGrid-row": {
      minHeight: `${DATAGRID_ROW_MIN_HEIGHT}px !important` as const,
      maxHeight: `${DATAGRID_ROW_MAX_HEIGHT}px !important` as const,
      ...extra,
    },
  };
}
