import React, { forwardRef } from 'react'
import { ParentContext, useRealityContext } from '../context'
import { EntityProps, EntityEventHandler } from '../type'
import { useEntityRef, EntityRefShape, useEntity } from '../hooks'
import { SpatialMaterial, SpatialGeometry } from '@webspatial/core-sdk'
import { AbortResourceManager } from '../utils'

type GeometryEntityProps = EntityProps &
  EntityEventHandler & {
    children?: React.ReactNode
    materials?: string[]
    geometryOptions: any
    createGeometry: (options: any) => Promise<SpatialGeometry>
  }

export const GeometryEntity = forwardRef<EntityRefShape, GeometryEntityProps>(
  (
    {
      id,
      position,
      rotation,
      scale,
      onSpatialTap,
      onSpatialDragStart,
      onSpatialDrag,
      onSpatialDragEnd,
      onSpatialRotateStart,
      onSpatialRotate,
      onSpatialRotateEnd,
      onSpatialMagnifyStart,
      onSpatialMagnify,
      onSpatialMagnifyEnd,
      // TODO: add other event handlers
      children,
      name,
      materials,
      geometryOptions,
      createGeometry,
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
      onSpatialRotateStart,
      onSpatialRotate,
      onSpatialRotateEnd,
      onSpatialMagnifyStart,
      onSpatialMagnify,
      onSpatialMagnifyEnd,

      createEntity: async (signal: AbortSignal) => {
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
          if (error instanceof DOMException && error.name === 'AbortError') {
            // AbortError is expected, just ignore it
          } else {
            console.error(error)
          }
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
