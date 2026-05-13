'use client'

import { ForwardedRef, createElement, forwardRef } from 'react'
import type { ModelProps, ModelRef } from '../Model'
import { getSpatialImpl } from '../runtime/bridge'
import { useSpatialReady } from '../runtime/useSpatialReady'
import { warnBootForgotten } from './shared/warnBootForgotten'

export type { ModelProps, ModelRef }

/**
 * Default-entry facade for `Model`. Renders the spec-pinned degraded
 * native `<model>` element when the spatial chunk is not ready, and
 * delegates to the real `Model` implementation once `bootSpatial()`
 * resolves in a WebSpatial runtime.
 *
 * Per spatial-lazy-load spec "Component facades" + "Model fallback
 * renders degraded `<model>` tag" Scenarios. Not wrapped in
 * `React.memo` (per facade conventions).
 *
 * **PARITY (spec tasks.md §15.6)**: this Path 1 fallback MUST stay
 * structurally identical to the real-impl Path 2 unsupported branch in
 * `src/Model.tsx` (the `enable-xr={false}` / `!Spatial.runInSpatialWeb()`
 * gate), per `runtime-capabilities` "`Model` exception fallback"
 * Scenario. Verified by `src/__tests__/parity.test.tsx` ("Model parity"
 * suite); changes to either path MUST update both paths or the parity
 * test will fail.
 */
function ModelFacadeImpl(props: ModelProps, ref: ForwardedRef<ModelRef>) {
  const ready = useSpatialReady()
  if (!ready) {
    warnBootForgotten('Model')
    return renderModelFallback(props, ref)
  }
  const RealModel = getSpatialImpl()!.Model
  return <RealModel {...props} ref={ref} />
}

export const Model = forwardRef<ModelRef, ModelProps>(ModelFacadeImpl)
Model.displayName = 'Model'

function renderModelFallback(
  props: ModelProps,
  ref: ForwardedRef<ModelRef>,
): JSX.Element {
  // Strip spatial-only event props + spatialEventOptions before reaching the
  // native <model> element (per spec "Model fallback renders degraded
  // <model> tag" Scenario).
  const {
    onSpatialTap: _onSpatialTap,
    onSpatialDragStart: _onSpatialDragStart,
    onSpatialDrag: _onSpatialDrag,
    onSpatialDragEnd: _onSpatialDragEnd,
    onSpatialRotate: _onSpatialRotate,
    onSpatialRotateEnd: _onSpatialRotateEnd,
    onSpatialMagnify: _onSpatialMagnify,
    onSpatialMagnifyEnd: _onSpatialMagnifyEnd,
    spatialEventOptions: _spatialEventOptions,
    'enable-xr': _enableXR,
    ...modelProps
  } = props
  // Native <model> is a non-React intrinsic; createElement bypasses the
  // JSX intrinsic-type check while still preserving ref forwarding.
  return createElement('model', { ...modelProps, ref })
}
