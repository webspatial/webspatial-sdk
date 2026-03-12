import { useEffect, useRef, useState } from 'react'
import { PortalInstanceObject } from '../context/PortalInstanceContext'
import { SpatializedElement } from '@webspatial/core-sdk'

export function useSpatializedElement(
  createSpatializedElement: () => Promise<SpatializedElement>,
  portalInstanceObject: PortalInstanceObject,
) {
  const [spatializedElement, setSpatializedElement] =
    useState<SpatializedElement>()

  // Ref to track the created element across StrictMode cycles.
  const elementRef = useRef<SpatializedElement | undefined>(undefined)
  // Deferred cleanup timer for StrictMode safety.
  const cleanupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Cancel any pending cleanup from StrictMode's fake unmount
    if (cleanupTimerRef.current !== null) {
      clearTimeout(cleanupTimerRef.current)
      cleanupTimerRef.current = null
    }

    // Already created (StrictMode remount) — reuse
    if (elementRef.current) {
      setSpatializedElement(elementRef.current)
      return
    }

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
      // Defer cleanup so StrictMode's immediate remount can cancel it.
      cleanupTimerRef.current = setTimeout(() => {
        cleanupTimerRef.current = null
        const el = elementRef.current
        if (el) {
          el.destroy()
          elementRef.current = undefined
          setSpatializedElement(undefined)
        }
      }, 0)
    }
  }, [createSpatializedElement, portalInstanceObject])

  return spatializedElement
}
