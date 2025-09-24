import { useImperativeHandle } from 'react'
import { Vec3, SpatialEntity } from '@webspatial/core-sdk'
import { useRealityContext } from '../context'

export type EntityRef = {
  convertFromEntityToEntity: (
    fromEntityId: string,
    toEntityId: string,
    position: Vec3,
  ) => Promise<Vec3>
  convertFromEntityToScene: (entityId: string, position: Vec3) => Promise<Vec3>
  convertFromSceneToEntity: (entityId: string, position: Vec3) => Promise<Vec3>
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
    convertFromEntityToScene: async (entityId, pos) => {
      if (!entity) return pos
      const ent = await ctx?.resourceRegistry.get(entityId)
      if (!ent) return pos
      return (await entity.convertFromEntityToScene(ent.id, pos)).data
    },
    convertFromSceneToEntity: async (entityId, pos) => {
      if (!entity) return pos
      const ent = await ctx?.resourceRegistry.get(entityId)
      if (!ent) return pos
      return (await entity.convertFromSceneToEntity(ent.id, pos)).data
    },
    id: entity?.userData?.id,
    name: entity?.userData?.name,
  }))
}
