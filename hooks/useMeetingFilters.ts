"use client";

import { useMemo, useState } from "react";
import type { MeetingRecord } from "@/lib/scraper-data";
import { locationText, normalizeStatus } from "@/lib/meeting-utils";
import {
  buildDuplicateGroups,
  type DuplicateInfo,
} from "@/lib/duplicate-detection";

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

export const SEARCH_FIELD_OPTIONS = [
  { value: "all", label: "All" },
  { value: "title", label: "Title" },
  { value: "description", label: "Description" },
  { value: "time_notes", label: "Time Notes" },
  { value: "location", label: "Location" },
  { value: "source", label: "Source" },
] as const;

export type SearchField = (typeof SEARCH_FIELD_OPTIONS)[number]["value"];

const SEARCHABLE_FIELDS = [
  "title",
  "description",
  "classification",
  "all_day",
  "time_notes",
  "location",
  "links",
  "source",
  "status",
  "id",
] as const;

type SearchableField = (typeof SEARCHABLE_FIELDS)[number];
type SearchIndex = Record<SearchableField, string>;

export interface MeetingFiltersState {
  search: string;
  searchField: SearchField;
  statusFilter: string;
  linksFilter: LinksFilter;
  dateFrom: string;
  dateTo: string;
  setSearch: (value: string) => void;
  setSearchField: (value: SearchField) => void;
  setStatusFilter: (value: string) => void;
  setLinksFilter: (value: LinksFilter) => void;
  setDateFrom: (value: string) => void;
  setDateTo: (value: string) => void;
  clearDates: () => void;
  filteredRecords: MeetingRecord[];
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

function getLocationSearchValue(record: MeetingRecord): string {
  const name = record.location?.name?.trim() ?? "";
  const address = record.location?.address?.trim() ?? "";

  return [
    locationText(record),
    name ? "" : "No name",
    address ? "" : "No address",
  ]
    .filter(Boolean)
    .join(", ");
}

function getSearchValue(record: MeetingRecord, field: SearchableField): string {
  switch (field) {
    case "title":
      return record.title ?? "";
    case "description":
      return record.description ?? "";
    case "classification":
      return record.classification ?? "";
    case "all_day":
      return record.all_day ? "yes true" : "no false";
    case "time_notes":
      return record.time_notes ?? "";
    case "location":
      return getLocationSearchValue(record);
    case "links":
      return (record.links ?? [])
        .flatMap((link) => [link.title, link.href])
        .filter(Boolean)
        .join(" ");
    case "source":
      return record.source ?? "";
    case "status":
      return normalizeStatus(record.status);
    case "id":
      return record.id ?? "";
    default:
      return "";
  }
}

interface IndexedMeeting {
  record: MeetingRecord;
  values: SearchIndex;
}

function buildSearchIndex(record: MeetingRecord): IndexedMeeting {
  const values = {} as SearchIndex;

  for (const field of SEARCHABLE_FIELDS) {
    values[field] = getSearchValue(record, field).toLowerCase();
  }

  return { record, values };
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
  const [searchField, setSearchField] = useState<SearchField>("all");
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

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    let filtered = indexedRecords;

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
        return isWithinDateRange(record.start) || isWithinDateRange(record.end);
      });
    }

    if (query) {
      filtered = filtered.filter(({ record, values }) => {
        if (searchField === "all") {
          return SEARCHABLE_FIELDS.some((field) =>
            values[field].includes(query)
          );
        }

        if (searchField === "location") {
          return matchesLocationQuery(record, query);
        }

        return values[searchField].includes(query);
      });
    }

    return filtered.map(({ record }) => record);
  }, [
    indexedRecords,
    search,
    searchField,
    statusFilter,
    linksFilter,
    dateFrom,
    dateTo,
    duplicateSet,
  ]);

  return {
    search,
    searchField,
    statusFilter,
    linksFilter,
    dateFrom,
    dateTo,
    setSearch,
    setSearchField,
    setStatusFilter,
    setLinksFilter,
    setDateFrom,
    setDateTo,
    clearDates: () => {
      setDateFrom("");
      setDateTo("");
    },
    filteredRecords,
    duplicateInfoMap,
  };
}
