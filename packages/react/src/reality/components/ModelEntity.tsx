import React, { useEffect, useRef, useState } from 'react'
import {
  SpatialEntity,
  SpatialMaterial,
  SpatialModelAsset,
  SpatialObject,
} from '@webspatial/core-sdk'
import { ParentContext, useParentContext, useRealityContext } from '../context'
import { EntityEventHandler, EntityProps } from '../type'
import { useEntityEvent, useEntityTransform } from '../hooks'
type Props = {
  children?: React.ReactNode
} & EntityProps & {
    model: string // name
  } & EntityEventHandler

export const ModelEntity: React.FC<Props> = ({
  children,
  model,
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
      // work start

      const modelAsset =
        await ctx.resourceRegistry.get<SpatialModelAsset>(model)
      if (!modelAsset) {
        console.error('ModelEntity: model not found', model)
        return
      }
      const ent = await ctx.session.createSpatialModelEntity({
        modelAssetId: modelAsset.id,
      })
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

  useEntityTransform(entity, { position, rotation, scale })

  if (!entity) return null

  return (
    <ParentContext.Provider value={entity}>{children}</ParentContext.Provider>
  )
}
