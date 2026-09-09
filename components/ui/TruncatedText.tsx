import { useEffect, useRef, useState } from "react";
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

const TOOLTIP_MAX_WIDTH = 320;

function hasOverflow(element: HTMLElement): boolean {
  return (
    element.scrollHeight > element.clientHeight ||
    element.scrollWidth > element.clientWidth
  );
}

export default function TruncatedText({
  text,
  wrap = false,
  maxLines,
  highlight,
}: TruncatedTextProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const contentRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    const updateOverflow = () => setIsOverflowing(hasOverflow(element));
    updateOverflow();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updateOverflow);
    observer.observe(element);
    return () => observer.disconnect();
  }, [highlight, maxLines, text, wrap]);

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    const overflow = hasOverflow(e.currentTarget);
    setIsOverflowing(overflow);
    setShowTooltip(overflow);
  };

  if (!text) return <>—</>;

  const renderedText = highlightMatches(linkifyText(text), highlight ?? "");

  const tooltipTitle = (
    <Typography
      variant="body2"
      sx={{
        whiteSpace: "pre-wrap",
        maxWidth: TOOLTIP_MAX_WIDTH,
      }}
    >
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
          ref={contentRef}
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
            ...(isOverflowing && OVERFLOW_TEXT_SX),
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
        ref={contentRef}
        component="span"
        onMouseEnter={handleMouseEnter}
        sx={{
          display: "block",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          ...(isOverflowing && OVERFLOW_TEXT_SX),
        }}
      >
        {renderedText}
      </Box>
    </Tooltip>
  );
}

const OVERFLOW_TEXT_SX = {
  textDecoration: "underline dashed",
  textUnderlineOffset: "0.25rem",
  textDecorationThickness: "1px",
};

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
