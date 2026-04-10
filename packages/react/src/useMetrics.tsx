import { useSyncExternalStore } from 'react'
import {
  PhysicalMetrics,
  supports,
  WebSpatialRuntimeError,
} from '@webspatial/core-sdk'

export function useMetrics() {
  useSyncExternalStore(PhysicalMetrics.subscribe, PhysicalMetrics.getValue)
  const { pointToPhysical, physicalToPoint } = PhysicalMetrics
  if (!supports('useMetrics')) {
    throw new WebSpatialRuntimeError('useMetrics')
  }
  return { pointToPhysical, physicalToPoint }
}
