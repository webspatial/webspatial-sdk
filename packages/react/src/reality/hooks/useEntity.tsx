import { useEffect, useRef, useState } from 'react'
import { SpatialEntity, Vec3 } from '@webspatial/core-sdk'
import { useRealityContext, useParentContext } from '../context'
import { EntityEventHandler, EntityProps } from '../type'
import {
  useEntityEvent,
  useEntityId,
  useEntityTransform,
  useForceUpdate,
} from '../hooks'

type UseEntityOptions = {
  createEntity: (signal: AbortSignal) => Promise<SpatialEntity>
} & EntityProps &
  EntityEventHandler

export const useEntity = ({
  id,
  position,
  rotation,
  scale,
  onSpatialTap,
  createEntity,
}: UseEntityOptions) => {
  const ctx = useRealityContext()
  const parent = useParentContext()
  const entityRef = useRef<SpatialEntity | null>(null)

  const forceUpdate = useForceUpdate()

  useEntityEvent({ entity: entityRef.current, onSpatialTap })

  useEffect(() => {
    if (!ctx) return
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

        entityRef.current = ent
        forceUpdate()
      } catch (error) {
        console.error('useEntity init ~ error:', error)
      }
    }

    init()

    return () => {
      controller.abort()
      entityRef.current?.destroy()
    }
  }, [ctx, parent])

  useEntityId({ id, entity: entityRef.current })
  useEntityTransform(entityRef.current, { position, rotation, scale })

  return entityRef.current
}
