import { useEffect, useRef, useState } from 'react'
import { PortalInstanceObject } from '../context/PortalInstanceContext'
import { SpatializedElement } from '@webspatial/core-sdk'

export function useSpatializedElement(
  createSpatializedElement: () => Promise<SpatializedElement | null>,
  portalInstanceObject: PortalInstanceObject,
) {
  const [spatializedElement, setSpatializedElement] =
    useState<SpatializedElement>()
  // State drives re-renders and the returned value; it can't be in the effect
  // deps or we get an infinite loop (set → effect re-runs → create → set).
  // The element is created inside .then(), so cleanup may run before or after
  // the promise resolves. The ref is the shared store so cleanup can always
  // find and destroy the current element.
  const elementRef = useRef<SpatializedElement | undefined>(undefined)

  useEffect(() => {
    let isDestroyed = false

    createSpatializedElement().then(
      (inSpatializedElement: SpatializedElement | null) => {
        // createSpatializedElement can resolve to null on cancellation/failure
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
