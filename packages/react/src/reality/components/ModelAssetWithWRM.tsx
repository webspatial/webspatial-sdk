import React, { useEffect, useRef } from 'react'
import { useRealityContext } from '../context'
import { SpatialModelAsset } from '@webspatial/core-sdk'
import { useWRM } from '../../wrm'

type Props = {
  children?: React.ReactNode
  id: string // user id
  src: string // model url
  preload?: boolean // WRM preload hint
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

export const ModelAssetWithWRM: React.FC<Props> = ({
  children,
  preload,
  ...options
}) => {
  const ctx = useRealityContext()
  const { wrm } = useWRM()
  const materialRef = useRef<SpatialModelAsset>()

  useEffect(() => {
    const controller = new AbortController()
    if (!ctx) return

    const { resourceRegistry } = ctx
    const resolvedUrl = resolveAssetUrl(options.src)

    const init = async () => {
      try {
        if (preload) {
          // Use WRM for preloading
          await wrm.preloadModel(options.id, resolvedUrl, {
            signal: controller.signal,
          })
          options.onLoad?.()
          return
        }

        // Use WRM for regular loading
        const modelAssetPromise = wrm.loadModel(options.id, resolvedUrl)
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
      resourceRegistry.removeAndDestroy(options.id)
      wrm.releaseResource(options.id)
    }
  }, [ctx, wrm, options.id, options.src, preload])

  return null
}
