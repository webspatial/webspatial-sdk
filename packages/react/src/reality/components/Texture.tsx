import React, { useEffect, useRef } from 'react'
import { SpatialTextureResource } from '@webspatial/core-sdk'
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
  const textureRef = useRef<SpatialTextureResource | null>(null)

  // Destroy only when the logical texture slot (ctx + id) goes away — not on url changes.
  useEffect(() => {
    if (!ctx) return
    const { resourceRegistry } = ctx
    const capturedId = id
    return () => {
      textureRef.current = null
      resourceRegistry.removeAndDestroy(capturedId)
    }
  }, [ctx, id])

  // Initial load and subsequent URL changes: keep the same native texture and use
  // updateProperties({ url }) so materials bound by native id stay valid.
  useEffect(() => {
    if (!ctx) return
    const { session, resourceRegistry } = ctx
    let cancelled = false

    void (async () => {
      const resolvedUrl = getAbsoluteUrl(url)
      try {
        if (textureRef.current) {
          await textureRef.current.updateProperties({ url: resolvedUrl })
          resourceRegistry.notify(id)
        } else {
          const texturePromise = session.createTexture({ url: resolvedUrl })
          resourceRegistry.add(id, texturePromise)
          const tex = await texturePromise
          if (cancelled) {
            tex.destroy()
            return
          }
          textureRef.current = tex
        }
        if (!cancelled) onLoad?.()
      } catch (error: unknown) {
        if (!cancelled) onError?.(error)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [ctx, id, url])

  return null
}
