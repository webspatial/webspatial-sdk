import { useEffect, useRef, useState } from 'react'
import { SpatialMaterial, SpatialSession } from '@webspatial/core-sdk'
import { useRealityContext } from '../context'

type TextureLookup = {
  has(id: string): boolean
  get(id: string): Promise<{ id: string }>
}

/** Copies own keys whose values are not `undefined` (explicit `0` / `''` / `false` stay). */
function pickDefined<T extends object>(obj: T): Partial<T> {
  const result: Partial<T> = {}
  for (const key of Object.keys(obj) as Array<keyof T>) {
    const value = obj[key]
    if (value !== undefined) {
      result[key] = value
    }
  }
  return result
}

function definedOptionsKey(obj: object): string {
  const defined = pickDefined(obj)
  return JSON.stringify(defined, Object.keys(defined).sort())
}

async function resolveTextureIdForNative(
  textureId: string | undefined,
  resourceRegistry: TextureLookup,
): Promise<string | undefined> {
  if (textureId === undefined) return undefined
  if (textureId === '' || !resourceRegistry.has(textureId)) return ''
  try {
    const textureResource = await resourceRegistry.get(textureId)
    return textureResource.id
  } catch {
    return ''
  }
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
 *
 * JS always normalizes a missing texture to `''` before JSB. visionOS create
 * treats an unknown non-empty id as tint-only; update rejects it. The reject
 * path is therefore an assertion for unexpected native ids, not the JS miss
 * path.
 */
export function useSpatialMaterial<O extends { textureId?: string }>(
  id: string,
  options: O,
  create: (session: SpatialSession, options: O) => Promise<SpatialMaterial<O>>,
): void {
  const ctx = useRealityContext()
  const materialRef = useRef<SpatialMaterial<O> | undefined>(undefined)
  const [isInitialized, setIsInitialized] = useState(false)
  const [textureRevision, setTextureRevision] = useState(0)
  const textureId = options.textureId
  const optionsKey = definedOptionsKey(options)

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
        const commandOptions = pickDefined(options)
        const textureIdForNative = await resolveTextureIdForNative(
          textureId,
          resourceRegistry,
        )
        if (cancelled) return
        if (textureIdForNative !== undefined) {
          commandOptions.textureId = textureIdForNative
        }
        const materialPromise = create(session, commandOptions as O)
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
      const updates = pickDefined(options)
      if (updates.textureId !== undefined) {
        const textureIdForNative = await resolveTextureIdForNative(
          updates.textureId,
          ctx.resourceRegistry,
        )
        if (cancelled) return
        updates.textureId = textureIdForNative
      }
      if (cancelled || Object.keys(updates).length === 0) return
      const mat = materialRef.current
      if (!mat) return
      try {
        const result = await mat.updateProperties(updates as O)
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
  }, [ctx, id, isInitialized, textureRevision, optionsKey])
}
