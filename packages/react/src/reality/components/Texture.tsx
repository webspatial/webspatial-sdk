import React, { useEffect } from 'react'
import { useRealityContext } from '../context'
import { getAbsoluteUrl } from '../../utils/urlUtils'

export type TextureProps = {
  children?: React.ReactNode
  id: string
  url: string
  onLoad?: () => void
  onError?: (error: unknown) => void
}

export const Texture: React.FC<TextureProps> = ({
  children,
  id,
  url,
  onLoad,
  onError,
}) => {
  const ctx = useRealityContext()

  useEffect(() => {
    if (!ctx) return
    const controller = new AbortController()
    const { session, resourceRegistry } = ctx

    const init = async () => {
      try {
        const resolvedUrl = getAbsoluteUrl(url)
        const texturePromise = session.createTexture({ url: resolvedUrl })
        resourceRegistry.add(id, texturePromise)
        const texture = await texturePromise
        if (controller.signal.aborted) {
          texture.destroy()
          return
        }
        onLoad?.()
      } catch (error: unknown) {
        onError?.(error)
      }
    }
    init()

    return () => {
      controller.abort()
      resourceRegistry.removeAndDestroy(id)
    }
  }, [ctx, id, url])

  return null
}
