import { ForwardedRef, forwardRef } from 'react'
import {
  SpatializedStatic3DContainerProps,
  SpatializedStatic3DElementContainer,
  SpatializedStatic3DElementRef,
} from './spatialized-container'
import { withSSRSupported } from './ssr'

import { Spatial } from '@webspatial/core-sdk'

export type ModelProps = SpatializedStatic3DContainerProps & {
  'enable-xr'?: boolean
}

export type ModelRef = SpatializedStatic3DElementRef

const spatial = new Spatial()

function ModelBase(props: ModelProps, ref: ForwardedRef<ModelRef>) {
  const { 'enable-xr': enableXR, ...restProps } = props
  if (!enableXR || !spatial.runInSpatialWeb()) {
    const {
      onSpatialTap,
      onSpatialDragStart,
      onSpatialDrag,
      onSpatialDragEnd,
      onSpatialRotateStart,
      onSpatialRotate,
      onSpatialRotateEnd,
      onSpatialMagnifyStart,
      onSpatialMagnify,
      onSpatialMagnifyEnd,
      ...modelProps
    } = restProps
    // map to VisionOS26 model tag
    // @ts-ignore
    return <model ref={ref} {...modelProps} />
  }

  return <SpatializedStatic3DElementContainer ref={ref} {...restProps} />
}

export const Model = withSSRSupported(forwardRef(ModelBase))
Model.displayName = 'Model'
