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
  createEntity: () => Promise<SpatialEntity>
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
    let cancelled = false

    const init = async () => {
      const ent = await createEntity()
      if (cancelled) {
        ent.destroy()
        return
      }
      if (parent) {
        await parent.addEntity(ent)
      } else {
        await ctx.reality.addEntity(ent)
      }
      entityRef.current = ent
      forceUpdate()
    }

    init()

    return () => {
      cancelled = true
      entityRef.current?.destroy()
    }
  }, [ctx, parent])

  useEntityId({ id, entity: entityRef.current })
  useEntityTransform(entityRef.current, { position, rotation, scale })

  return entityRef.current
}
