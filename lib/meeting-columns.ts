import type { MeetingRecord } from "@/lib/scraper-data";
import { locationText, normalizeStatus } from "@/lib/meeting-utils";

type MeetingColumnDefinition = {
  key: string;
  label: string;
  searchable: boolean;
  searchScope?: boolean;
  getSearchValue: (record: MeetingRecord) => string;
  defaultVisible: boolean;
};

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

export const MEETING_COLUMNS = [
  {
    key: "title",
    label: "Title",
    searchable: true,
    searchScope: true,
    getSearchValue: (record) => record.title ?? "",
    defaultVisible: true,
  },
  {
    key: "description",
    label: "Description",
    searchable: true,
    searchScope: true,
    getSearchValue: (record) => record.description ?? "",
    defaultVisible: true,
  },
  {
    key: "classification",
    label: "Classification",
    searchable: true,
    getSearchValue: (record) => record.classification ?? "",
    defaultVisible: false,
  },
  {
    key: "start",
    label: "Start",
    searchable: false,
    getSearchValue: (record) => record.start ?? "",
    defaultVisible: true,
  },
  {
    key: "end",
    label: "End",
    searchable: false,
    getSearchValue: (record) => record.end ?? "",
    defaultVisible: true,
  },
  {
    key: "all_day",
    label: "All Day",
    searchable: true,
    getSearchValue: (record) => (record.all_day ? "yes true" : "no false"),
    defaultVisible: false,
  },
  {
    key: "time_notes",
    label: "Time Notes",
    searchable: true,
    searchScope: true,
    getSearchValue: (record) => record.time_notes ?? "",
    defaultVisible: false,
  },
  {
    key: "location",
    label: "Location",
    searchable: true,
    searchScope: true,
    getSearchValue: getLocationSearchValue,
    defaultVisible: true,
  },
  {
    key: "links",
    label: "Links",
    searchable: true,
    getSearchValue: (record) =>
      (record.links ?? [])
        .flatMap((link) => [link.title, link.href])
        .filter(Boolean)
        .join(" "),
    defaultVisible: true,
  },
  {
    key: "source",
    label: "Source",
    searchable: true,
    searchScope: true,
    getSearchValue: (record) => record.source ?? "",
    defaultVisible: false,
  },
  {
    key: "status",
    label: "Status",
    searchable: true,
    getSearchValue: (record) => normalizeStatus(record.status),
    defaultVisible: true,
  },
  {
    key: "id",
    label: "ID",
    searchable: true,
    getSearchValue: (record) => record.id ?? "",
    defaultVisible: false,
  },
] as const satisfies readonly MeetingColumnDefinition[];

type MeetingColumn = (typeof MEETING_COLUMNS)[number];
type SearchableColumn = Extract<MeetingColumn, { searchable: true }>;
type SearchScopeColumn = Extract<MeetingColumn, { searchScope: true }>;

export type MeetingColumnKey = MeetingColumn["key"];
export type SearchableColumnKey = SearchableColumn["key"];
export type SearchScope = "all" | SearchScopeColumn["key"];

export const SEARCHABLE_COLUMNS = MEETING_COLUMNS.filter(
  (column): column is SearchableColumn => column.searchable
);

const SEARCH_SCOPE_COLUMNS = MEETING_COLUMNS.filter(
  (column): column is SearchScopeColumn =>
    "searchScope" in column && column.searchScope === true
);

export const SEARCH_SCOPE_OPTIONS = [
  { value: "all", label: "All" },
  ...SEARCH_SCOPE_COLUMNS.map(({ key, label }) => ({ value: key, label })),
] as const;
