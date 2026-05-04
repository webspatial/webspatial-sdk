import React, { useEffect, useRef } from 'react'
import {
  SpatialPBRMaterial,
  SpatialPBRMaterialOptions,
} from '@webspatial/core-sdk'
import { useRealityContext } from '../context'

export type PBRMaterialProps = {
  children?: React.ReactNode
  id: string // user id
} & SpatialPBRMaterialOptions

export const PBRMaterial: React.FC<PBRMaterialProps> = ({
  children,
  ...options
}) => {
  const ctx = useRealityContext()
  const materialRef = useRef<SpatialPBRMaterial | undefined>(undefined)
  const isInitializedRef = useRef(false)

  useEffect(() => {
    if (!ctx) return
    const { session, resourceRegistry } = ctx
    const init = async () => {
      try {
        let textureIdForNative = options.textureId
        if (options.textureId) {
          const texturePromise = resourceRegistry.get(options.textureId)
          if (texturePromise) {
            try {
              const textureResource = await texturePromise
              textureIdForNative = textureResource.id
            } catch {
              return
            }
          }
        }
        const commandOptions: SpatialPBRMaterialOptions = {
          color: options.color,
          textureId: textureIdForNative,
          metalness: options.metalness,
          roughness: options.roughness,
          emissiveColor: options.emissiveColor,
          emissiveIntensity: options.emissiveIntensity,
          transparent: options.transparent,
          opacity: options.opacity,
        }
        const materialPromise = session.createPBRMaterial(commandOptions)
        resourceRegistry.add(options.id, materialPromise)
        const mat = await materialPromise
        materialRef.current = mat
        isInitializedRef.current = true
      } catch (error) {
        console.error(' ~ PBRMaterial ~ error:', error)
      }
    }
    init()

    return () => {
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
      const updates: Partial<SpatialPBRMaterialOptions> = {}
      if (options.color !== undefined) updates.color = options.color
      if (options.textureId !== undefined) {
        if (options.textureId === '') {
          updates.textureId = ''
        } else {
          const texturePromise = ctx.resourceRegistry.get(options.textureId)
          if (texturePromise) {
            try {
              const textureResource = await texturePromise
              if (cancelled) return
              updates.textureId = textureResource.id
            } catch {
              return
            }
          } else {
            updates.textureId = options.textureId
          }
        }
      }
      if (options.metalness !== undefined) updates.metalness = options.metalness
      if (options.roughness !== undefined) updates.roughness = options.roughness
      if (options.emissiveColor !== undefined)
        updates.emissiveColor = options.emissiveColor
      if (options.emissiveIntensity !== undefined)
        updates.emissiveIntensity = options.emissiveIntensity
      if (options.transparent !== undefined)
        updates.transparent = options.transparent
      if (options.opacity !== undefined) updates.opacity = options.opacity
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
    options.color,
    options.textureId,
    options.metalness,
    options.roughness,
    options.emissiveColor,
    options.emissiveIntensity,
    options.transparent,
    options.opacity,
  ])

  return null
}
