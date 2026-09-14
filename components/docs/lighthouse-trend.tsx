import history from "@/docs-platform/lighthouse/history.json";
import { Sparkline } from "@/components/docs/sparkline";

interface LighthousePoint {
  build: string;
  date: string;
  performance: number;
}

/**
 * Docs performance trend - renders the committed Lighthouse CI history, one
 * point per build. Server component: reads the JSON at build time, so the
 * page updates on every deploy that appends a record.
 */
export function LighthouseTrend() {
  const points = (history as { points: LighthousePoint[] }).points ?? [];
  const values = points.map((p) => p.performance);
  const last = points[points.length - 1];

  return (
    <Sparkline
      values={values}
      label="Lighthouse performance score, /docs"
      caption={
        last
          ? `last ${points.length} builds - Lighthouse performance, /docs (latest: ${last.build})`
          : "No Lighthouse builds recorded yet - the CI gate appends one point per build."
      }
    />
  );
}
