import React, { forwardRef } from 'react'
import { ParentContext, useRealityContext } from '../context'
import { EntityProps, EntityEventHandler } from '../type'
import { EntityRef, useEntity, useEntityRef } from '../hooks'

type Props = EntityProps & { model: string } & EntityEventHandler & {
    children?: React.ReactNode
  }

export const ModelEntity = forwardRef<EntityRef, Props>(
  ({ id, model, position, rotation, scale, onSpatialTap, children }, ref) => {
    const ctx = useRealityContext()
    const entity = useEntity({
      id,
      position,
      rotation,
      scale,
      onSpatialTap,
      createEntity: async () => {
        const modelAsset = await ctx!.resourceRegistry.get(model)
        if (!modelAsset)
          throw new Error(`ModelEntity: model not found ${model}`)
        return ctx!.session.createSpatialModelEntity({
          modelAssetId: modelAsset.id,
        })
      },
    })

    useEntityRef(ref, entity)

    if (!entity) return null
    return (
      <ParentContext.Provider value={entity}>{children}</ParentContext.Provider>
    )
  },
)
