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

export type GeometryEntityProps = EntityProps &
  EntityEventHandler & {
    children?: React.ReactNode
    materials?: string[]
    geometryOptions: any
    createGeometry: (options: any) => Promise<SpatialGeometry>
  }

type LastGeometrySnapshot = {
  geometryOptions: any
  materials: string[] | undefined
}

type GeometryEntityMutable = {
  lastSnapshot: LastGeometrySnapshot | null
  rebuildGen: number
}

export const GeometryEntity = forwardRef<EntityRefShape, GeometryEntityProps>(
  (
    { id, children, name, materials, geometryOptions, createGeometry, ...rest },
    ref,
  ) => {
    const ctx = useRealityContext()
    const entityRef = useRef<SpatialEntity | null>(null)
    const componentRef = useRef<SpatialComponent | null>(null)
    // Tracks the last applied mesh + materials, plus a generation counter so
    // overlapping async rebuilds (e.g. fast sliders) cannot apply out of order.
    const mutableRef = useRef<GeometryEntityMutable>({
      lastSnapshot: null,
      rebuildGen: 0,
    })

    useEffect(() => {
      const { lastSnapshot } = mutableRef.current
      if (!ctx || !entityRef.current || lastSnapshot === null) return

      // Parents may pass a new options object each render with the same values;
      // shallow compare avoids ripping down the mesh when nothing meaningful changed.
      const geometryChanged = !shallowEqualObject(
        lastSnapshot.geometryOptions,
        geometryOptions,
      )
      const materialsChanged = !shallowEqualArray(
        lastSnapshot.materials,
        materials,
      )

      if (!geometryChanged && !materialsChanged) return

      mutableRef.current.lastSnapshot = { geometryOptions, materials }
      mutableRef.current.rebuildGen += 1
      const gen = mutableRef.current.rebuildGen

      const rebuild = async () => {
        const entity = entityRef.current
        if (!entity) return

        try {
          const oldComponent = componentRef.current
          if (oldComponent) {
            // TODO(P2): Rebuild removes/destroys the model component but not the previous mesh
            // `SpatialGeometry`; those objects stay registered until explicitly destroyed (native
            // `SpatialModelComponent.onDestroy` also only nils `mesh`). Destroy the prior mesh after
            // teardown or fix cascade destroy on the Swift side to cap memory on long-lived updates.
            await entity.removeComponent(oldComponent)
            await oldComponent.destroy()
            componentRef.current = null
            if (gen !== mutableRef.current.rebuildGen) return
          }

          const geometry = await createGeometry(geometryOptions)
          // A newer rebuild started; drop this mesh so it is not left orphaned.
          if (gen !== mutableRef.current.rebuildGen) {
            await geometry.destroy()
            return
          }

          const materialList: SpatialMaterial[] = await Promise.all(
            materials
              ?.map(mid => ctx.resourceRegistry.get<SpatialMaterial>(mid))
              .filter(Boolean) ?? [],
          )
          if (gen !== mutableRef.current.rebuildGen) {
            await geometry.destroy()
            return
          }

          const modelComponent = await ctx.session.createModelComponent({
            mesh: geometry,
            materials: materialList,
          })
          if (gen !== mutableRef.current.rebuildGen) {
            await modelComponent.destroy()
            await geometry.destroy()
            return
          }

          await entity.addComponent(modelComponent)
          componentRef.current = modelComponent
        } catch (error) {
          if (gen === mutableRef.current.rebuildGen) {
            console.error('GeometryEntity: rebuild failed', error)
          }
        }
      }
      rebuild()
    }, [ctx, geometryOptions, materials, createGeometry])

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
            mutableRef.current.lastSnapshot = { geometryOptions, materials }

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
