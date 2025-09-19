import { useEffect, useState } from 'react'
import { PortalInstanceObject } from '../context/PortalInstanceContext'
import { SpatializedElement } from '@webspatial/core-sdk'

export function useSpatializedElement(
  createSpatializedElement: () => Promise<SpatializedElement>,
  portalInstanceObject: PortalInstanceObject,
) {
  const [spatializedElement, setSpatializedElement] =
    useState<SpatializedElement>()

  useEffect(() => {
    let isDestroyed = false
    let spatializedElement: SpatializedElement | undefined
    createSpatializedElement().then(
      (inSpatializedElement: SpatializedElement) => {
        if (!isDestroyed) {
          spatializedElement = inSpatializedElement
          portalInstanceObject.attachSpatializedElement(spatializedElement)

          setSpatializedElement(spatializedElement)
        } else {
          inSpatializedElement.destroy()
        }
      },
    )

    return () => {
      isDestroyed = true
      if (spatializedElement) {
        spatializedElement.destroy()
        spatializedElement = undefined
      }
    }
  }, [createSpatializedElement, portalInstanceObject])

  return spatializedElement
}
