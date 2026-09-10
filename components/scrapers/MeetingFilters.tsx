"use client";

import { useEffect, useRef, useState } from "react";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import DateRangeFilter from "@/components/scrapers/DateRangeFilter";
import ColumnVisibilityFilter from "@/components/scrapers/ColumnVisibilityFilter";
import { FILTERS_TRANSITION_MS } from "@/lib/ui-constants";
import {
  LINKS_OPTIONS,
  SEARCH_FIELD_OPTIONS,
  STATUS_OPTIONS,
  type LinksFilter,
  type MeetingFiltersState,
  type SearchField,
} from "@/hooks/useMeetingFilters";
import { useColumnVisibility } from "@/contexts/ColumnVisibilityContext";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import { ClearIcon } from "@mui/x-date-pickers/icons";

function FilterSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Stack spacing={1}>
      <Typography
        component="h3"
        variant="caption"
        sx={{
          fontWeight: 700,
          letterSpacing: 0.5,
          textTransform: "uppercase",
          color: "text.secondary",
        }}
      >
        {label}
      </Typography>
      {children}
    </Stack>
  );
}

/**
 * The filter controls (search, date range, status) rendered inside the
 * FiltersPanel. State lives in useMeetingFilters, owned by the workspace.
 */
export default function MeetingFilters({
  filters,
  open,
}: {
  filters: MeetingFiltersState;

  open: boolean;
}) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autoRevealedFieldsRef = useRef(new Set<string>());
  const [revealSearchKey, setRevealSearchKey] = useState("");
  const [revealEnabled, setRevealEnabled] = useState(false);
  const { columnVisibilityModel, applyVisibilityModel } = useColumnVisibility();

  useEffect(() => {
    if (open) {
      // Small delay lets the panel's open transition/layout settle first,
      // so focusing doesn't fight the width/opacity animation.
      const timer = setTimeout(
        () => searchInputRef.current?.focus(),
        FILTERS_TRANSITION_MS
      );
      return () => clearTimeout(timer);
    }
  }, [open]);

  const searchQuery = filters.search.trim().toLowerCase();
  const hasSearch = searchQuery.length > 0;
  const searchKey = `${filters.searchField}:${searchQuery}`;
  const hasRevealStateForSearch = hasSearch && revealSearchKey === searchKey;
  const revealMatchingColumns = hasRevealStateForSearch && revealEnabled;
  const hasHiddenMatchingColumns = filters.matchingSearchFields.some(
    (field) => columnVisibilityModel[field] === false
  );
  const showRevealMatchingColumns =
    hasSearch && (hasHiddenMatchingColumns || hasRevealStateForSearch);

  useEffect(() => {
    const fieldsToReveal = new Set<string>();
    if (revealMatchingColumns) {
      for (const field of filters.matchingSearchFields) {
        if (
          columnVisibilityModel[field] === false ||
          autoRevealedFieldsRef.current.has(field)
        ) {
          fieldsToReveal.add(field);
        }
      }
    }

    const nextModel = { ...columnVisibilityModel };
    let changed = false;

    for (const field of autoRevealedFieldsRef.current) {
      if (!fieldsToReveal.has(field) && nextModel[field] !== false) {
        nextModel[field] = false;
        changed = true;
      }
    }

    for (const field of fieldsToReveal) {
      if (nextModel[field] === false) {
        nextModel[field] = true;
        changed = true;
      }
    }

    autoRevealedFieldsRef.current = fieldsToReveal;
    if (changed) applyVisibilityModel(nextModel);
  }, [
    applyVisibilityModel,
    columnVisibilityModel,
    filters.matchingSearchFields,
    revealMatchingColumns,
  ]);

  return (
    <Stack spacing={2.5} sx={{ pt: 0.5 }}>
      <Stack spacing={1.5}>
        <FilterSection label="Search">
          <TextField
            label="Search"
            size="small"
            fullWidth
            value={filters.search}
            onChange={(event) => {
              const value = event.target.value;
              if (!value.trim()) {
                setRevealSearchKey("");
                setRevealEnabled(false);
              }
              filters.setSearch(value);
            }}
            inputRef={searchInputRef}
            slotProps={{
              input: {
                endAdornment: filters.search && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      aria-label="Clear search"
                      onClick={() => {
                        setRevealSearchKey("");
                        setRevealEnabled(false);
                        filters.setSearch("");
                      }}
                      edge="end"
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          {hasSearch && (
            <Typography
              variant="caption"
              color="text.secondary"
              aria-live="polite"
            >
              {filters.textMatchCount}{" "}
              {filters.textMatchCount === 1 ? "text match" : "text matches"}
            </Typography>
          )}
          {showRevealMatchingColumns && (
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={revealMatchingColumns}
                  onChange={(event) => {
                    if (event.target.checked) {
                      setRevealSearchKey(searchKey);
                      setRevealEnabled(true);
                    } else {
                      setRevealEnabled(false);
                    }
                  }}
                />
              }
              label={
                <Typography variant="caption">
                  Reveal matching columns
                </Typography>
              }
            />
          )}
        </FilterSection>

        <TextField
          size="small"
          label="By"
          select
          fullWidth
          value={filters.searchField}
          onChange={(e) =>
            filters.setSearchField(e.target.value as SearchField)
          }
        >
          {SEARCH_FIELD_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <FilterSection label="Status">
        <TextField
          size="small"
          select
          fullWidth
          value={filters.statusFilter}
          onChange={(e) => filters.setStatusFilter(e.target.value)}
          slotProps={{
            select: { "aria-label": "Status" },
            input: {
              endAdornment: filters.statusFilter !== "all" && (
                <InputAdornment position="end" sx={{ mr: 2 }}>
                  <IconButton
                    size="small"
                    aria-label="Reset status to All"
                    onClick={() => filters.setStatusFilter("all")}
                    edge="end"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        >
          {STATUS_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </FilterSection>

      <FilterSection label="Links">
        <TextField
          size="small"
          select
          fullWidth
          value={filters.linksFilter}
          onChange={(e) =>
            filters.setLinksFilter(e.target.value as LinksFilter)
          }
          slotProps={{
            select: { "aria-label": "Links" },
            input: {
              endAdornment: filters.linksFilter !== "all" && (
                <InputAdornment position="end" sx={{ mr: 2 }}>
                  <IconButton
                    size="small"
                    aria-label="Reset links to All"
                    onClick={() => filters.setLinksFilter("all")}
                    edge="end"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        >
          {LINKS_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </FilterSection>

      <FilterSection label="Date range">
        <DateRangeFilter
          dateFrom={filters.dateFrom}
          dateTo={filters.dateTo}
          onDateFromChange={filters.setDateFrom}
          onDateToChange={filters.setDateTo}
          onClear={filters.clearDates}
        />
      </FilterSection>

      <FilterSection label="Manage columns">
        <ColumnVisibilityFilter />
      </FilterSection>
    </Stack>
  );
}
