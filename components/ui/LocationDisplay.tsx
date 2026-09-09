"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { MeetingRecord } from "@/lib/scraper-data";
import OverflowTooltip from "./OverflowTooltip";
import { highlightMatches } from "./HighlightMatches";
import { LOCATION_MAX_LINES } from "@/lib/ui-constants";

function LocationPart({
  value,
  fallback,
  highlight,
}: {
  value: string;
  fallback: string;
  highlight?: string;
}) {
  const content = value ? (
    highlightMatches([value], highlight ?? "")
  ) : (
    <Typography
      component="span"
      sx={{ color: "error.main", fontSize: "inherit" }}
    >
      {fallback}
    </Typography>
  );

  return (
    <OverflowTooltip
      title={value || fallback}
      wrap
      maxLines={LOCATION_MAX_LINES}
      contentKey={`${value}:${highlight ?? ""}`}
    >
      {content}
    </OverflowTooltip>
  );
}

export function LocationDisplay({
  record,
  highlight,
}: {
  record: MeetingRecord;
  /** Search keyword to highlight within the name/address text, if any. */
  highlight?: string;
}) {
  const name = record.location?.name?.trim() ?? "";
  const address = record.location?.address?.trim() ?? "";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        wordBreak: "break-word",
        width: "100%",
        overflow: "hidden",
      }}
    >
      <LocationPart value={name} fallback="No name" highlight={highlight} />
      <LocationPart
        value={address}
        fallback="No address"
        highlight={highlight}
      />
    </Box>
  );
}
