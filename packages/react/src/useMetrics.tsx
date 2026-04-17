import { useSyncExternalStore } from 'react'
import { PhysicalMetrics } from '@webspatial/core-sdk'

export function useMetrics() {
  useSyncExternalStore(PhysicalMetrics.subscribe, PhysicalMetrics.getValue)
  const { pointToPhysical, physicalToPoint } = PhysicalMetrics
  return { pointToPhysical, physicalToPoint }
}
