import { useEffect, useRef, useState } from 'react'
import {
  SpatialMaterial,
  SpatialPBRMaterialOptions,
  SpatialSession,
  SpatialUnlitMaterialOptions,
} from '@webspatial/core-sdk'
import { useRealityContext } from '../context'

function assignDefinedOptions<O extends object>(
  source: O,
  keys: readonly (keyof O)[],
): Partial<O> {
  const out: Partial<O> = {}
  for (const key of keys) {
    const value = source[key]
    if (value !== undefined) {
      out[key] = value
    }
  }
  return out
}

/**
 * Shared lifecycle for material components (`<UnlitMaterial>`, `<PBRMaterial>`).
 *
 * Owns the full native-material lifecycle so each material kind only declares
 * its option keys and create call:
 * - creates the native material on mount and registers it in the
 *   ResourceRegistry under the user-facing `id`,
 * - resolves a user-facing `textureId` to the native texture id, falling back
 *   to tint-only (`textureId: ''`) while the texture is missing or failed,
 * - subscribes to the texture id so a `<Texture>` that registers, reloads, or
 *   fails later re-syncs this material,
 * - pushes prop changes to the native side via `updateProperties`,
 * - destroys the native material on unmount (scheduled through the registry).
 *
 * `optionKeys` must be a module-level constant: it sizes the update effect's
 * dependency array, so its length and order have to be stable across renders.
 *
 * Omitted option keys stay `undefined` and are not serialized, so native keeps
 * its current value. Explicit values (including `0` and `''`) are sent through.
 */
export function useSpatialMaterial<
  O extends SpatialUnlitMaterialOptions | SpatialPBRMaterialOptions,
>(
  id: string,
  options: O,
  optionKeys: readonly (keyof O & string)[],
  create: (
    session: SpatialSession,
    options: Partial<O>,
  ) => Promise<SpatialMaterial>,
): void {
  const ctx = useRealityContext()
  const materialRef = useRef<SpatialMaterial | undefined>(undefined)
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
    const materialId = id
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
        const commandOptions = assignDefinedOptions(options, optionKeys)
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
      // Use registry to schedule destruction after promise resolves
      resourceRegistry.removeAndDestroy(materialId)
      materialRef.current = undefined
      setIsInitialized(false)
    }
  }, [ctx, id])

  // Dynamic property updates
  useEffect(() => {
    if (!ctx || !isInitialized || !materialRef.current) return
    let cancelled = false
    void (async () => {
      const updates = assignDefinedOptions(
        options,
        optionKeys.filter(key => key !== 'textureId'),
      )
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
    textureRevision,
    ...optionKeys.map(key => options[key]),
  ])
}
