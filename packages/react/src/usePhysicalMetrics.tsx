import { useSyncExternalStore } from 'react'
import { PhysicalMetrics } from '@webspatial/core-sdk'

export function usePhysicalMetrics() {
  const value = useSyncExternalStore(
    PhysicalMetrics.subscribe,
    PhysicalMetrics.getValue,
  )

  const { point2physical, physical2point } = PhysicalMetrics

  return { point2physical, physical2point }
}
