import React, { useEffect, useRef, useState } from 'react'
import { SpatialEntity, Vec3 } from '@webspatial/core-sdk'
import { ParentContext, useParentContext, useRealityContext } from '../context'
import { EntityEventHandler, EntityProps } from '../type'
import { useEntityEvent, useEntityTransform } from '../hooks'

type Props = {
  children?: React.ReactNode
} & EntityProps &
  EntityEventHandler

export const Entity: React.FC<Props> = ({
  children,
  position,
  rotation,
  scale,
  onTap,
}) => {
  const ctx = useRealityContext()
  const parent = useParentContext()
  const [entity, setEntity] = useState<SpatialEntity | null>(null)

  useEntityEvent({ entity, onTap })

  useEffect(() => {
    let cancelled = false
    if (!ctx) return
    const { reality } = ctx
    const init = async () => {
      const ent = await ctx.session.createEntity()
      if (cancelled) {
        ent.destroy()
        return
      }
      if (parent) {
        await parent.addEntity(ent)
      } else {
        await reality.addEntity(ent)
      }
      setEntity(ent)
    }

    init()

    return () => {
      cancelled = true
      entity?.destroy()
    }
  }, [ctx, parent])

  useEntityTransform(entity, { position, rotation, scale })

  if (!entity) return null

  return (
    <ParentContext.Provider value={entity}>{children}</ParentContext.Provider>
  )
}
