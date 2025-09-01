import React, { useEffect, useMemo } from 'react'
import { SpatializedContainer } from './SpatializedContainer'
import { getSession } from '../utils'
import {
  SpatializedStatic3DContainerProps,
  SpatializedStatic3DContentProps,
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

export function SpatializedStatic3DElementContainer(
  props: SpatializedStatic3DContainerProps,
) {
  return (
    <SpatializedContainer
      component="div"
      createSpatializedElement={createSpatializedElement}
      spatializedContent={SpatializedContent}
      {...props}
    />
  )
}
