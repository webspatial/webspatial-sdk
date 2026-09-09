import { useEffect, useRef, useState } from 'react'
import {
  SpatialMaterial,
  SpatialPBRMaterialOptions,
  SpatialSession,
} from '@webspatial/core-sdk'
import { useRealityContext } from '../context'

export type SpatialMaterialFields = {
  color?: string
  textureId?: string
  metalness?: number
  roughness?: number
  transparent?: boolean
  opacity?: number
}

/**
 * Shared native-material lifecycle for `<UnlitMaterial>` and `<PBRMaterial>`.
 *
 * A missing or failed `textureId` is sent as `''` (tint-only); subscribe
 * re-syncs when that texture later registers, reloads, or fails. Omitted
 * props stay undefined and are not serialized (native keeps its value);
 * explicit `0` and `''` are sent. Unmount cancels in-flight work and
 * schedules destroy through the registry so a pending create cannot
 * register after teardown.
 */
export function useSpatialMaterial(
  id: string,
  options: SpatialMaterialFields,
  create: (
    session: SpatialSession,
    options: SpatialPBRMaterialOptions,
  ) => Promise<SpatialMaterial>,
): void {
  const ctx = useRealityContext()
  const materialRef = useRef<SpatialMaterial | undefined>(undefined)
  const [isInitialized, setIsInitialized] = useState(false)
  const [textureRevision, setTextureRevision] = useState(0)
  const { color, textureId, metalness, roughness, transparent, opacity } =
    options

  useEffect(() => {
    if (!ctx || !textureId) return
    return ctx.resourceRegistry.subscribe(textureId, () => {
      setTextureRevision(v => v + 1)
    })
  }, [ctx, textureId])

  useEffect(() => {
    if (!ctx) return
    let cancelled = false
    const materialId = id
    const { session, resourceRegistry } = ctx
    const init = async () => {
      try {
        let textureIdForNative: string | undefined = textureId
        if (textureId && resourceRegistry.has(textureId)) {
          try {
            const textureResource = await resourceRegistry.get(textureId)
            if (cancelled) return
            textureIdForNative = textureResource.id
          } catch {
            textureIdForNative = ''
          }
        } else if (textureId) {
          textureIdForNative = ''
        }
        if (cancelled) return
        const commandOptions: SpatialPBRMaterialOptions = {}
        if (color !== undefined) commandOptions.color = color
        if (metalness !== undefined) commandOptions.metalness = metalness
        if (roughness !== undefined) commandOptions.roughness = roughness
        if (transparent !== undefined) commandOptions.transparent = transparent
        if (opacity !== undefined) commandOptions.opacity = opacity
        commandOptions.textureId = textureIdForNative
        const materialPromise = create(session, commandOptions)
        resourceRegistry.add(materialId, materialPromise)
        const mat = await materialPromise
        if (cancelled) return
        materialRef.current = mat
        setIsInitialized(true)
      } catch (error) {
        console.error(` ~ Material "${materialId}" ~ error:`, error)
      }
    }
    init()

    return () => {
      cancelled = true
      resourceRegistry.removeAndDestroy(materialId)
      materialRef.current = undefined
      setIsInitialized(false)
    }
  }, [ctx, id])

  useEffect(() => {
    if (!ctx || !isInitialized || !materialRef.current) return
    let cancelled = false
    const materialId = id
    void (async () => {
      const updates: SpatialPBRMaterialOptions = {}
      if (color !== undefined) updates.color = color
      if (metalness !== undefined) updates.metalness = metalness
      if (roughness !== undefined) updates.roughness = roughness
      if (transparent !== undefined) updates.transparent = transparent
      if (opacity !== undefined) updates.opacity = opacity
      if (textureId !== undefined) {
        if (textureId === '') {
          updates.textureId = ''
        } else if (!ctx.resourceRegistry.has(textureId)) {
          updates.textureId = ''
        } else {
          try {
            const textureResource = await ctx.resourceRegistry.get(textureId)
            if (cancelled) return
            updates.textureId = textureResource.id
          } catch {
            updates.textureId = ''
          }
        }
      }
      if (cancelled || Object.keys(updates).length === 0) return
      const mat = materialRef.current
      if (!mat) return
      try {
        const result = await mat.updateProperties(updates)
        if (cancelled) return
        if (!result.success) {
          console.error(
            ` ~ Material "${materialId}" ~ update failed:`,
            result.errorMessage ?? result.errorCode,
          )
        }
      } catch (error) {
        if (cancelled) return
        console.error(` ~ Material "${materialId}" ~ update failed:`, error)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [
    ctx,
    id,
    isInitialized,
    textureRevision,
    color,
    textureId,
    metalness,
    roughness,
    transparent,
    opacity,
  ])
}
