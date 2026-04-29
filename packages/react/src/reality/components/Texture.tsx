import React, { useEffect } from 'react'
import { useRealityContext } from '../context'

export type TextureProps = {
  children?: React.ReactNode
  id: string
  url: string
  onLoad?: () => void
  onError?: (error: any) => void
}

function resolveTextureUrl(url: string): string {
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('file://')
  ) {
    return url
  }
  if (typeof window === 'undefined' || !window.location?.href) {
    return url
  }
  return new URL(url, window.location.href).href
}

export const Texture: React.FC<TextureProps> = ({ children, ...options }) => {
  const ctx = useRealityContext()

  useEffect(() => {
    if (!ctx) return
    const controller = new AbortController()
    const { session, resourceRegistry } = ctx
    const textureId = options.id

    const init = async () => {
      try {
        const resolvedUrl = resolveTextureUrl(options.url)
        const texturePromise = session.createTexture({ url: resolvedUrl })
        resourceRegistry.add(textureId, texturePromise)
        const texture = await texturePromise
        if (controller.signal.aborted) {
          texture.destroy()
          return
        }
        options.onLoad?.()
      } catch (error: any) {
        options.onError?.(error)
      }
    }
    init()

    return () => {
      controller.abort()
      resourceRegistry.removeAndDestroy(textureId)
    }
  }, [ctx, options.id, options.url])

  return null
}
