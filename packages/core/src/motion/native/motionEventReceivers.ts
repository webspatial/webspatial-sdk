import { SpatialWebEvent } from '../../SpatialWebEvent'

/**
 * The three native lifecycle events every spatialized motion session uses,
 * keyed by `${animationId}_<suffix>`. Single source of truth for the naming
 * convention so registration and cleanup never drift apart.
 */
export const MOTION_EVENT_SUFFIXES = [
  'completed',
  'canceled',
  'failed',
] as const

export interface MotionEventReceiverHandlers {
  onCompleted(data: unknown): void
  onCanceled(data: unknown): void
  onFailed(data: unknown): void
}

/** Register all lifecycle event receivers for a given animation session. */
export function addMotionEventReceivers(
  animationId: string,
  handlers: MotionEventReceiverHandlers,
): void {
  SpatialWebEvent.addEventReceiver(
    `${animationId}_completed`,
    handlers.onCompleted,
  )
  SpatialWebEvent.addEventReceiver(
    `${animationId}_canceled`,
    handlers.onCanceled,
  )
  SpatialWebEvent.addEventReceiver(`${animationId}_failed`, handlers.onFailed)
}

/** Remove all lifecycle event receivers for a given animation session. */
export function removeMotionEventReceivers(animationId: string): void {
  for (const suffix of MOTION_EVENT_SUFFIXES) {
    SpatialWebEvent.removeEventReceiver(`${animationId}_${suffix}`)
  }
}
