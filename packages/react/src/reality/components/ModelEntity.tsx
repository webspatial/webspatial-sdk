import React, { forwardRef } from 'react'
import { EntityProps, EntityEventHandler } from '../type'
import { EntityRefShape } from '../hooks'
import { BaseEntity } from './BaseEntity'

type Props = EntityProps & { model: string } & EntityEventHandler & {
    children?: React.ReactNode
  }

export const ModelEntity = forwardRef<EntityRefShape, Props>(
  ({ id, model, children, name, ...rest }, ref) => {
    return (
      <BaseEntity
        {...rest}
        id={id}
        ref={ref}
        createEntity={async (ctx, signal) => {
          try {
            const modelAsset = await ctx!.resourceRegistry.get(model)
            if (!modelAsset)
              throw new Error(`ModelEntity: model not found ${model}`)
            if (signal.aborted) return null as any

            return ctx!.session.createSpatialModelEntity(
              {
                modelAssetId: modelAsset.id,
                name,
              },
              { id, name },
            )
          } catch (error) {
            return null as any
          }
        }}
      >
        {children}
      </BaseEntity>
    )
  },
)
