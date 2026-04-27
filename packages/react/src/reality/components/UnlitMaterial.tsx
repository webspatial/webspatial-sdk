import React, { useEffect, useRef } from 'react'
import {
  SpatialObject,
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
  const isInitializedRef = useRef(false)

  useEffect(() => {
    if (!ctx) return
    const { session, reality, resourceRegistry } = ctx
    const init = async () => {
      let textureIdForNative = options.textureId
      if (options.textureId) {
        const texturePending = resourceRegistry.get<SpatialObject>(
          options.textureId,
        )
        if (texturePending) {
          const textureResource = await texturePending
          textureIdForNative = textureResource.id
        }
      }
      const commandOptions: SpatialUnlitMaterialOptions = {
        color: options.color,
        textureId: textureIdForNative,
        transparent: options.transparent,
        opacity: options.opacity,
      }
      const materialPromise = session.createUnlitMaterial(commandOptions)
      resourceRegistry.add(options.id, materialPromise)
      try {
        const mat = await materialPromise
        materialRef.current = mat
        isInitializedRef.current = true
      } catch (error) {
        console.error(' ~ UnlitMaterial ~ error:', error)
      }
    }
    init()

    return () => {
      // Use registry to schedule destruction after promise resolves
      resourceRegistry.removeAndDestroy(options.id)
      materialRef.current = undefined
      isInitializedRef.current = false
    }
  }, [ctx])

  // Dynamic property updates
  useEffect(() => {
    if (!ctx || !isInitializedRef.current || !materialRef.current) return
    let cancelled = false
    void (async () => {
      const updates: Partial<SpatialUnlitMaterialOptions> = {}
      if (options.color !== undefined) updates.color = options.color
      if (options.textureId !== undefined) {
        if (options.textureId === '') {
          updates.textureId = ''
        } else {
          const texturePending = ctx.resourceRegistry.get<SpatialObject>(
            options.textureId,
          )
          if (texturePending) {
            const textureResource = await texturePending
            if (cancelled) return
            updates.textureId = textureResource.id
          } else {
            updates.textureId = options.textureId
          }
        }
      }
      if (options.transparent !== undefined)
        updates.transparent = options.transparent
      if (options.opacity !== undefined) updates.opacity = options.opacity
      if (cancelled || Object.keys(updates).length === 0) return
      materialRef.current?.updateProperties(updates)
    })()
    return () => {
      cancelled = true
    }
  }, [
    ctx,
    options.color,
    options.textureId,
    options.transparent,
    options.opacity,
  ])

  return null
}
