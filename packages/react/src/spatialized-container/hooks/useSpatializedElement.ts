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
    let cancelled = false

    createSpatializedElement().then(
      (inSpatializedElement: SpatializedElement | null) => {
        if (!inSpatializedElement) return
        if (cancelled) {
          inSpatializedElement.destroy()
          return
        }

        const previous = elementRef.current
        if (previous && previous !== inSpatializedElement) {
          previous.destroy()
        }

        elementRef.current = inSpatializedElement
        portalInstanceObject.attachSpatializedElement(inSpatializedElement)
        setSpatializedElement(inSpatializedElement)
      },
      error => {
        if (cancelled) return
        if (process.env.NODE_ENV !== 'production') {
          console.error('[WebSpatial] createSpatializedElement failed', error)
        }
      },
    )

    // HMR / effect re-run: cancel in-flight work only; keep the live element
    // visible until a replacement is attached (see second effect for teardown).
    return () => {
      cancelled = true
    }
  }, [createSpatializedElement, portalInstanceObject])

  useEffect(() => {
    return () => {
      const el = elementRef.current
      if (el) {
        el.destroy()
        elementRef.current = undefined
        setSpatializedElement(undefined)
      }
    }
  }, [portalInstanceObject])

  return spatializedElement
}
