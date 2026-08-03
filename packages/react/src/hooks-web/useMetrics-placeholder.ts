/**
 * `useMetrics` placeholder (web-mode fallback).
 *
 * Module-level frozen singleton with module-level constant function
 * references for `pointToPhysical` / `physicalToPoint`. Invoking either
 * conversion function throws `WebSpatialRuntimeError` — including in plain
 * web, during SSR, and in a WebSpatial runtime while the bridge is not ready
 * (or while a component instance remains pinned to the placeholder).
 *
 * Per spatial-lazy-load spec "Hook placeholders" Requirement (the
 * `useMetrics` row in the public-hook table) + "useMetrics function identities
 * are stable across renders" / "useMetrics is SSR-safe" Scenarios.
 *
 * Pure constants module — no React imports, no `'use client'` directive.
 * Safe to import from server-only modules.
 */

import { WebSpatialRuntimeError } from '@webspatial/core-sdk/runtime'

function throwMetricsConversionUnavailable(): never {
  throw new WebSpatialRuntimeError(
    'useMetrics',
    'useMetrics conversion functions are not available until bootSpatial() has resolved and the component remounts with the real hook implementation',
  )
}

function pointToPhysical(_point: number, _options?: object): number {
  return throwMetricsConversionUnavailable()
}

function physicalToPoint(_physical: number, _options?: object): number {
  return throwMetricsConversionUnavailable()
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
