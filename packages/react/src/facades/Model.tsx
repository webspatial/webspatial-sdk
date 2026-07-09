'use client'

import { ForwardedRef, forwardRef } from 'react'
import type { ModelProps, ModelRef } from '../Model'
import { requireSpatialImpl } from '../runtime/bridge'
import { useSpatialReady } from '../runtime/useSpatialReady'
import { markWebSpatialPrimitive } from '../jsx/primitive-marker'
import { getBootForgottenDiagnostic } from './shared/warnBootForgotten'

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
 */
function ModelFacadeImpl(props: ModelProps, ref: ForwardedRef<ModelRef>) {
  const ready = useSpatialReady()
  if (!ready) {
    return (
      <>
        {getBootForgottenDiagnostic('Model')}
        {renderModelFallback(props, ref)}
      </>
    )
  }
  const RealModel = requireSpatialImpl().Model
  return <RealModel {...props} ref={ref} />
}

export const Model = forwardRef<ModelRef, ModelProps>(ModelFacadeImpl)
Model.displayName = 'Model'
// Brand so the JSX runtime short-circuits `Model` regardless of whether the
// default-entry facade or the eager-entry real implementation reaches it.
markWebSpatialPrimitive(Model, 'Model')

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
  return <model ref={ref} {...modelProps} />
}
