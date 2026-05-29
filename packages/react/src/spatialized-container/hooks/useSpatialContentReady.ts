import { useLayoutEffect, useRef } from 'react'
import type { SpatializedElement } from '@webspatial/core-sdk'
import type { SpatialContentReadyCallback } from '../types'
import type { PortalInstanceObject } from '../context/PortalInstanceContext'

const isDev = process.env.NODE_ENV !== 'production'

function safeInvokeCleanup(cleanup: (() => void) | undefined) {
  if (!cleanup) return
  try {
    cleanup()
  } catch (e) {
    if (isDev) {
      console.error('[WebSpatial] onSpatialContentReady cleanup threw', e)
    }
  }
}

/**
 * Edge-triggered portal readiness for `onSpatialContentReady`: fires once per rising edge
 * (`false → true`) in useLayoutEffect timing; cleanup runs from the layout-effect dispose
 * path (falling edge, deps change, unmount).
 */
export function useSpatialContentReady(params: {
  spatializedElement: SpatializedElement | undefined
  portalInstanceObject: PortalInstanceObject
  /** Portal subtree root element (connected when ready). */
  hostElement: HTMLElement | null
  onSpatialContentReady?: SpatialContentReadyCallback | undefined
}) {
  const {
    spatializedElement,
    portalInstanceObject,
    hostElement,
    onSpatialContentReady,
  } = params

  const callbackRef = useRef(onSpatialContentReady)
  callbackRef.current = onSpatialContentReady

  useLayoutEffect(() => {
    const dom = portalInstanceObject.dom
    const isReady = !!(
      spatializedElement &&
      dom &&
      hostElement &&
      hostElement.isConnected
    )

    if (!isReady || !hostElement) {
      return () => {}
    }

    const cb = callbackRef.current
    let cleanupFromCallback: (() => void) | undefined

    if (cb) {
      try {
        const ret = cb({ host: hostElement })
        cleanupFromCallback = typeof ret === 'function' ? ret : undefined
      } catch (e) {
        if (isDev) {
          console.error('[WebSpatial] onSpatialContentReady threw', e)
        }
      }
    }

    return () => {
      safeInvokeCleanup(cleanupFromCallback)
    }
  }, [spatializedElement, portalInstanceObject.dom, hostElement])
}
