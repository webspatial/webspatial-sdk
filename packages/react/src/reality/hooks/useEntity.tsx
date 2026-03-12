import { ForwardedRef, useEffect, useRef, useState } from 'react'
import { SpatialEntity, Vec3 } from '@webspatial/core-sdk'
import { useRealityContext, useParentContext } from '../context'
import { EntityEventHandler, EntityProps } from '../type'
import {
  EntityRefShape,
  EntityRef,
  useEntityEvent,
  useEntityId,
  useEntityRef,
  useEntityTransform,
  useForceUpdate,
} from '../hooks'

type UseEntityOptions = {
  createEntity: (signal: AbortSignal) => Promise<SpatialEntity>
} & EntityProps &
  EntityEventHandler & { ref: ForwardedRef<EntityRefShape> }

export const useEntity = ({
  ref,
  id,
  position,
  rotation,
  scale,
  onSpatialTap,
  createEntity,
}: UseEntityOptions) => {
  const ctx = useRealityContext()
  const parent = useParentContext()
  const instanceRef = useRef<EntityRef>(new EntityRef(null, ctx))

  const forceUpdate = useForceUpdate()

  // Deferred cleanup timer for StrictMode safety.
  const cleanupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!ctx) return

    // Cancel any pending cleanup from StrictMode's fake unmount
    if (cleanupTimerRef.current !== null) {
      clearTimeout(cleanupTimerRef.current)
      cleanupTimerRef.current = null
    }

    // Already created (StrictMode remount) — skip
    if (instanceRef.current.entity) return

    const controller = new AbortController()

    const init = async () => {
      try {
        const ent = await createEntity(controller.signal)
        if (!ent) return
        if (controller.signal.aborted) {
          ent.destroy()
          return
        }
        if (parent) {
          const result = await parent.addEntity(ent)
          if (!result.success) throw new Error('parent.addEntity failed')
        } else {
          const result = await ctx.reality.addEntity(ent)
          if (!result.success) throw new Error('ctx.reality.addEntity failed')
        }

        instanceRef.current?.updateEntity(ent)
        forceUpdate()
      } catch (error) {
        console.error('useEntity init ~ error:', error)
      }
    }

    init()

    return () => {
      controller.abort()
      // Defer cleanup so StrictMode's immediate remount can cancel it.
      cleanupTimerRef.current = setTimeout(() => {
        cleanupTimerRef.current = null
        instanceRef.current?.destroy()
      }, 0)
    }
  }, [ctx, parent])

  useEntityId({ id, entity: instanceRef.current.entity })
  useEntityTransform(instanceRef.current.entity, { position, rotation, scale })
  useEntityRef(ref, instanceRef.current)

  useEntityEvent({
    instance: instanceRef.current,
    onSpatialTap,
    // TODO: add other event handlers
  })

  return instanceRef.current.entity
}
