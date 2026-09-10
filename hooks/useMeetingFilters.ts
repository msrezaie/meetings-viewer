"use client";

import { useMemo, useState } from "react";
import type { MeetingRecord } from "@/lib/scraper-data";
import { normalizeStatus } from "@/lib/meeting-utils";
import {
  SEARCHABLE_COLUMNS,
  type SearchableColumnKey,
  type SearchScope,
} from "@/lib/meeting-columns";
import {
  buildDuplicateGroups,
  type DuplicateInfo,
} from "@/lib/duplicate-detection";

export { SEARCH_SCOPE_OPTIONS } from "@/lib/meeting-columns";
export type { SearchableColumnKey, SearchScope } from "@/lib/meeting-columns";

export const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "passed", label: "Passed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "tentative", label: "Tentative" },
  { value: "duplicates", label: "Duplicates" },
];

export const LINKS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "has-links", label: "Has links" },
  { value: "no-links", label: "No links" },
] as const;

export type LinksFilter = (typeof LINKS_OPTIONS)[number]["value"];

type SearchIndex = Record<SearchableColumnKey, string>;

export interface MeetingFiltersState {
  search: string;
  searchScope: SearchScope;
  statusFilter: string;
  linksFilter: LinksFilter;
  dateFrom: string;
  dateTo: string;
  setSearch: (value: string) => void;
  setSearchScope: (value: SearchScope) => void;
  setStatusFilter: (value: string) => void;
  setLinksFilter: (value: LinksFilter) => void;
  setDateFrom: (value: string) => void;
  setDateTo: (value: string) => void;
  clearDates: () => void;
  filteredRecords: MeetingRecord[];
  textMatchCount: number;
  matchingSearchColumns: SearchableColumnKey[];
  duplicateInfoMap: Map<MeetingRecord, DuplicateInfo>;
}

// Convert "YYYY-MM-DD" to Date object in local time
function parseLocalDate(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  const date = new Date(y, m - 1, d, 0, 0, 0, 0);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Owns the search / status / date-range filter state and applies it to the
 * given records. Lifted out of the table so the filter controls can live in
 * the FiltersPanel while the table only receives the filtered result.
 */

interface IndexedMeeting {
  record: MeetingRecord;
  values: SearchIndex;
}

function buildSearchIndex(record: MeetingRecord): IndexedMeeting {
  const values = {} as SearchIndex;

  for (const column of SEARCHABLE_COLUMNS) {
    values[column.key] = column.getSearchValue(record).toLowerCase();
  }

  return { record, values };
}

function countOccurrences(text: string, query: string): number {
  if (!query) return 0;

  let count = 0;
  let index = text.indexOf(query);
  while (index !== -1) {
    count += 1;
    index = text.indexOf(query, index + query.length);
  }
  return count;
}

function countSearchMatches(
  values: SearchIndex,
  scope: SearchScope,
  query: string
): number {
  if (scope === "all") {
    return SEARCHABLE_COLUMNS.reduce(
      (count, { key }) => count + countOccurrences(values[key], query),
      0
    );
  }

  return countOccurrences(values[scope], query);
}

// "no name" / "no address" to find records missing that part, in addition to
// normal substring matching against the actual name/address text.
function matchesLocationQuery(record: MeetingRecord, query: string): boolean {
  const name = record.location?.name?.trim() ?? "";
  const address = record.location?.address?.trim() ?? "";
  const isMissingName = name === "";
  const isMissingAddress = address === "";

  if (isMissingName && "no name".startsWith(query)) return true;
  if (isMissingAddress && "no address".startsWith(query)) return true;

  return [name, address]
    .filter(Boolean)
    .join(", ")
    .toLowerCase()
    .includes(query);
}

export function useMeetingFilters(
  records: MeetingRecord[]
): MeetingFiltersState {
  const [search, setSearch] = useState("");
  const [searchScope, setSearchScope] = useState<SearchScope>("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [linksFilter, setLinksFilter] = useState<LinksFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const duplicateInfoMap = useMemo(() => {
    const info = buildDuplicateGroups(records);
    return new Map(records.map((r, i) => [r, info[i]]));
  }, [records]);
  const duplicateSet = useMemo(
    () => new Set(records.filter((r) => duplicateInfoMap.get(r)!.isDuplicate)),
    [records, duplicateInfoMap]
  );
  const indexedRecords = useMemo(
    () => records.map(buildSearchIndex),
    [records]
  );

  const { filteredRecords, textMatchCount, matchingSearchColumns } =
    useMemo(() => {
      const query = search.trim().toLowerCase();
      let filtered = indexedRecords;
      let textMatchCount = 0;
      let matchingSearchColumns: SearchableColumnKey[] = [];

      if (statusFilter === "duplicates") {
        filtered = filtered.filter(({ record }) => duplicateSet.has(record));
      } else if (statusFilter !== "all") {
        filtered = filtered.filter(
          ({ record }) => normalizeStatus(record.status) === statusFilter
        );
      }

      if (linksFilter !== "all") {
        filtered = filtered.filter(({ record }) =>
          linksFilter === "has-links"
            ? (record.links?.length ?? 0) > 0
            : (record.links?.length ?? 0) === 0
        );
      }

      if (dateFrom || dateTo) {
        const from = parseLocalDate(dateFrom);
        const toDate = parseLocalDate(dateTo) ?? (from ? new Date(from) : null);
        if (toDate) toDate.setHours(23, 59, 59, 999);

        filtered = filtered.filter(({ record }) => {
          const isWithinDateRange = (dateStr: string | undefined) => {
            if (!dateStr) return false;
            const meetingDate = new Date(dateStr);
            if (isNaN(meetingDate.getTime())) return false;
            if (from && meetingDate < from) return false;
            if (toDate && meetingDate > toDate) return false;
            return true;
          };
          return (
            isWithinDateRange(record.start) || isWithinDateRange(record.end)
          );
        });
      }

      if (query) {
        filtered = filtered.filter(({ record, values }) => {
          if (searchScope === "all") {
            return SEARCHABLE_COLUMNS.some(({ key }) =>
              values[key].includes(query)
            );
          }

          if (searchScope === "location") {
            return matchesLocationQuery(record, query);
          }

          return values[searchScope].includes(query);
        });
        textMatchCount = filtered.reduce(
          (count, { values }) =>
            count + countSearchMatches(values, searchScope, query),
          0
        );
        matchingSearchColumns = SEARCHABLE_COLUMNS.filter(({ key }) =>
          filtered.some(({ values }) => values[key].includes(query))
        ).map(({ key }) => key);
      }

      return {
        filteredRecords: filtered.map(({ record }) => record),
        textMatchCount,
        matchingSearchColumns,
      };
    }, [
      indexedRecords,
      search,
      searchScope,
      statusFilter,
      linksFilter,
      dateFrom,
      dateTo,
      duplicateSet,
    ]);

  return {
    search,
    searchScope,
    statusFilter,
    linksFilter,
    dateFrom,
    dateTo,
    setSearch,
    setSearchScope,
    setStatusFilter,
    setLinksFilter,
    setDateFrom,
    setDateTo,
    clearDates: () => {
      setDateFrom("");
      setDateTo("");
    },
    filteredRecords,
    textMatchCount,
    matchingSearchColumns,
    duplicateInfoMap,
  };
}
