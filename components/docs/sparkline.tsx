"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";

/**
 * Single-hue sparkline: one axis, last value direct-labeled. Never dual-axis
 * - score and milliseconds on one chart is the anti-pattern this avoids.
 */
export function Sparkline({
  values,
  label,
  caption,
  width = 220,
  height = 48,
}: {
  values: number[];
  label: string;
  caption?: string;
  width?: number;
  height?: number;
}) {
  const theme = useTheme();
  const stroke = theme.palette.primary.main;
  const axisColor = theme.palette.divider;

  if (values.length === 0) {
    return (
      <Box sx={{ my: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {label}: no data yet.
        </Typography>
      </Box>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = 4;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const points = values.map(
    (v, i) =>
      `${pad + (i / Math.max(values.length - 1, 1)) * innerW},${
        pad + innerH - ((v - min) / span) * innerH
      }`
  );
  const last = values[values.length - 1];
  const [lastX, lastY] = points[points.length - 1].split(",").map(Number);

  return (
    <Box sx={{ my: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`${label}: ${values.join(", ")}`}
        >
          <line
            x1={pad}
            y1={height - pad}
            x2={width - pad}
            y2={height - pad}
            stroke={axisColor}
            strokeWidth={1}
          />
          <polyline
            points={points.join(" ")}
            fill="none"
            stroke={stroke}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx={lastX} cy={lastY} r={3} fill={stroke} />
        </svg>
        <Box>
          <Typography variant="h5" component="div" sx={{ fontWeight: 700 }}>
            {last}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {caption ?? `last ${values.length} builds - ${label}`}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
