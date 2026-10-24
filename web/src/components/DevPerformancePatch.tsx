"use client";

import { useEffect } from "react";

/**
 * Workaround for Next.js / React 19 dev-mode profiler bug (Next.js issues #86060 & #99032).
 * When an async Server Component aborts early or throws notFound(), React's internal
 * performance.measure() calculates a negative duration, crashing the dev overlay with:
 * "Failed to execute 'measure' on 'Performance': '<Component>' cannot have a negative time stamp".
 *
 * This patch is completely inert in production builds.
 */
export function DevPerformancePatch() {
  useEffect(() => {
    if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
      const perf = window.performance;
      if (!perf || typeof perf.measure !== "function") return;

      const originalMeasure = perf.measure.bind(perf);
      perf.measure = function (
        measureName: string,
        startOrMeasureOptions?: string | PerformanceMeasureOptions,
        endMark?: string
      ) {
        try {
          return originalMeasure(
            measureName,
            startOrMeasureOptions as unknown as PerformanceMeasureOptions,
            endMark
          );
        } catch (err: unknown) {
          if (
            err instanceof Error &&
            err.message.includes("negative time stamp")
          ) {
            // Silently swallow benign Next.js dev tracking error
            return {} as PerformanceMeasure;
          }
          throw err;
        }
      };
    }
  }, []);

  return null;
}
