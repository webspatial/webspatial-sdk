import React, { useEffect, useRef } from 'react'
import { useRealityContext } from '../context'
import { SpatialModelAsset } from '@webspatial/core-sdk'
import { getAbsoluteUrl } from '../../utils/urlUtils'

type Props = {
  children?: React.ReactNode
  id: string // user id
  src: string // model url
  onLoad?: () => void
  onError?: (error: unknown) => void
}

export const ModelAsset: React.FC<Props> = ({ children, ...options }) => {
  const ctx = useRealityContext()
  const materialRef = useRef<SpatialModelAsset | undefined>(undefined)
  useEffect(() => {
    const controller = new AbortController()
    if (!ctx) return
    const { session, reality, resourceRegistry } = ctx
    const init = async () => {
      try {
        const resolvedUrl = getAbsoluteUrl(options.src)
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
