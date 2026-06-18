'use client'

import { requireSpatialImpl } from '../runtime/bridge'
import { useSpatialReady } from '../runtime/useSpatialReady'
import { warnBootForgotten } from './shared/warnBootForgotten'

import type { SpatialOverlayProps } from '../spatialized-container/SpatialOverlay'

/**
 * Default-entry facade for `SpatialOverlay`. Renders a minimal inert shell
 * until `bootSpatial()` resolves in a WebSpatial runtime, then delegates to
 * the real implementation (same pattern as `Model`).
 */
export function SpatialOverlay(props: SpatialOverlayProps) {
  const ready = useSpatialReady()
  if (!ready) {
    warnBootForgotten('SpatialOverlay')
    const measurementContent = props.measurementContent ?? props.children
    return (
      <div
        aria-hidden="true"
        data-webspatial-overlay-fallback
        data-name={`${props.portalTargetName}-measurement-pending`}
      >
        {measurementContent}
      </div>
    )
  }
  const Real = requireSpatialImpl().SpatialOverlay
  return <Real {...props} />
}

SpatialOverlay.displayName = 'SpatialOverlay'
