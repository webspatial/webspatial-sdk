import React, { forwardRef } from 'react'
import { EntityProps, EntityEventHandler } from '../type'
import { EntityRefShape } from '../hooks'
import { SpatialMaterial, SpatialGeometry } from '@webspatial/core-sdk'
import { AbortResourceManager } from '../utils'
import { BaseEntity } from './BaseEntity'

type GeometryEntityProps = EntityProps &
  EntityEventHandler & {
    children?: React.ReactNode
    materials?: string[]
    geometryOptions: any
    createGeometry: (options: any) => Promise<SpatialGeometry>
  }

export const GeometryEntity = forwardRef<EntityRefShape, GeometryEntityProps>(
  (
    { id, children, name, materials, geometryOptions, createGeometry, ...rest },
    ref,
  ) => {
    return (
      <BaseEntity
        {...rest}
        id={id}
        ref={ref}
        createEntity={async (ctx, signal) => {
          const manager = new AbortResourceManager(signal)
          try {
            const ent = await manager.addResource(() =>
              ctx!.session.createEntity({ id, name }),
            )

            const geometry = await manager.addResource(() =>
              createGeometry(geometryOptions),
            )

            const materialList: SpatialMaterial[] = await Promise.all(
              materials
                ?.map(id => ctx!.resourceRegistry.get<SpatialMaterial>(id))
                .filter(Boolean) ?? [],
            )
            const modelComponent = await manager.addResource(() =>
              ctx!.session.createModelComponent({
                mesh: geometry,
                materials: materialList,
              }),
            )

            await ent.addComponent(modelComponent)
            return ent
          } catch (error) {
            await manager.dispose()
            return null as any
          }
        }}
      >
        {children}
      </BaseEntity>
    )
  },
)
