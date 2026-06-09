import { SpatialWebEvent } from '../../SpatialWebEvent'

/**
 * The three native lifecycle events every spatialized motion session registers,
 * keyed by `${animationId}_<suffix>`. Single source of truth for the naming
 * convention so registration and cleanup never drift apart.
 */
export const MOTION_EVENT_SUFFIXES = [
  'completed',
  'canceled',
  'failed',
] as const

/** Remove all lifecycle event receivers for a given animation session. */
export function removeMotionEventReceivers(animationId: string): void {
  for (const suffix of MOTION_EVENT_SUFFIXES) {
    SpatialWebEvent.removeEventReceiver(`${animationId}_${suffix}`)
  }
}
