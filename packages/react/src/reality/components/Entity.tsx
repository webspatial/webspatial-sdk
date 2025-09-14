import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { SpatialEntity, Vec3 } from '@webspatial/core-sdk'
import { ParentContext, useParentContext, useRealityContext } from '../context'
import { EntityEventHandler, EntityProps } from '../type'
import { useEntityEvent, useEntityId, useEntityTransform } from '../hooks'
import { ResourceRegistry } from '../utils'

type Props = {
  children?: React.ReactNode
} & EntityProps &
  EntityEventHandler

export type EntityRef = {
  convertFromEntityToEntity: (
    fromEntityId: string,
    toEntityId: string,
    position: Vec3,
  ) => Promise<Vec3>
  convertFromEntityToScene: (entityId: string, position: Vec3) => Promise<Vec3>
}

export const Entity = forwardRef<EntityRef, Props>(
  ({ id, children, position, rotation, scale, onSpatialTap }, ref) => {
    const ctx = useRealityContext()
    const parent = useParentContext()
    const [entity, setEntity] = useState<SpatialEntity | null>(null)

    useEntityEvent({ entity, onSpatialTap })

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
    useEntityId({ id, entity })

    useImperativeHandle(ref, () => ({
      convertFromEntityToEntity: async (
        fromEntityId: string,
        toEntityId: string,
        position: Vec3,
      ) => {
        if (!entity) {
          console.warn('entity 尚未初始化')
          return Promise.resolve(position)
        }

        const fromEntity = await ctx?.resourceRegistry.get(fromEntityId)
        const toEntity = await ctx?.resourceRegistry.get(toEntityId)
        if (!fromEntity || !toEntity) {
          console.warn('entity 尚未初始化')
          return Promise.resolve(position)
        }
        return (
          await entity.convertFromEntityToEntity(
            fromEntity.id,
            toEntity.id,
            position,
          )
        ).data
      },
      convertFromEntityToScene: async (entityId: string, position: Vec3) => {
        if (!entity) {
          console.warn('entity 尚未初始化')
          return Promise.resolve(position)
        }
        const ent = await ctx?.resourceRegistry.get(entityId)
        if (!ent) {
          console.warn('entity 尚未初始化')
          return Promise.resolve(position)
        }
        return (await entity.convertFromEntityToScene(ent.id, position)).data
      },
    }))

    if (!entity) return null

    return (
      <ParentContext.Provider value={entity}>{children}</ParentContext.Provider>
    )
  },
)
