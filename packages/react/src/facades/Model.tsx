'use client'

import { ForwardedRef, forwardRef } from 'react'
import type { ModelProps, ModelRef } from '../Model'
import { requireSpatialImpl } from '../runtime/bridge'
import { useSpatialReady } from '../runtime/useSpatialReady'
import { markWebSpatialPrimitive } from '../jsx/primitive-marker'
import { warnBootForgotten } from './shared/warnBootForgotten'
import { renderModelFallbackElement } from '../modelFallback'

export type { ModelProps, ModelRef }

/**
 * Default-entry facade for `Model`. Renders the degraded Model fallback when
 * the spatial chunk is not ready, and delegates to the real `Model`
 * implementation once `bootSpatial()` resolves in a WebSpatial runtime.
 *
 * Per spatial-lazy-load spec "Component facades". Not wrapped in `React.memo`
 * (per facade conventions).
 */
function ModelFacadeImpl(props: ModelProps, ref: ForwardedRef<ModelRef>) {
  const ready = useSpatialReady()
  if (!ready) {
    warnBootForgotten('Model')
    return renderModelFallback(props, ref)
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
  return renderModelFallbackElement(props, ref)
}
