"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import type { GridColDef, GridRowSelectionModel } from "@mui/x-data-grid";
import type { MeetingRecord } from "@/lib/scraper-data";
import { LocationDisplay } from "@/components/ui/LocationDisplay";
import { locationText, normalizeStatus } from "@/lib/meeting-utils";
import { StatusChip } from "@/components/ui/StatusChip";
import {
  colorForDuplicateCount,
  type DuplicateInfo,
} from "@/lib/duplicate-detection";
import AppDataGrid from "@/components/scrapers/AppDataGrid";
import OverflowTooltip from "@/components/ui/OverflowTooltip";
import TruncatedText from "@/components/ui/TruncatedText";
import LinkWithTooltip from "@/components/ui/LinkWithTooltip";
import {
  useSelectedMeeting,
  useSetSelectedMeeting,
} from "@/contexts/MeetingSelectionContext";
import { useColumnVisibility } from "@/contexts/ColumnVisibilityContext";
import type { SearchField } from "@/hooks/useMeetingFilters";
import {
  DATE_TIME_MAX_LINES,
  MAX_TEXT_LINES,
  MAX_VISIBLE_LINKS,
} from "@/lib/ui-constants";

function TableText({
  value,
  wrap = false,
  maxLines,
}: {
  value: string | null | undefined;
  wrap?: boolean;
  maxLines?: number;
}) {
  const displayValue = value || "—";

  return (
    <OverflowTooltip
      title={displayValue}
      wrap={wrap}
      maxLines={maxLines}
      contentKey={displayValue}
    >
      {displayValue}
    </OverflowTooltip>
  );
}

export type SortKey =
  | "title"
  | "description"
  | "classification"
  | "start"
  | "end"
  | "all_day"
  | "time_notes"
  | "location"
  | "links"
  | "source"
  | "status"
  | "id";
export const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "title", label: "Title" },
  { key: "description", label: "Description" },
  { key: "classification", label: "Classification" },
  { key: "start", label: "Start" },
  { key: "end", label: "End" },
  { key: "all_day", label: "All Day" },
  { key: "time_notes", label: "Time Notes" },
  { key: "location", label: "Location" },
  { key: "links", label: "Links" },
  { key: "source", label: "Source" },
  { key: "status", label: "Status" },
  { key: "id", label: "ID" },
];

/** Returns the search text to highlight in a column, only when that column's field is the active search field. */
function getDataGridColumns(
  highlightFor: (field: SearchField) => string | undefined
): GridColDef[] {
  return [
    {
      field: "title",
      headerName: "Title",
      flex: 2,
      minWidth: 140,
      renderCell: ({ row }) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            width: "100%",
            minWidth: 0,
          }}
        >
          <TruncatedText
            text={row.title}
            wrap
            maxLines={MAX_TEXT_LINES}
            highlight={highlightFor("title")}
          />
          {row._isFirst && (
            <Chip
              label={`×${row._duplicateCount}`}
              size="small"
              color="warning"
              sx={{
                flexShrink: 0,
                height: 20,
                fontSize: "0.7rem",
                "& .MuiChip-label": { px: 0.75 },
              }}
            />
          )}
        </Box>
      ),
    },
    {
      field: "description",
      headerName: "Description",
      flex: 2.5,
      minWidth: 160,
      renderCell: ({ row }) => (
        <TruncatedText
          text={row.description}
          wrap
          maxLines={MAX_TEXT_LINES}
          highlight={highlightFor("description")}
        />
      ),
    },
    {
      field: "classification",
      headerName: "Classification",
      flex: 1,
      minWidth: 115,
      renderCell: ({ row }) => <TableText value={row.classification} />,
    },
    {
      field: "start",
      headerName: "Start",
      width: 105,
      renderCell: ({ row }) => (
        <TableText value={row.start} wrap maxLines={DATE_TIME_MAX_LINES} />
      ),
    },
    {
      field: "end",
      headerName: "End",
      width: 105,
      renderCell: ({ row }) => (
        <TableText value={row.end} wrap maxLines={DATE_TIME_MAX_LINES} />
      ),
    },
    {
      field: "all_day",
      headerName: "All Day",
      width: 80,
      renderCell: ({ row }) => <TableText value={row.all_day ? "Yes" : "No"} />,
    },
    {
      field: "time_notes",
      headerName: "Time Notes",
      flex: 1.5,
      minWidth: 120,
      renderCell: ({ row }) => (
        <TruncatedText
          text={row.time_notes}
          wrap
          maxLines={MAX_TEXT_LINES}
          highlight={highlightFor("time_notes")}
        />
      ),
    },
    {
      field: "location",
      headerName: "Location",
      width: 200,
      minWidth: 99,
      valueGetter: (_value: unknown, row: unknown) =>
        locationText(row as MeetingRecord),
      renderCell: ({ row }) => (
        <LocationDisplay
          record={row as MeetingRecord}
          highlight={highlightFor("location")}
        />
      ),
    },
    {
      field: "links",
      headerName: "Links",
      flex: 1.5,
      minWidth: 120,
      sortable: false,
      renderCell: ({ row }) => {
        const r = row as MeetingRecord;
        if (!r.links?.length) return "—";
        const visible = r.links.slice(0, MAX_VISIBLE_LINKS);
        const extra = r.links.length - MAX_VISIBLE_LINKS;
        return (
          <Box sx={{ width: "100%", minWidth: 0 }}>
            {visible.map((link, i) => (
              <Box
                key={i}
                sx={{
                  mb: i < visible.length - 1 ? 0.75 : 0,
                  width: "100%",
                  minWidth: 0,
                }}
              >
                <LinkWithTooltip href={link.href} label={link.title} />
              </Box>
            ))}
            {extra > 0 && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: "block" }}
              >
                +{extra} more link{extra > 1 ? "s" : ""}
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      field: "source",
      headerName: "Source",
      flex: 1.5,
      minWidth: 130,
      renderCell: ({ row }) =>
        row.source ? (
          <LinkWithTooltip href={row.source} label="Source Link" />
        ) : (
          "—"
        ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 105,
      valueGetter: (_value: unknown, row: unknown) =>
        normalizeStatus((row as MeetingRecord).status),
      renderCell: ({ value }) => <StatusChip status={value} />,
    },
    {
      field: "id",
      headerName: "ID",
      flex: 1,
      minWidth: 120,
      renderCell: ({ row }) => <TruncatedText text={row.id} />,
    },
  ];
}

function EmptyState() {
  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        color: "text.disabled",
        px: 2,
      }}
    >
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ textAlign: "center", maxWidth: "20rem" }}
      >
        No meetings match the current filters. Try adjusting your search or
        clearing a filter.
      </Typography>
    </Box>
  );
}

function NoColumnsOverlay() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
        p: 3,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        All columns are hidden.
      </Typography>
    </Box>
  );
}

// Marks the first record encountered for each duplicate group in the given
// display order (independent of where each record falls in the full,
// unfiltered dataset the grouping was computed from).
function markFirstInGroup(groupIndices: number[]): boolean[] {
  const seen = new Set<number>();
  return groupIndices.map((g) => {
    if (g < 0) return false;
    if (seen.has(g)) return false;
    seen.add(g);
    return true;
  });
}

export default function MeetingsTable({
  records,
  search,
  searchField,
  duplicateInfoMap,
}: {
  /** Records to display, already filtered upstream. */
  records: MeetingRecord[];
  /** Current search keyword, to highlight matches in the active search field's column. */
  search: string;
  /** Field the search keyword is being matched against. */
  searchField: SearchField;
  /** Per-record duplicate info computed from the full, unfiltered dataset. */
  duplicateInfoMap: Map<MeetingRecord, DuplicateInfo>;
}) {
  const { columnVisibilityModel } = useColumnVisibility();
  const selectedMeeting = useSelectedMeeting();
  const setSelectedMeeting = useSetSelectedMeeting();

  const perRecordInfo = useMemo(() => {
    const infos = records.map(
      (r) =>
        duplicateInfoMap.get(r) ?? {
          isDuplicate: false,
          isFirst: false,
          count: 1,
          groupIndex: -1,
        }
    );
    const isFirst = markFirstInGroup(infos.map((info) => info.groupIndex));
    return infos.map((info, i) => ({ ...info, isFirst: isFirst[i] }));
  }, [records, duplicateInfoMap]);

  const enrichedRows = useMemo(
    () =>
      records.map((r, i) => ({
        ...r,
        _idx: i,
        _isFirst: perRecordInfo[i].isFirst,
        _duplicateCount: perRecordInfo[i].count,
        _duplicateGroup: perRecordInfo[i].groupIndex,
      })),
    [records, perRecordInfo]
  );

  const selectedRowId = selectedMeeting
    ? enrichedRows.find((row) => row.id === selectedMeeting.id)?._idx
    : undefined;
  const rowSelectionModel = useMemo<GridRowSelectionModel>(
    () => ({
      type: "include",
      ids: selectedRowId === undefined ? new Set() : new Set([selectedRowId]),
    }),
    [selectedRowId]
  );

  // Generate CSS rules for each duplicate count that appears in the data
  const duplicateColorStyles = useMemo(() => {
    const counts = new Set(
      enrichedRows
        .filter((r) => r._duplicateGroup >= 0)
        .map((r) => r._duplicateCount)
    );
    return Object.fromEntries(
      [...counts].flatMap((count) => {
        const c = colorForDuplicateCount(count);
        return [
          [
            `& .MuiDataGrid-row.duplicate-count-${count}`,
            { backgroundColor: c.bg },
          ],
          [
            `& .MuiDataGrid-row.duplicate-count-${count}:hover`,
            { backgroundColor: `${c.bgHover} !important` },
          ],
        ];
      })
    );
  }, [enrichedRows]);

  const trimmedSearch = search.trim();
  const highlightFor = (field: SearchField) =>
    trimmedSearch && searchField === field ? trimmedSearch : undefined;

  const dataGridColumns = useMemo(
    () => getDataGridColumns(highlightFor),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trimmedSearch, searchField]
  );

  const handleRowClick = (row: MeetingRecord) => {
    setSelectedMeeting((prev) => (prev?.id === row.id ? null : row));
  };

  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <AppDataGrid
        rows={enrichedRows}
        getRowId={(row) => row._idx}
        columns={dataGridColumns}
        columnVisibilityModel={columnVisibilityModel}
        disableRowSelectionOnClick
        rowSelectionModel={rowSelectionModel}
        initialState={{
          sorting: {
            sortModel: [{ field: "start", sort: "asc" }],
          },
        }}
        slots={{
          noRowsOverlay: EmptyState,
          noColumnsOverlay: NoColumnsOverlay,
        }}
        getRowClassName={(params) => {
          const g = params.row._duplicateGroup;
          if (typeof g !== "number" || g < 0) return "";
          return `duplicate-count-${params.row._duplicateCount}`;
        }}
        onRowClick={(params) => handleRowClick(params.row as MeetingRecord)}
        aria-label="meetings table"
        sx={{
          "& .MuiDataGrid-row": { cursor: "pointer" },
          ...duplicateColorStyles,
        }}
      />
    </Box>
  );
}
