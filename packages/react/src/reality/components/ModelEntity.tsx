import React, { forwardRef } from 'react'
import { ParentContext, useRealityContext } from '../context'
import { EntityProps, EntityEventHandler } from '../type'
import { EntityRefShape, useEntity, useEntityRef } from '../hooks'

type Props = EntityProps & { model: string } & EntityEventHandler & {
    children?: React.ReactNode
  }

export const ModelEntity = forwardRef<EntityRefShape, Props>(
  (
    { id, model, position, rotation, scale, onSpatialTap, children, name },
    ref,
  ) => {
    const ctx = useRealityContext()
    const entity = useEntity({
      ref,
      id,
      position,
      rotation,
      scale,
      onSpatialTap,
      createEntity: async (signal: AbortSignal) => {
        try {
          const modelAsset = await ctx!.resourceRegistry.get(model)
          if (!modelAsset)
            throw new Error(`ModelEntity: model not found ${model}`)
          if (signal.aborted) {
            return null
          }

          return ctx!.session.createSpatialModelEntity(
            {
              modelAssetId: modelAsset.id,
              name,
            },
            { id, name },
          )
        } catch (error) {
          // error already handled in ModelAsset, no need to log again
          // console.error('ModelEntity error:', error)
          return null as any
        }
      },
    })

    if (!entity) return null
    return (
      <ParentContext.Provider value={entity}>{children}</ParentContext.Provider>
    )
  },
)
