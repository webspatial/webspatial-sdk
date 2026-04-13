import React, { forwardRef, useEffect, useRef } from 'react'
import {
  SpatialMaterial,
  SpatialModelAsset,
  SpatialModelEntity as CoreSpatialModelEntity,
} from '@webspatial/core-sdk'
import { EntityProps, EntityEventHandler } from '../type'
import { EntityRefShape } from '../hooks'
import { BaseEntity } from './BaseEntity'
import { useRealityContext } from '../context'
import { shallowEqualArray } from '../utils'

type Props = EntityProps & {
  model: string
  materials?: string[]
} & EntityEventHandler & {
    children?: React.ReactNode
  }

export const ModelEntity = forwardRef<EntityRefShape, Props>(
  ({ id, model, children, name, materials, ...rest }, ref) => {
    const ctx = useRealityContext()
    const entityRef = useRef<CoreSpatialModelEntity | null>(null)
    const lastMaterialsRef = useRef<string[] | undefined>(undefined)

    // TODO(P2): Material overrides run async (`Promise.all` + `setMaterials`) with no generation/abort
    // guard; a slower resolve can apply after a newer prop update and leave native materials stale vs
    // React. Mirror `rebuildGen` in GeometryEntity so only the latest apply runs after awaits.
    // Dynamic material override (including clearing: props may go from ids to undefined / [])
    useEffect(() => {
      if (!ctx || !entityRef.current) return
      const next = materials ?? []
      const prev = lastMaterialsRef.current ?? []
      if (shallowEqualArray(prev, next)) return
      lastMaterialsRef.current = next

      const apply = async () => {
        try {
          const materialList: SpatialMaterial[] = (
            await Promise.all(
              next
                .map(mid =>
                  ctx.resourceRegistry.get<SpatialMaterial>('material', mid),
                )
                .filter(
                  (p): p is Promise<SpatialMaterial> => p !== undefined,
                ),
            )
          )
          if (entityRef.current) {
            await entityRef.current.setMaterials(materialList)
          }
        } catch (error) {
          console.error('ModelEntity: failed to set materials', error)
        }
      }
      apply()
    }, [ctx, materials])

    return (
      <BaseEntity
        {...rest}
        id={id}
        ref={ref}
        recreateKey={model}
        createEntity={async (ctx, signal) => {
          try {
            const modelPromise = ctx!.resourceRegistry.get<SpatialModelAsset>(
              'modelAsset',
              model,
            )
            if (!modelPromise)
              throw new Error(`ModelEntity: model not found ${model}`)
            const modelAsset = await modelPromise
            if (signal.aborted) return null as any

            const ent = await ctx!.session.createSpatialModelEntity(
              {
                modelAssetId: modelAsset.id,
                name,
              },
              { id, name },
            )
            entityRef.current = ent as CoreSpatialModelEntity

            // Apply initial materials if specified; always record baseline for later clears.
            if (materials && materials.length > 0) {
              const materialList: SpatialMaterial[] = (
                await Promise.all(
                  materials
                    .map(mid =>
                      ctx!.resourceRegistry.get<SpatialMaterial>(
                        'material',
                        mid,
                      ),
                    )
                    .filter(
                      (p): p is Promise<SpatialMaterial> => p !== undefined,
                    ),
                )
              )
              if (materialList.length > 0 && !signal.aborted) {
                await ent.setMaterials(materialList)
              }
            }
            lastMaterialsRef.current = materials ?? []

            return ent
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
