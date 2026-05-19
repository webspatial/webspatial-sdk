import { computeRuntimeFromUserAgent } from './capabilities'
import type { WebSpatialRuntimeType } from './capabilities'

export type SpatialRuntimeType = Exclude<WebSpatialRuntimeType, null>

/**
 * Browser-only spatial runtime detection used by the lazy-load boot path.
 * SSR and non-browser environments intentionally resolve to null so merely
 * importing the runtime foundation never schedules the spatial implementation.
 */
export function detectSpatialRuntime(): SpatialRuntimeType | null {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return null
  }

  const snapshot = computeRuntimeFromUserAgent(navigator.userAgent)
  return snapshot.type
}
