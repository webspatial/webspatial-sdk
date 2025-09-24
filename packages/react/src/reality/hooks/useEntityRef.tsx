import { useImperativeHandle } from 'react'
import { Vec3, SpatialEntity } from '@webspatial/core-sdk'
import { useRealityContext } from '../context'

export type EntityRef = {
  convertFromEntityToEntity: (
    fromEntityId: string,
    toEntityId: string,
    position: Vec3,
  ) => Promise<Vec3>
  convertFromEntityToReality: (
    entityId: string,
    position: Vec3,
  ) => Promise<Vec3>
  convertFromRealityToEntity: (
    entityId: string,
    position: Vec3,
  ) => Promise<Vec3>
  id: string | undefined
  name: string | undefined
  entity: SpatialEntity | null
}

export const useEntityRef = (
  ref: React.Ref<EntityRef>,
  entity: SpatialEntity | null,
) => {
  const ctx = useRealityContext()

  useImperativeHandle(ref, () => ({
    convertFromEntityToEntity: async (fromEntityId, toEntityId, pos) => {
      if (!entity) return pos
      const fromEnt = await ctx?.resourceRegistry.get(fromEntityId)
      const toEnt = await ctx?.resourceRegistry.get(toEntityId)
      if (!fromEnt || !toEnt) return pos
      return (await entity.convertFromEntityToEntity(fromEnt.id, toEnt.id, pos))
        .data
    },
    convertFromEntityToReality: async (entityId, pos) => {
      if (!entity) return pos
      const ent = await ctx?.resourceRegistry.get(entityId)
      if (!ent) return pos
      return (await entity.convertFromEntityToScene(ent.id, pos)).data
    },
    convertFromRealityToEntity: async (entityId, pos) => {
      if (!entity) return pos
      const ent = await ctx?.resourceRegistry.get(entityId)
      if (!ent) return pos
      return (await entity.convertFromSceneToEntity(ent.id, pos)).data
    },
    id: entity?.userData?.id,
    name: entity?.userData?.name,
    entity,
  }))
}
