import { useEffect, useRef, useState } from 'react'
import { PortalInstanceObject } from '../context/PortalInstanceContext'
import { SpatializedElement } from '@webspatial/core-sdk'

export function useSpatializedElement(
  createSpatializedElement: () => Promise<SpatializedElement>,
  portalInstanceObject: PortalInstanceObject,
) {
  const [spatializedElement, setSpatializedElement] =
    useState<SpatializedElement>()

  const elementRef = useRef<SpatializedElement | undefined>(undefined)

  useEffect(() => {
    let isDestroyed = false

    createSpatializedElement().then(
      (inSpatializedElement: SpatializedElement) => {
        if (!inSpatializedElement) return
        if (!isDestroyed) {
          elementRef.current = inSpatializedElement
          portalInstanceObject.attachSpatializedElement(inSpatializedElement)
          setSpatializedElement(inSpatializedElement)
        } else {
          inSpatializedElement?.destroy()
        }
      },
    )

    return () => {
      isDestroyed = true
      const el = elementRef.current
      if (el) {
        el.destroy()
        elementRef.current = undefined
        setSpatializedElement(undefined)
      }
    }
  }, [createSpatializedElement, portalInstanceObject])

  return spatializedElement
}
