import React, { useEffect, useRef } from 'react'
import { useRealityContext } from '../context'
type Props = {
  children?: React.ReactNode
  id: string // user id
  src: string // model url
  onLoad?: () => void
  onError?: (error: any) => void
}
export const ModelAsset: React.FC<Props> = ({ children, ...options }) => {
  const ctx = useRealityContext()
  // const materialRef = useRef<SpatialUnlitMaterial>()
  useEffect(() => {
    if (!ctx) return
    const { session, reality, resourceRegistry } = ctx
    const init = async () => {
      const modelAssetPromise = session.createModelAsset({ url: options.src })
      resourceRegistry.add(options.id, modelAssetPromise)

      try {
        await modelAssetPromise
        options.onLoad?.()
      } catch (error: any) {
        options.onError?.(error)
      }
    }
    init()

    return () => {}
  }, [ctx])

  return null
}
