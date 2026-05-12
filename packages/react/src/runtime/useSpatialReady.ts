'use client'

import { useSyncExternalStore } from 'react'
import { isSpatialReady, subscribeSpatialReady } from './bridge'
import { detectSpatialRuntime } from './detect'

// Module-level constants so non-WebSpatial subscribers and SSR snapshots are
// referentially stable across renders, per spatial-lazy-load spec's
// "getServerSnapshot returns a stable constant" Scenario and design.md §4
// (noopSubscribe / alwaysFalse pattern).
const noopUnsubscribe = (): void => {}
const noopSubscribe = (): (() => void) => noopUnsubscribe
const alwaysFalse = (): false => false

export function useSpatialReady(): boolean {
  const hasSpatialRuntime = detectSpatialRuntime() !== null

  return useSyncExternalStore(
    hasSpatialRuntime ? subscribeSpatialReady : noopSubscribe,
    hasSpatialRuntime ? isSpatialReady : alwaysFalse,
    alwaysFalse,
  )
}
