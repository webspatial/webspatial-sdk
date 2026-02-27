import React, { forwardRef } from 'react'
import { SpatialEntity } from '@webspatial/core-sdk'
import {
  ParentContext,
  RealityContextValue,
  useRealityContext,
} from '../context'
import { EntityProps, EntityEventHandler } from '../type'
import { EntityRefShape, useEntity } from '../hooks'

type BaseEntityProps = EntityProps &
  EntityEventHandler & {
    children?: React.ReactNode
    createEntity: (
      ctx: RealityContextValue,
      signal: AbortSignal,
    ) => Promise<SpatialEntity>
  }

export const BaseEntity = forwardRef<EntityRefShape, BaseEntityProps>(
  ({ children, createEntity, ...rest }, ref) => {
    const ctx = useRealityContext()
    const entity = useEntity({
      ...rest,
      ref,
      createEntity: (signal: AbortSignal) => createEntity(ctx, signal),
    })

    if (!entity) return null
    return (
      <ParentContext.Provider value={entity}>{children}</ParentContext.Provider>
    )
  },
)
