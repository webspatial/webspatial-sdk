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
export const ModelAsset: React.FC<Props> = ({ children, ...options }) => {
  const ctx = useRealityContext()
  const materialRef = useRef<SpatialModelAsset>()
  useEffect(() => {
    const controller = new AbortController()
    if (!ctx) return
    const { session, reality, resourceRegistry } = ctx
    const init = async () => {
      const modelAssetPromise = session.createModelAsset({ url: options.src })
      resourceRegistry.add(options.id, modelAssetPromise)

      try {
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
