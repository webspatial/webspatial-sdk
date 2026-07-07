'use client'

import { useState } from 'react'

import { getSpatialImpl, isSpatialReady } from '../runtime/bridge'

function spatialPortalContainerPlaceholder(): HTMLElement | undefined {
  return typeof document === 'undefined' ? undefined : document.body
}

type UseSpatialPortalContainerImpl = () => HTMLElement | undefined

/**
 * Public `useSpatialPortalContainer` hook (default entry).
 *
 * Mirrors the `useMetrics` placeholder contract: the placeholder vs real
 * implementation is pinned once per mount via `useState`'s initializer. After
 * spatial is ready, remount to pick up the real hook if the instance was
 * created before `bootSpatial()` resolved.
 */
export function useSpatialPortalContainer(): HTMLElement | undefined {
  const [impl] = useState<UseSpatialPortalContainerImpl>(() => {
    if (!isSpatialReady()) return spatialPortalContainerPlaceholder
    const real = getSpatialImpl()?.useSpatialPortalContainer
    return (real ??
      spatialPortalContainerPlaceholder) as UseSpatialPortalContainerImpl
  })
  return impl()
}
