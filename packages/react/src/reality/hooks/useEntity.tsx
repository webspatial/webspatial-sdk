import { useEffect, useState } from 'react'
import { SpatialEntity, Vec3 } from '@webspatial/core-sdk'
import { useRealityContext, useParentContext } from '../context'
import { EntityEventHandler, EntityProps } from '../type'
import { useEntityEvent, useEntityId, useEntityTransform } from '../hooks'

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
  const [entity, setEntity] = useState<SpatialEntity | null>(null)

  useEntityEvent({ entity, onSpatialTap })

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
      setEntity(ent)
    }

    init()

    return () => {
      cancelled = true
      entity?.destroy()
    }
  }, [ctx, parent])

  useEntityId({ id, entity })
  useEntityTransform(entity, { position, rotation, scale })

  return entity
}
