'use client'

import { ForwardedRef, forwardRef } from 'react'
import type { RealityProps } from '../reality/components/Reality'
import type { SpatializedElementRef } from '../spatialized-container/types'
import { requireSpatialImpl } from '../runtime/bridge'
import { useSpatialReady } from '../runtime/useSpatialReady'
import { markWebSpatialPrimitive } from '../jsx/primitive-marker'
import { getBootForgottenDiagnostic } from './shared/warnBootForgotten'

export type { RealityProps }

/**
 * Default-entry facade for `Reality`. Renders a single
 * `<div aria-hidden="true">` placeholder when the spatial chunk is not
 * ready (preserving the layout box and excluding the React children
 * subtree, per spec) and delegates to the real `Reality` once boot
 * resolves in a WebSpatial runtime.
 *
 * **PARITY (spec tasks.md §15.6)**: this Path 1 fallback is pinned
 * verbatim by `runtime-capabilities` "`Reality` unsupported fallback"
 * Scenario. The real-impl Path 2 in `src/reality/components/Reality.tsx`
 * does NOT yet render this placeholder — it currently mounts nothing
 * when `getSession()` returns null. Drift is tracked under §15.8 as an
 * OpenSpec follow-up (see `src/__tests__/parity.test.tsx` "Reality
 * parity" `it.todo`). Do not modify this Path 1 fallback without first
 * aligning the real-impl branch.
 */
function RealityFacadeImpl(
  props: RealityProps,
  ref: ForwardedRef<SpatializedElementRef>,
) {
  const ready = useSpatialReady()
  if (!ready) {
    return (
      <>
        {getBootForgottenDiagnostic('Reality')}
        {renderRealityFallback(props, ref)}
      </>
    )
  }
  const RealReality = requireSpatialImpl().Reality
  return <RealReality {...props} ref={ref} />
}

export const Reality = forwardRef<SpatializedElementRef, RealityProps>(
  RealityFacadeImpl,
)
Reality.displayName = 'Reality'
// Brand so the JSX runtime short-circuits `Reality` regardless of whether the
// default-entry facade or the eager-entry real implementation reaches it.
markWebSpatialPrimitive(Reality, 'Reality')

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
