import React, { ForwardedRef, forwardRef, useEffect, useMemo } from 'react'
import { SpatializedContainer } from './SpatializedContainer'
import { getSession } from '../utils'
import {
  SpatializedStatic3DContainerProps,
  SpatializedStatic3DContentProps,
  SpatializedStatic3DElementRef,
} from './types'
import { SpatializedStatic3DElement } from '@webspatial/core-sdk'

function getAbsoluteURL(url?: string) {
  if (!url) {
    return ''
  }
  if (url.startsWith('http') || url.startsWith('//')) {
    return url
  }
  return window.location.origin + url
}

function SpatializedContent(props: SpatializedStatic3DContentProps) {
  const { src, spatializedElement } = props
  const spatializedStatic3DElement =
    spatializedElement as SpatializedStatic3DElement

  const currentSrc: string = useMemo(() => getAbsoluteURL(src), [src])

  useEffect(() => {
    if (src) {
      spatializedStatic3DElement.updateProperties({ modelURL: currentSrc })
    }
  }, [currentSrc])

  return <></>
}

async function createSpatializedElement() {
  return getSession()!.createSpatializedStatic3DElement()
}

function SpatializedStatic3DElementContainerBase(
  props: SpatializedStatic3DContainerProps,
  ref: ForwardedRef<SpatializedStatic3DElementRef>,
) {
  const extraRefProps = useMemo(
    () => ({
      src: () => getAbsoluteURL(props.src),
    }),
    [],
  )

  return (
    <SpatializedContainer<SpatializedStatic3DElementRef>
      ref={ref}
      component="div"
      createSpatializedElement={createSpatializedElement}
      spatializedContent={SpatializedContent}
      extraRefProps={extraRefProps}
      {...props}
    />
  )
}

export const SpatializedStatic3DElementContainer = forwardRef(
  SpatializedStatic3DElementContainerBase,
)
