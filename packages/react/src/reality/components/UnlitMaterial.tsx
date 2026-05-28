import React, { useEffect, useRef, useState } from 'react'
import {
  SpatialUnlitMaterial,
  SpatialUnlitMaterialOptions,
} from '@webspatial/core-sdk'
import { useRealityContext } from '../context'

export type UnlitMaterialProps = {
  children?: React.ReactNode
  id: string // user id
} & SpatialUnlitMaterialOptions

export const UnlitMaterial: React.FC<UnlitMaterialProps> = ({
  children,
  ...options
}) => {
  const ctx = useRealityContext()
  const materialRef = useRef<SpatialUnlitMaterial | undefined>(undefined)
  const [isInitialized, setIsInitialized] = useState(false)
  const [textureRevision, setTextureRevision] = useState(0)

  useEffect(() => {
    if (!ctx || !options.textureId) return
    return ctx.resourceRegistry.subscribe(options.textureId, () => {
      setTextureRevision(v => v + 1)
    })
  }, [ctx, options.textureId])

  useEffect(() => {
    if (!ctx) return
    let cancelled = false
    const materialId = options.id
    const { session, resourceRegistry } = ctx
    const init = async () => {
      try {
        let textureIdForNative: string | undefined = options.textureId
        if (options.textureId && resourceRegistry.has(options.textureId)) {
          try {
            const textureResource = await resourceRegistry.get(
              options.textureId,
            )
            if (cancelled) return
            textureIdForNative = textureResource.id
          } catch {
            // failed texture → tint-only
            textureIdForNative = ''
          }
        } else if (options.textureId) {
          // no Texture for this id yet → tint-only; subscribe picks up add() later
          textureIdForNative = ''
        }
        if (cancelled) return
        const commandOptions: SpatialUnlitMaterialOptions = {
          color: options.color,
          textureId: textureIdForNative,
          transparent: options.transparent,
          opacity: options.opacity,
        }
        const materialPromise = session.createUnlitMaterial(commandOptions)
        resourceRegistry.add(materialId, materialPromise)
        const mat = await materialPromise
        if (cancelled) return
        materialRef.current = mat
        setIsInitialized(true)
      } catch (error) {
        console.error(' ~ UnlitMaterial ~ error:', error)
      }
    }
    init()

    return () => {
      cancelled = true
      // Use registry to schedule destruction after promise resolves
      resourceRegistry.removeAndDestroy(materialId)
      materialRef.current = undefined
      setIsInitialized(false)
    }
  }, [ctx, options.id])

  // Dynamic property updates
  useEffect(() => {
    if (!ctx || !isInitialized || !materialRef.current) return
    let cancelled = false
    void (async () => {
      const updates: Partial<SpatialUnlitMaterialOptions> = {}
      if (options.color !== undefined) updates.color = options.color
      if (options.transparent !== undefined)
        updates.transparent = options.transparent
      if (options.opacity !== undefined) updates.opacity = options.opacity
      if (options.textureId !== undefined) {
        if (options.textureId === '') {
          updates.textureId = ''
        } else if (!ctx.resourceRegistry.has(options.textureId)) {
          updates.textureId = ''
        } else {
          const texturePromise = ctx.resourceRegistry.get(options.textureId)
          try {
            const textureResource = await texturePromise
            if (cancelled) return
            updates.textureId = textureResource.id
          } catch {
            updates.textureId = ''
          }
        }
      }
      if (cancelled || Object.keys(updates).length === 0) return
      const mat = materialRef.current
      if (mat) {
        void mat.updateProperties(updates).catch(() => {})
      }
    })()
    return () => {
      cancelled = true
    }
  }, [
    ctx,
    isInitialized,
    options.color,
    options.textureId,
    options.transparent,
    options.opacity,
    textureRevision,
  ])

  return null
}
