import React, { forwardRef } from 'react'
import { ParentContext, useRealityContext } from '../context'
import { EntityProps, EntityEventHandler } from '../type'
import { EntityRef, useEntity, useEntityRef } from '../hooks'

type Props = EntityProps & EntityEventHandler & { children?: React.ReactNode }

export const Entity = forwardRef<EntityRef, Props>(
  ({ id, children, position, rotation, scale, onSpatialTap, name }, ref) => {
    const ctx = useRealityContext()
    const entity = useEntity({
      id,
      position,
      rotation,
      scale,
      onSpatialTap,
      createEntity: async () => ctx!.session.createEntity({ id, name }),
    })

    useEntityRef(ref, entity)

    if (!entity) return null
    return (
      <ParentContext.Provider value={entity}>{children}</ParentContext.Provider>
    )
  },
)
