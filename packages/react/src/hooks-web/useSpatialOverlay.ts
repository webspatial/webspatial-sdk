'use client'

import { createElement, Fragment, useState } from 'react'
import type { ComponentType, ReactNode } from 'react'

import { getSpatialImpl, isSpatialReady } from '../runtime/bridge'
import type {
  SpatialOverlayPortalOption,
  UseSpatialOverlayOptions,
  UseSpatialOverlayResult,
} from '../spatialized-container/SpatialOverlay'

const OverlayTargetPlaceholder: ComponentType<{
  measurementContent?: ReactNode
  children?: ReactNode
}> = ({ measurementContent, children }) =>
  createElement(Fragment, null, measurementContent ?? children)

OverlayTargetPlaceholder.displayName = 'WebSpatialOverlayTargetPlaceholder'

const portalMenuOptionPlaceholder: SpatialOverlayPortalOption = (
  content,
  measurementContent = content,
) => measurementContent

function useSpatialOverlayPinnedPlaceholder(
  _options: UseSpatialOverlayOptions,
): UseSpatialOverlayResult {
  return {
    OverlayTarget: OverlayTargetPlaceholder,
    portalMenuOption: portalMenuOptionPlaceholder,
  }
}

type UseSpatialOverlayImpl = (
  options: UseSpatialOverlayOptions,
) => UseSpatialOverlayResult

/**
 * Public `useSpatialOverlay` hook (default entry).
 *
 * Placeholder vs real hook is pinned once per mount (same contract as
 * `useMetrics` / `useSpatialPortalContainer`).
 */
export function useSpatialOverlay(
  options: UseSpatialOverlayOptions,
): UseSpatialOverlayResult {
  const [impl] = useState<UseSpatialOverlayImpl>(() => {
    if (!isSpatialReady()) return useSpatialOverlayPinnedPlaceholder
    const real = getSpatialImpl()?.useSpatialOverlay
    return (real ?? useSpatialOverlayPinnedPlaceholder) as UseSpatialOverlayImpl
  })
  return impl(options)
}
