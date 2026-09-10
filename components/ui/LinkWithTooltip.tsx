import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { ReactNode } from "react";
import { highlightMatches } from "@/components/ui/HighlightMatches";
import { TOOLTIP_ENTER_DELAY } from "@/lib/ui-constants";

interface LinkWithTooltipProps {
  href: string;
  label?: ReactNode;
  highlight?: string;
  maxWidth?: number | string;
}

export default function LinkWithTooltip({
  href,
  label,
  highlight,
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

  return (
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
          width: "100%",
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
  );
}
