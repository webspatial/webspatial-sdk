import { ForwardedRef, forwardRef } from 'react'
import {
  SpatializedStatic3DContainerProps,
  SpatializedStatic3DElementContainer,
  SpatializedStatic3DElementRef,
} from './spatialized-container'
import { withSSRSupported } from './ssr'
import { useInsideAttachment } from './reality/context/InsideAttachmentContext'

import { Spatial } from '@webspatial/core-sdk'

export type ModelProps = SpatializedStatic3DContainerProps & {
  'enable-xr'?: boolean
}

export type ModelRef = SpatializedStatic3DElementRef

const spatial = new Spatial()

function ModelBase(props: ModelProps, ref: ForwardedRef<ModelRef>) {
  const insideAttachment = useInsideAttachment()
  const { 'enable-xr': enableXR, ...restProps } = props
  if (!enableXR || !spatial.runInSpatialWeb() || insideAttachment) {
    if (enableXR && insideAttachment) {
      // graceful degrade warn
      console.warn(
        '[WebSpatial] Model with enable-xr cannot be used inside AttachmentAsset. Rendering as plain <model>.',
      )
    }
    const {
      onSpatialTap,
      onSpatialDragStart,
      onSpatialDrag,
      onSpatialDragEnd,
      onSpatialRotate,
      onSpatialRotateEnd,
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
