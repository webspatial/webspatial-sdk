import React, { forwardRef, useEffect, useRef } from 'react'
import { EntityProps, EntityEventHandler } from '../type'
import { EntityRefShape } from '../hooks'
import {
  SpatialMaterial,
  SpatialGeometry,
  SpatialComponent,
  SpatialEntity,
} from '@webspatial/core-sdk'
import { AbortResourceManager } from '../utils'
import { shallowEqualObject, shallowEqualArray } from '../utils'
import { BaseEntity } from './BaseEntity'
import { useRealityContext } from '../context'

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
    const ctx = useRealityContext()
    const entityRef = useRef<SpatialEntity | null>(null)
    const componentRef = useRef<SpatialComponent | null>(null)
    const lastGeometryOptionsRef = useRef<any>(null)
    const lastMaterialsRef = useRef<string[] | undefined>(undefined)
    const isInitializedRef = useRef(false)

    // Dynamic geometry/material rebuild
    useEffect(() => {
      if (!ctx || !entityRef.current || !isInitializedRef.current) return

      const geometryChanged = !shallowEqualObject(
        lastGeometryOptionsRef.current,
        geometryOptions,
      )
      const materialsChanged = !shallowEqualArray(
        lastMaterialsRef.current,
        materials,
      )

      if (!geometryChanged && !materialsChanged) return

      lastGeometryOptionsRef.current = geometryOptions
      lastMaterialsRef.current = materials

      const rebuild = async () => {
        const entity = entityRef.current
        if (!entity) return

        try {
          // Remove old component
          if (componentRef.current) {
            await entity.removeComponent(componentRef.current)
            componentRef.current.destroy()
            componentRef.current = null
          }

          // Create new geometry
          const geometry = await createGeometry(geometryOptions)

          // Resolve materials
          const materialList: SpatialMaterial[] = await Promise.all(
            materials
              ?.map(mid => ctx.resourceRegistry.get<SpatialMaterial>(mid))
              .filter(Boolean) ?? [],
          )

          // Create new model component
          const modelComponent = await ctx.session.createModelComponent({
            mesh: geometry,
            materials: materialList,
          })

          // Add to entity
          await entity.addComponent(modelComponent)
          componentRef.current = modelComponent
        } catch (error) {
          console.error('GeometryEntity: rebuild failed', error)
        }
      }
      rebuild()
    }, [
      ctx,
      geometryOptions?.width,
      geometryOptions?.height,
      geometryOptions?.depth,
      geometryOptions?.cornerRadius,
      geometryOptions?.splitFaces,
      geometryOptions?.radius,
      materials,
    ])

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

            entityRef.current = ent
            componentRef.current = modelComponent
            lastGeometryOptionsRef.current = geometryOptions
            lastMaterialsRef.current = materials
            isInitializedRef.current = true

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
