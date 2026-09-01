import { useState } from "react";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { highlightMatches } from "./HighlightMatches";
import { linkifyText } from "./Linkify";
import { TOOLTIP_ENTER_DELAY } from "@/lib/ui-constants";

interface TruncatedTextProps {
  text: string | null | undefined;
  wrap?: boolean;
  maxLines?: number;
  /** Search keyword to highlight within the rendered text, if any. */
  highlight?: string;
}

export default function TruncatedText({
  text,
  wrap = false,
  maxLines,
  highlight,
}: TruncatedTextProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    setShowTooltip(el.scrollHeight > el.clientHeight);
  };

  if (!text) return <>—</>;

  const renderedText = highlightMatches(linkifyText(text), highlight ?? "");

  const tooltipTitle = (
    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", maxWidth: 320 }}>
      {renderedText}
    </Typography>
  );

  if (wrap) {
    return (
      <Tooltip
        title={tooltipTitle}
        placement="top"
        arrow
        enterDelay={TOOLTIP_ENTER_DELAY}
        open={showTooltip}
        onClose={() => setShowTooltip(false)}
        slotProps={TOOLTIP_SLOT_PROPS}
      >
        <Box
          onMouseEnter={handleMouseEnter}
          sx={{
            whiteSpace: "normal",
            wordBreak: "break-word",
            width: "100%",
            ...(maxLines && {
              display: "-webkit-box",
              WebkitLineClamp: maxLines,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }),
          }}
        >
          {renderedText}
        </Box>
      </Tooltip>
    );
  }

  return (
    <Tooltip
      title={tooltipTitle}
      placement="top"
      arrow
      enterDelay={TOOLTIP_ENTER_DELAY}
      open={showTooltip}
      onClose={() => setShowTooltip(false)}
      slotProps={TOOLTIP_SLOT_PROPS}
    >
      <Box
        component="span"
        onMouseEnter={handleMouseEnter}
        sx={{
          display: "block",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {renderedText}
      </Box>
    </Tooltip>
  );
}

const TOOLTIP_SLOT_PROPS = {
  tooltip: {
    sx: {
      bgcolor: "background.paper",
      color: "text.primary",
      boxShadow: 3,
      border: "1px solid",
      borderColor: "divider",
      p: 1.5,
    },
  },
  arrow: {
    sx: {
      color: "background.paper",
      "&::before": {
        border: "1px solid",
        borderColor: "divider",
      },
    },
  },
};
