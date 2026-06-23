import { ForwardedRef, forwardRef } from 'react'
import {
  SpatializedStatic3DContainerProps,
  SpatializedStatic3DElementContainer,
  SpatializedStatic3DElementRef,
} from './spatialized-container'
import { useInsideAttachment } from './reality/context/InsideAttachmentContext'
import { markWebSpatialPrimitive } from './jsx/primitive-marker'
import { renderModelFallbackElement } from './modelFallback'

import { Spatial } from '@webspatial/core-sdk'

export type ModelProps = SpatializedStatic3DContainerProps & {
  'enable-xr'?: boolean
}

export type ModelRef = SpatializedStatic3DElementRef

const spatial = new Spatial()

function ModelBase(props: ModelProps, ref: ForwardedRef<ModelRef>) {
  const insideAttachment = useInsideAttachment()
  const { 'enable-xr': enableXR, ...restProps } = props
  // Model handles degraded rendering itself because
  // SpatializedStatic3DElementContainer always uses a div host for real
  // spatialized content.
  if (!enableXR || !spatial.runInSpatialWeb() || insideAttachment) {
    return renderModelFallbackElement(restProps, ref)
  }

  // In orbit mode the native layer drives the model's transform, so the
  // `onSpatial*` gesture handlers are disabled.
  if (restProps.stagemode === 'orbit') {
    const {
      onSpatialTap,
      onSpatialDragStart,
      onSpatialDrag,
      onSpatialDragEnd,
      onSpatialRotate,
      onSpatialRotateEnd,
      onSpatialMagnify,
      onSpatialMagnifyEnd,
      ...orbitProps
    } = restProps
    return <SpatializedStatic3DElementContainer ref={ref} {...orbitProps} />
  }

  return <SpatializedStatic3DElementContainer ref={ref} {...restProps} />
}

// No `withSSRSupported` wrapper: on the default entry the real `Model` is
// reached only through the facade delegate (`facades/Model.tsx`), which renders
// it only after `useSpatialReady()` reports ready — i.e. as a fresh client
// mount AFTER hydration commits, never during the SSR or hydration pass. The
// eager entry exports this real `Model` directly and is CSR-only for spatial
// primitives (see `spatial-lazy-load` spec "Entry routing"); SSR safety in
// mixed eager setups is the consumer's responsibility (CSR-gate the subtree).
export const Model = forwardRef(ModelBase)
Model.displayName = 'Model'
// Brand the real implementation too: the eager entry exports THIS `Model`,
// and the JSX runtime must short-circuit it (not wrap `<Model enable-xr>` as
// a 2D spatialized container).
markWebSpatialPrimitive(Model, 'Model')
