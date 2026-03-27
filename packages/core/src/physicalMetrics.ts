import { SpatialWebEvent } from './SpatialWebEvent'
export type PhysicalMetricsValueShape = {
  meterToPtUnscaled: number
  meterToPtScaled: number
}

type WorldScalingCompensation = 'unscaled' | 'scaled'

type ConvertOption = { worldScalingCompensation: WorldScalingCompensation }

// Fallback calibration: 1 meter ≈ 1360 pt for both scaled and unscaled modes.
// This baseline ensures pointToPhysical(1360) === 1 and physicalToPoint(1) === 1360
// until native physical metrics are injected into window.__webspatialsdk__.physicalMetrics
// and a 'WebSpatialPhysicalMetricsUpdate' event updates the snapshot at runtime.
let snapshot: PhysicalMetricsValueShape = {
  meterToPtUnscaled: 1360,
  meterToPtScaled: 1360,
}

function getWorldScalingCompensation(options?: ConvertOption) {
  return options?.worldScalingCompensation ?? 'scaled' // default to scaled
}

/**
 * Converts scene points (pt) to physical meters (m).
 *
 * @param point Points value to convert.
 * @param options Optional conversion options to select world scaling compensation.
 * @returns Physical length in meters.
 */
export function pointToPhysical(point: number, options?: ConvertOption) {
  updateValue()
  const compensation = getWorldScalingCompensation(options)
  if (compensation === 'unscaled') {
    return point / snapshot.meterToPtUnscaled
  }
  return point / snapshot.meterToPtScaled
}

/**
 * Converts physical meters (m) to scene points (pt).
 *
 * @param physical Physical length in meters to convert.
 * @param options Optional conversion options to select world scaling compensation.
 * @returns Points length in the scene.
 */
export function physicalToPoint(physical: number, options?: ConvertOption) {
  updateValue()
  const compensation = getWorldScalingCompensation(options)
  if (compensation === 'unscaled') {
    return physical * snapshot.meterToPtUnscaled
  }
  return physical * snapshot.meterToPtScaled
}

function updateValue() {
  // ssr protected
  if (typeof window === 'undefined') return
  const src = window.__webspatialsdk__?.physicalMetrics
  if (!src) return
  const next = {
    meterToPtScaled: src.meterToPtScaled ?? snapshot.meterToPtScaled,
    meterToPtUnscaled: src.meterToPtUnscaled ?? snapshot.meterToPtUnscaled,
  }
  // only update if there is a change
  if (
    next.meterToPtScaled !== snapshot.meterToPtScaled ||
    next.meterToPtUnscaled !== snapshot.meterToPtUnscaled
  ) {
    snapshot = next
  }
}

/**
 * Returns the current physical metrics used for conversions.
 *
 * @returns The current metrics snapshot `{ meterToPtUnscaled, meterToPtScaled }`.
 */
export function getValue(): PhysicalMetricsValueShape {
  updateValue()
  return snapshot
}

/**
 * Subscribes to physical metrics changes.
 *
 * @param cb Callback invoked when metrics update is detected.
 * @returns Unsubscribe function to remove the listener.
 */
export function subscribe(cb: () => void) {
  // ssr protected
  if (typeof window === 'undefined') return () => {}
  const handler = () => {
    cb()
  }
  // receive metrics update from native via SpatialWebEvent, id: "window"
  SpatialWebEvent.addEventReceiver('window', handler)
  return () => {
    SpatialWebEvent.removeEventReceiver('window')
  }
}
