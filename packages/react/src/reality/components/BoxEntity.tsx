import React, { forwardRef } from 'react'
import { ParentContext, useRealityContext } from '../context'
import { EntityProps, EntityEventHandler } from '../type'
import { useEntityRef, EntityRef, useEntity } from '../hooks'
import { SpatialMaterial } from '@webspatial/core-sdk'
import { AbortResourceManager } from '../utils'

type BoxProps = {
  width?: number
  height?: number
  depth?: number
  cornerRadius?: number
  splitFaces?: boolean
  materials?: string[]
}

type Props = EntityProps &
  BoxProps &
  EntityEventHandler & {
    children?: React.ReactNode
  }

export const BoxEntity = forwardRef<EntityRef, Props>(
  (
    {
      id,
      width = 0.2,
      height = 0.2,
      depth = 0.1,
      splitFaces = false,
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

          const boxGeometry = await manager.addResource(() =>
            ctx!.session.createBoxGeometry({
              width,
              height,
              depth,
              cornerRadius,
              splitFaces,
            }),
          )

          const materialList: SpatialMaterial[] = await Promise.all(
            materials
              ?.map(id => ctx!.resourceRegistry.get<SpatialMaterial>(id))
              .filter(Boolean) ?? [],
          )
          const modelComponent = await manager.addResource(() =>
            ctx!.session.createModelComponent({
              mesh: boxGeometry,
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

    useEntityRef(ref, entity)

    if (!entity) return null
    return (
      <ParentContext.Provider value={entity}>{children}</ParentContext.Provider>
    )
  },
)
