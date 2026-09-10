import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { ReactNode } from "react";
import { highlightMatches } from "@/components/ui/HighlightMatches";
import type { LinkCheckResult } from "@/lib/link-status";
import { TOOLTIP_ENTER_DELAY } from "@/lib/ui-constants";

interface LinkWithTooltipProps {
  href: string;
  label?: ReactNode;
  highlight?: string;
  linkStatus?: LinkCheckResult;
  onCheck?: () => void;
  maxWidth?: number | string;
}

function getStatusBadge(status?: LinkCheckResult) {
  if (!status) {
    return {
      label: "Check",
      color: "default" as const,
      title: "Check link status",
    };
  }
  if (status.state === "checking") {
    return { label: "...", color: "default" as const, title: "Checking link" };
  }
  if (status.state === "ok") {
    return {
      label: String(status.status ?? 200),
      color: "success" as const,
      title: "Link returned 200",
    };
  }
  if (status.state === "not-found") {
    return {
      label: String(status.status ?? 404),
      color: "error" as const,
      title: "Link returned 404",
    };
  }
  if (status.state === "http-error") {
    return {
      label: String(status.status ?? "Error"),
      color: "warning" as const,
      title: `Link returned ${status.status ?? "an HTTP error"}`,
    };
  }
  return {
    label: "Error",
    color: "warning" as const,
    title: status.message ?? "Link check failed",
  };
}

export default function LinkWithTooltip({
  href,
  label,
  highlight,
  linkStatus,
  onCheck,
  maxWidth = "100%",
}: LinkWithTooltipProps) {
  const displayLabel: ReactNode = label || (
    <Typography
      component="span"
      sx={{ color: "error.main", fontSize: "inherit" }}
    >
      No title
    </Typography>
  );
  const renderedLabel =
    typeof label === "string"
      ? highlightMatches([label], highlight ?? "")
      : displayLabel;
  const renderedHref = highlightMatches([href], highlight ?? "");
  const statusBadge = onCheck ? getStatusBadge(linkStatus) : null;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        width: "100%",
        minWidth: 0,
      }}
    >
      <Tooltip
        title={
          <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
            {renderedHref}
          </Typography>
        }
        placement="right"
        disableInteractive
        enterDelay={TOOLTIP_ENTER_DELAY}
        slotProps={{
          popper: {
            modifiers: [
              {
                name: "offset",
                options: {
                  offset: [0, -3],
                },
              },
            ],
          },
          tooltip: {
            sx: {
              bgcolor: "background.paper",
              color: "text.primary",
              boxShadow: 3,
              border: "1px solid",
              borderColor: "divider",
              p: 0.5,
              maxWidth: "none",
              width: "fit-content",
            },
          },
        }}
      >
        <Box
          component="a"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            display: "block",
            flex: 1,
            minWidth: 0,
            color: "primary.main",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth,
            verticalAlign: "top",
          }}
        >
          {renderedLabel}
        </Box>
      </Tooltip>
      {statusBadge && (
        <Tooltip title={statusBadge.title} placement="top" disableInteractive>
          <Chip
            clickable
            label={statusBadge.label}
            size="small"
            color={statusBadge.color}
            variant="outlined"
            disabled={linkStatus?.state === "checking"}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onCheck?.();
            }}
            sx={{
              height: 20,
              flexShrink: 0,
              fontSize: "0.65rem",
              "& .MuiChip-label": { px: 0.75 },
            }}
          />
        </Tooltip>
      )}
    </Box>
  );
}
