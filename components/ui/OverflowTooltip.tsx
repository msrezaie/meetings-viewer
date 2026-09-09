"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import type { BoxProps } from "@mui/material/Box";
import {
  TOOLTIP_CONTENT_MAX_WIDTH,
  TOOLTIP_ENTER_DELAY,
} from "@/lib/ui-constants";

interface OverflowTooltipProps {
  children: ReactNode;
  title: ReactNode;
  wrap?: boolean;
  maxLines?: number;
  contentKey?: unknown;
  component?: BoxProps["component"];
}

function hasOverflow(element: HTMLElement): boolean {
  return (
    element.scrollHeight > element.clientHeight ||
    element.scrollWidth > element.clientWidth
  );
}

export default function OverflowTooltip({
  children,
  title,
  wrap = false,
  maxLines,
  contentKey,
  component = "div",
}: OverflowTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const contentRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    const updateOverflow = () => {
      const overflow = hasOverflow(element);
      setIsOverflowing(overflow);
      setShowTooltip((open) => open && overflow);
    };
    updateOverflow();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updateOverflow);
    observer.observe(element);
    return () => observer.disconnect();
  }, [component, contentKey, maxLines, wrap]);

  const handleMouseEnter = (event: React.MouseEvent<HTMLElement>) => {
    const overflow = hasOverflow(event.currentTarget);
    setIsOverflowing(overflow);
    setShowTooltip(overflow);
  };

  const tooltipTitle = (
    <Typography
      variant="body2"
      sx={{
        whiteSpace: "pre-wrap",
        maxWidth: TOOLTIP_CONTENT_MAX_WIDTH,
      }}
    >
      {title}
    </Typography>
  );

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
        component={component}
        onMouseEnter={handleMouseEnter}
        sx={{
          ...(wrap
            ? {
                whiteSpace: "normal",
                wordBreak: "break-word",
                width: "100%",
                ...(maxLines && {
                  display: "-webkit-box",
                  WebkitLineClamp: maxLines,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }),
              }
            : {
                display: "block",
                width: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }),
          ...(isOverflowing && OVERFLOW_TEXT_SX),
        }}
      >
        {children}
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
