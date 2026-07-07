import React, { useCallback, useContext, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Spatialized2DElement } from '@webspatial/core-sdk'

import {
  setOpenWindowStyle,
  syncParentHeadToChild,
} from '../utils/windowStyleSync'
import { useSyncHeadStyles } from '../utils/useSyncHeadStyles'
import { getSession } from '../utils'
import { PortalInstanceContext } from './context/PortalInstanceContext'
import { useSpatialOverlayRenderTarget } from './context/SpatialOverlayRenderTargetContext'
import { SpatializedContainerContext } from './context/SpatializedContainerContext'
import { SpatialWindowContext } from './context/SpatialWindowContext'
import type { PortalSurfaceProps } from '../PortalSurface.types'

function normalizeSpatialLength(value: number | string | undefined): string {
  if (value == null) return '100px'
  return typeof value === 'number' ? `${value}px` : value
}

function parseSpatialOffset(value: number | string | undefined): number {
  return parseFloat(normalizeSpatialLength(value)) || 0
}

function ensurePortalViewportMeta(windowProxy: WindowProxy) {
  const viewport = windowProxy.document.querySelector('meta[name="viewport"]')
  if (viewport) {
    viewport.setAttribute(
      'content',
      'initial-scale=1.0, maximum-scale=1.0, user-scalable=no',
    )
    return
  }

  const meta = windowProxy.document.createElement('meta')
  meta.name = 'viewport'
  meta.content = 'initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
  windowProxy.document.head.appendChild(meta)
}

function setPortalDocumentViewportStyle(windowProxy: WindowProxy) {
  const { document: childDocument } = windowProxy
  childDocument.documentElement.style.width = '100%'
  childDocument.documentElement.style.height = '100%'
  childDocument.documentElement.style.background = 'transparent'

  const { style } = childDocument.body
  style.margin = '0px'
  style.width = '100vw'
  style.height = '100vh'
  style.minWidth = '100vw'
  style.minHeight = '100vh'
  style.maxWidth = 'none'
  style.maxHeight = 'none'
  style.display = 'block'
  style.overflow = 'hidden'
  style.background = 'transparent'
}

function getViewportRect() {
  const width = window.innerWidth || document.documentElement.clientWidth || 0
  const height =
    window.innerHeight || document.documentElement.clientHeight || 0

  return { width, height }
}

function PortalSurfaceContent({
  spatializedElement,
  children,
}: {
  spatializedElement: Spatialized2DElement
  children?: React.ReactNode
}) {
  const { windowProxy } = spatializedElement

  useSyncHeadStyles(windowProxy)

  return createPortal(
    <SpatialWindowContext.Provider value={windowProxy}>
      {children}
    </SpatialWindowContext.Provider>,
    windowProxy.document.body,
  )
}

export function PortalSurface({
  children,
  zOffset,
  backgroundMaterial = 'transparent',
}: PortalSurfaceProps) {
  const spatializedContainerObject = useContext(SpatializedContainerContext)
  const portalInstanceObject = useContext(PortalInstanceContext)
  const spatialOverlayRenderTarget = useSpatialOverlayRenderTarget()
  const [spatializedElement, setSpatializedElement] =
    useState<Spatialized2DElement | null>(null)

  const session = getSession()
  const shouldCreateSurface =
    spatializedContainerObject == null ||
    (portalInstanceObject != null && spatialOverlayRenderTarget === 'portal')

  const updateSurfaceProperties = useCallback(
    (element: Spatialized2DElement) => {
      const { width, height } = getViewportRect()
      element.updateProperties({
        clientX: window.scrollX,
        clientY: window.scrollY,
        width,
        height,
        depth: 0,
        opacity: 1,
        scrollWithParent: false,
        zIndex: 0,
        visible: true,
        backOffset: parseSpatialOffset(zOffset),
        rotationAnchor: { x: 0.5, y: 0.5, z: 0 },
        scrollPageEnabled: true,
        cornerRadius: {
          topLeading: 0,
          bottomLeading: 0,
          topTrailing: 0,
          bottomTrailing: 0,
        },
        material: backgroundMaterial,
      })
      element.updateTransform?.(new DOMMatrix())
    },
    [backgroundMaterial, zOffset],
  )

  useEffect(() => {
    const activeSession = session
    if (!activeSession || !shouldCreateSurface) return
    const spatialSession = activeSession

    let cancelled = false
    let currentElement: Spatialized2DElement | null = null

    async function createSurface() {
      const nextElement = await spatialSession.createSpatialized2DElement()
      currentElement = nextElement

      if (cancelled) {
        nextElement.destroy()
        return
      }

      const { windowProxy } = nextElement
      setOpenWindowStyle(windowProxy)
      setPortalDocumentViewportStyle(windowProxy)
      ensurePortalViewportMeta(windowProxy)
      await syncParentHeadToChild(windowProxy)

      if (cancelled) {
        nextElement.destroy()
        return
      }

      await spatialSession.getSpatialScene().addSpatializedElement(nextElement)

      if (cancelled) {
        nextElement.destroy()
        return
      }

      updateSurfaceProperties(nextElement)
      setSpatializedElement(nextElement)
    }

    void createSurface()

    return () => {
      cancelled = true
      currentElement?.destroy()
    }
  }, [session, shouldCreateSurface, updateSurfaceProperties])

  useEffect(() => {
    if (!spatializedElement) return

    const onResize = () => {
      updateSurfaceProperties(spatializedElement)
    }
    window.addEventListener('resize', onResize)
    updateSurfaceProperties(spatializedElement)

    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [spatializedElement, updateSurfaceProperties])

  if (!session || !shouldCreateSurface) return null

  if (!spatializedElement) return null

  return (
    <PortalSurfaceContent spatializedElement={spatializedElement}>
      {children}
    </PortalSurfaceContent>
  )
}

PortalSurface.displayName = 'PortalSurface'

export type { PortalSurfaceProps } from '../PortalSurface.types'
