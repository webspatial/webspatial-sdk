import React, { useEffect, useRef } from 'react'
import { SpatialTextureResource } from '@webspatial/core-sdk'
import { useRealityContext } from '../context'

export type TextureProps = {
  children?: React.ReactNode
  id: string
  url: string
  onLoad?: () => void
  onError?: (error: any) => void
}

// Declare <Texture> before sibling <UnlitMaterial textureId="…"> under the same <Reality>.
// UnlitMaterial reads the texture from the registry when it creates the native material; if this
// effect has not run add() yet, that lookup is empty and the texture is omitted.

function resolveTextureUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  return new URL(url, window.location.href).href
}

export const Texture: React.FC<TextureProps> = ({ children, ...options }) => {
  const ctx = useRealityContext()
  const textureRef = useRef<SpatialTextureResource>()
  const isInitializedRef = useRef(false)

  useEffect(() => {
    if (!ctx) return
    const controller = new AbortController()
    const { session, reality, resourceRegistry } = ctx
    const init = async () => {
      try {
        const resolvedUrl = resolveTextureUrl(options.url)
        const texturePromise = session.createTexture({ url: resolvedUrl })
        resourceRegistry.add('texture', options.id, texturePromise)
        const texture = await texturePromise
        if (controller.signal.aborted) {
          texture.destroy()
          return
        }
        textureRef.current = texture
        isInitializedRef.current = true
        options.onLoad?.()
      } catch (error: any) {
        options.onError?.(error)
      }
    }
    init()

    return () => {
      controller.abort()
      resourceRegistry.removeAndDestroy('texture', options.id)
      textureRef.current = undefined
      isInitializedRef.current = false
    }
  }, [ctx])

  useEffect(() => {
    if (!isInitializedRef.current || !textureRef.current) return
    const resolvedUrl = resolveTextureUrl(options.url)
    textureRef.current.updateProperties({ url: resolvedUrl })
  }, [options.url])

  return null
}
