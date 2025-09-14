import { ForwardedRef, forwardRef } from 'react'
import {
  SpatializedStatic3DContainerProps,
  SpatializedStatic3DElementContainer,
  SpatializedStatic3DElementRef,
} from './spatialized-container'

import { Spatial } from '@webspatial/core-sdk'

export type ModelProps = SpatializedStatic3DContainerProps & {
  'enable-xr'?: boolean
}

export type ModelRef = SpatializedStatic3DElementRef

const spatial = new Spatial()

function ModelBase(props: ModelProps, ref: ForwardedRef<ModelRef>) {
  const { 'enable-xr': enableXR, ...restProps } = props
  console.log('ModelBase', enableXR, restProps, props)
  if (!enableXR || !spatial.runInSpatialWeb()) {
    console.log('ModelBase hit here')

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
    return <model ref={refModel} {...modelProps} />
  }

  return <SpatializedStatic3DElementContainer ref={ref} {...restProps} />
}

export const Model = forwardRef(ModelBase)
Model.displayName = 'Model'
