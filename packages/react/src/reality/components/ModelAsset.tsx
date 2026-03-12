import React, { useEffect, useRef } from 'react'
import { useRealityContext } from '../context'
import { SpatialModelAsset } from '@webspatial/core-sdk'
type Props = {
  children?: React.ReactNode
  id: string // user id
  src: string // model url
  onLoad?: () => void
  onError?: (error: any) => void
}

// Resolve relative URLs to absolute for the native bridge
const resolveAssetUrl = (url: string): string => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  return new URL(url, window.location.href).href
}

export const ModelAsset: React.FC<Props> = ({ children, ...options }) => {
  const ctx = useRealityContext()
  const materialRef = useRef<SpatialModelAsset>()
  useEffect(() => {
    const controller = new AbortController()
    if (!ctx) return
    const { session, reality, resourceRegistry } = ctx
    const init = async () => {
      try {
        const resolvedUrl = resolveAssetUrl(options.src)
        const modelAssetPromise = session.createModelAsset({ url: resolvedUrl })
        resourceRegistry.add(options.id, modelAssetPromise)

        const mat = await modelAssetPromise
        if (controller.signal.aborted) {
          mat.destroy()
          return
        }
        materialRef.current = mat
        options.onLoad?.()
      } catch (error: any) {
        options.onError?.(error)
      }
    }
    init()

    return () => {
      controller.abort()
      materialRef.current?.destroy()
    }
  }, [ctx])

  return null
}
