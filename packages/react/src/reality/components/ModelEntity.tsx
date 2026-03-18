import React, { forwardRef, useEffect, useRef } from 'react'
import {
  SpatialMaterial,
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

    // Dynamic material override
    useEffect(() => {
      if (!ctx || !entityRef.current || !materials) return
      if (shallowEqualArray(lastMaterialsRef.current, materials)) return
      lastMaterialsRef.current = materials

      const apply = async () => {
        try {
          const materialList: SpatialMaterial[] = (
            await Promise.all(
              materials.map(mid =>
                ctx.resourceRegistry.get<SpatialMaterial>(mid),
              ),
            )
          ).filter(Boolean)
          if (entityRef.current && materialList.length > 0) {
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
            const modelAsset = await ctx!.resourceRegistry.get(model)
            if (!modelAsset)
              throw new Error(`ModelEntity: model not found ${model}`)
            if (signal.aborted) return null as any

            const ent = await ctx!.session.createSpatialModelEntity(
              {
                modelAssetId: modelAsset.id,
                name,
              },
              { id, name },
            )
            entityRef.current = ent as CoreSpatialModelEntity

            // Apply initial materials if specified
            if (materials && materials.length > 0) {
              const materialList: SpatialMaterial[] = (
                await Promise.all(
                  materials.map(mid =>
                    ctx!.resourceRegistry.get<SpatialMaterial>(mid),
                  ),
                )
              ).filter(Boolean)
              if (materialList.length > 0 && !signal.aborted) {
                await ent.setMaterials(materialList)
              }
              lastMaterialsRef.current = materials
            }

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
