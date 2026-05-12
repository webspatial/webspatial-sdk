/**
 * `useMetrics` placeholder constants (web-mode fallback).
 *
 * Module-level frozen singleton with module-level constant function
 * references for `pointToPhysical` / `physicalToPoint`. The 1/1360 ratio
 * matches today's `noRuntime.ts` web fallback so consumers see no behavior
 * change after the lazy-load architecture lands.
 *
 * Per spatial-lazy-load spec "Hook placeholders" Requirement (the
 * `useMetrics` row in the public-hook table) + "useMetrics placeholder
 * returns the documented fallback values" / "useMetrics function identities
 * are stable across renders" / "useMetrics is SSR-safe" Scenarios.
 *
 * Pure constants module — no React imports, no `'use client'` directive,
 * no `window` access. Safe to call during SSR and to import from
 * server-only modules.
 */

const POINT_TO_PHYSICAL_RATIO = 1 / 1360
const PHYSICAL_TO_POINT_RATIO = 1360

function pointToPhysical(point: number, _options?: object): number {
  return point * POINT_TO_PHYSICAL_RATIO
}

function physicalToPoint(physical: number, _options?: object): number {
  return physical * PHYSICAL_TO_POINT_RATIO
}

const METRICS_PLACEHOLDER = Object.freeze({
  pointToPhysical,
  physicalToPoint,
})

export type MetricsPlaceholder = typeof METRICS_PLACEHOLDER

/**
 * Returns the frozen module-level metrics singleton. The two function
 * references are stable across the page lifetime (consumers using them in
 * `useEffect` dependency arrays get no re-runs).
 */
export function useMetricsPlaceholder(): MetricsPlaceholder {
  return METRICS_PLACEHOLDER
}
