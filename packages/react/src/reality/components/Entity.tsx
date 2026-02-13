import React, { forwardRef } from 'react'
import { ParentContext, useRealityContext } from '../context'
import { EntityProps, EntityEventHandler } from '../type'
import { EntityRefShape, useEntity, useEntityRef } from '../hooks'

type Props = EntityProps & EntityEventHandler & { children?: React.ReactNode }

export const Entity = forwardRef<EntityRefShape, Props>(
  (
    {
      id,
      children,
      position,
      rotation,
      scale,
      onSpatialTap,
      onSpatialDragStart,
      onSpatialDrag,
      onSpatialDragEnd,
      onSpatialRotate,
      onSpatialRotateEnd,
      onSpatialMagnify,
      onSpatialMagnifyEnd,
      name,
    },
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
      onSpatialDragStart,
      onSpatialDrag,
      onSpatialDragEnd,
      onSpatialRotate,
      onSpatialRotateEnd,
      onSpatialMagnify,
      onSpatialMagnifyEnd,
      createEntity: async () => ctx!.session.createEntity({ id, name }),
    })

    if (!entity) return null
    return (
      <ParentContext.Provider value={entity}>{children}</ParentContext.Provider>
    )
  },
)
