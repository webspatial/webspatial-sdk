'use client'

import { ForwardedRef, forwardRef } from 'react'
import type { RealityProps } from '../reality/components/Reality'
import type { SpatializedElementRef } from '../spatialized-container/types'
import { getSpatialImpl } from '../runtime/bridge'
import { useSpatialReady } from '../runtime/useSpatialReady'
import { warnBootForgotten } from './shared/warnBootForgotten'

export type { RealityProps }

/**
 * Default-entry facade for `Reality`. Renders a single
 * `<div aria-hidden="true">` placeholder when the spatial chunk is not
 * ready (preserving the layout box and excluding the React children
 * subtree, per spec) and delegates to the real `Reality` once boot
 * resolves in a WebSpatial runtime.
 */
function RealityFacadeImpl(
  props: RealityProps,
  ref: ForwardedRef<SpatializedElementRef>,
) {
  const ready = useSpatialReady()
  if (!ready) {
    warnBootForgotten('Reality')
    return renderRealityFallback(props, ref)
  }
  const RealReality = getSpatialImpl()!.Reality
  return <RealReality {...props} ref={ref} />
}

export const Reality = forwardRef<SpatializedElementRef, RealityProps>(
  RealityFacadeImpl,
)
Reality.displayName = 'Reality'

function renderRealityFallback(
  props: RealityProps,
  ref: ForwardedRef<SpatializedElementRef>,
): JSX.Element {
  // Strip spatial-only event handlers + spatialEventOptions + children before
  // reaching the host <div>; per spec the child subtree MUST NOT mount and
  // the placeholder MUST be excluded from focus + a11y tree.
  const {
    children: _children,
    onSpatialTap: _onSpatialTap,
    onSpatialDragStart: _onSpatialDragStart,
    onSpatialDrag: _onSpatialDrag,
    onSpatialDragEnd: _onSpatialDragEnd,
    onSpatialRotate: _onSpatialRotate,
    onSpatialRotateEnd: _onSpatialRotateEnd,
    onSpatialMagnify: _onSpatialMagnify,
    onSpatialMagnifyEnd: _onSpatialMagnifyEnd,
    spatialEventOptions: _spatialEventOptions,
    ...divProps
  } = props as RealityProps & { spatialEventOptions?: unknown }
  return (
    <div {...divProps} ref={ref as ForwardedRef<HTMLDivElement>} aria-hidden />
  )
}
