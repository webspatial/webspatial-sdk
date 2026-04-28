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
  const textureRef = useRef<SpatialTextureResource>()
  const isInitializedRef = useRef(false)

  useEffect(() => {
    if (!ctx) return
    const controller = new AbortController()
    const { session, resourceRegistry } = ctx
    const init = async () => {
      try {
        const resolvedUrl = resolveTextureUrl(options.url)
        const texturePromise = session.createTexture({ url: resolvedUrl })
        resourceRegistry.add(options.id, texturePromise)
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
      resourceRegistry.removeAndDestroy(options.id)
      textureRef.current = undefined
      isInitializedRef.current = false
    }
  }, [ctx])

  useEffect(() => {
    if (!ctx || !isInitializedRef.current || !textureRef.current) return
    let cancelled = false
    void (async () => {
      try {
        const resolvedUrl = resolveTextureUrl(options.url)
        const result = await textureRef.current!.updateProperties({
          url: resolvedUrl,
        })
        if (cancelled) return
        if (result.success) {
          options.onLoad?.()
        } else {
          options.onError?.(
            new Error(result.errorMessage || 'Texture update failed'),
          )
        }
      } catch (error: any) {
        if (!cancelled) options.onError?.(error)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [ctx, options.url])

  return null
}
