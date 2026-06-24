'use client'

import { useState } from 'react'

import { getSpatialImpl, isSpatialReady } from '../runtime/bridge'
import { useSpatialOverlayWeb } from './spatialOverlayWeb'
import type {
  UseSpatialOverlayOptions,
  UseSpatialOverlayResult,
} from '../spatialized-container/SpatialOverlay.types'

type UseSpatialOverlayImpl = (
  options: UseSpatialOverlayOptions,
) => UseSpatialOverlayResult

/**
 * Public `useSpatialOverlay` hook (default entry).
 *
 * Plain web uses the lightweight `useSpatialOverlayWeb` implementation in this
 * package. After `bootSpatial()` resolves, newly mounted instances can pick up
 * the spatial chunk implementation with measurement/portal split (same pin
 * contract as `useMetrics` / `useSpatialPortalContainer`).
 */
export function useSpatialOverlay(
  options: UseSpatialOverlayOptions,
): UseSpatialOverlayResult {
  const [impl] = useState<UseSpatialOverlayImpl>(() => {
    if (!isSpatialReady()) return useSpatialOverlayWeb
    const real = getSpatialImpl()?.useSpatialOverlay
    return (real ?? useSpatialOverlayWeb) as UseSpatialOverlayImpl
  })
  return impl(options)
}

export type {
  SpatialOverlayPortalOption,
  UseSpatialOverlayOptions,
  UseSpatialOverlayResult,
} from '../spatialized-container/SpatialOverlay.types'
