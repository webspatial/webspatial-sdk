import React, { useEffect, useRef, useState } from 'react'
import {
  SpatialEntity,
  SpatialMaterial,
  SpatialObject,
} from '@webspatial/core-sdk'
import { ParentContext, useParentContext, useRealityContext } from '../context'
import { EntityEventHandler, EntityProps } from '../type'
import { useEntityEvent, useEntityId, useEntityTransform } from '../hooks'
type Props = {
  children?: React.ReactNode
} & EntityProps &
  BoxProps &
  EntityEventHandler

type BoxProps = {
  width?: number
  height?: number
  depth?: number
  cornerRadius?: number
  materials?: string[]
}

export const BoxEntity: React.FC<Props> = ({
  id,
  children,
  width = 0.2,
  height = 0.2,
  depth = 0.1,
  cornerRadius,
  materials,
  position,
  rotation,
  scale,
  onSpatialTap,
}) => {
  const ctx = useRealityContext()
  const parent = useParentContext()
  const [entity, setEntity] = useState<SpatialEntity | null>(null)

  useEntityEvent({ entity, onSpatialTap })

  useEffect(() => {
    let cancelled = false
    if (!ctx) return
    const { reality } = ctx
    const init = async () => {
      // createBoxGeometry + createModelComponent
      const ent = await ctx.session.createEntity()

      // work start

      const boxGeometry = await ctx.session.createBoxGeometry({
        width,
        height,
        depth,
        cornerRadius,
      })

      const materialList = await Promise.all(
        materials
          ?.map(id => ctx.resourceRegistry.get<SpatialMaterial>(id))
          .filter(Boolean) ?? [],
      )
      const modelComponent = await ctx.session.createModelComponent({
        mesh: boxGeometry,
        materials: materialList,
      })
      await ent.addComponent(modelComponent)
      if (cancelled) {
        ent.destroy()
        return
      }
      // work end

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

  useEntityId({ id, entity })

  useEntityTransform(entity, { position, rotation, scale })

  if (!entity) return null

  return (
    <ParentContext.Provider value={entity}>{children}</ParentContext.Provider>
  )
}
