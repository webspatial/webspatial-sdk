import React, { forwardRef } from 'react'
import { ParentContext, useRealityContext } from '../context'
import { EntityProps, EntityEventHandler } from '../type'
import { useEntityRef, EntityRefShape, useEntity } from '../hooks'
import { SpatialMaterial } from '@webspatial/core-sdk'
import { AbortResourceManager } from '../utils'

type PlaneProps = {
  width?: number
  height?: number
  cornerRadius?: number
  materials?: string[]
}

type Props = EntityProps &
  PlaneProps &
  EntityEventHandler & {
    children?: React.ReactNode
  }

export const PlaneEntity = forwardRef<EntityRefShape, Props>(
  (
    {
      id,
      width = 0.2,
      height = 0.2,
      cornerRadius,
      materials,
      position,
      rotation,
      scale,
      onSpatialTap,
      children,
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
      createEntity: async (signal: AbortSignal) => {
        const manager = new AbortResourceManager(signal)

        try {
          const ent = await manager.addResource(() =>
            ctx!.session.createEntity({ id, name }),
          )

          const planeGeometry = await manager.addResource(() =>
            ctx!.session.createPlaneGeometry({
              width,
              height,
              cornerRadius,
            }),
          )

          const materialList: SpatialMaterial[] = await Promise.all(
            materials
              ?.map(id => ctx!.resourceRegistry.get<SpatialMaterial>(id))
              .filter(Boolean) ?? [],
          )
          const modelComponent = await manager.addResource(() =>
            ctx!.session.createModelComponent({
              mesh: planeGeometry,
              materials: materialList,
            }),
          )

          await ent.addComponent(modelComponent)
          return ent
        } catch (error) {
          await manager.dispose()
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
